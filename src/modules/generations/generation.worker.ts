import { fal } from "@fal-ai/client";
import { AppEnv } from "../../config/env";
import { generationRepository } from "../../db/repositories/GenerationRepository";
import { redis } from "../../config/redis";
import { createWorker } from "../../queue/createWorker";
import type { GenerationJobData } from "../../queue/generation.queue";
import { logger } from "../../utils/logger";
import { copyRemoteImageToR2 } from "../../utils/r2";

const FASHN_MODEL_ID = "fal-ai/fashn/tryon/v1.6";
const GARMENT_MODEL_ID = "fal-ai/flux/schnell";
// FASHN v1.6 is currently listed at the same per-generation price across quality modes.
const PERFORMANCE_COST_ESTIMATE_USD = 0.075;
const GARMENT_COST_ESTIMATE_USD = 0.003;

function configuredSpendCap(): number | null {
  const value = Number(AppEnv.MAX_DAILY_GENERATION_SPEND_USD);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function nextUtcMidnightSeconds(): number {
  const tomorrow = new Date();
  tomorrow.setUTCHours(24, 0, 0, 0);
  return Math.ceil(tomorrow.getTime() / 1000);
}

async function reserveDailySpend(costUsd: number): Promise<boolean> {
  const cap = configuredSpendCap();
  if (cap === null) return true;

  const key = `generation:spend:${new Date().toISOString().slice(0, 10)}`;
  const script = `
    local current = tonumber(redis.call('GET', KEYS[1]) or '0')
    local requested = tonumber(ARGV[1])
    local cap = tonumber(ARGV[2])
    if current + requested > cap then return 0 end
    redis.call('INCRBYFLOAT', KEYS[1], requested)
    redis.call('EXPIREAT', KEYS[1], ARGV[3])
    return 1
  `;
  const result = await redis.eval(script, 1, key, String(costUsd), String(cap), String(nextUtcMidnightSeconds()));
  return Number(result) === 1;
}

export function startGenerationWorker() {
  return createWorker<GenerationJobData>("generation", async (job) => {
    const { generationId, inputImageUrl, generateGarment, prompt, garmentCategory = "auto" } = job.data;
    let garmentImageUrl = job.data.garmentImageUrl;
    await generationRepository.updateStatus(generationId, "processing");

    try {
      if (!AppEnv.FAL_KEY) {
        throw new Error("FAL_KEY is not configured");
      }

      const estimatedCost = PERFORMANCE_COST_ESTIMATE_USD + (generateGarment ? GARMENT_COST_ESTIMATE_USD : 0);
      if (!(await reserveDailySpend(estimatedCost))) {
        logger.warn({ generationId, estimatedCostUsd: estimatedCost }, "Generation skipped because daily spend cap would be exceeded");
        await generationRepository.updateStatus(generationId, "failed");
        return;
      }

      fal.config({ credentials: AppEnv.FAL_KEY });
      if (generateGarment) {
        const garmentResult = await fal.subscribe(GARMENT_MODEL_ID, {
          input: {
            prompt: `Professional ecommerce flat-lay product photograph of the complete wearable outfit described below. Show only the clothing, neatly arranged and fully visible, front view, centered on a plain white background, no person, no mannequin, no accessories outside the described outfit, no text, no watermark. Outfit description: ${prompt}`,
            image_size: "portrait_4_3",
            num_images: 1,
            output_format: "png",
            enable_safety_checker: true,
          },
        });
        const remoteGarmentUrl = garmentResult.data.images[0]?.url;
        if (!remoteGarmentUrl) throw new Error("Garment generator returned no image");
        garmentImageUrl = await copyRemoteImageToR2(remoteGarmentUrl, `generated-garments/${generationId}.png`);
        await generationRepository.updateStatus(generationId, "processing", {
          garment_image_url: garmentImageUrl,
        });
      }
      if (!garmentImageUrl) throw new Error("No garment image is available for the try-on");
      const result = await fal.subscribe(FASHN_MODEL_ID, {
        input: {
          model_image: inputImageUrl,
          garment_image: garmentImageUrl,
          mode: "quality",
          category: garmentCategory,
          garment_photo_type: "auto",
          moderation_level: "permissive",
          num_samples: 1,
          segmentation_free: false,
          output_format: "png",
        },
      });
      const remoteOutputUrl = result.data.images[0]?.url;
      if (!remoteOutputUrl) throw new Error("FASHN returned no output image");
      const outputImageUrl = await copyRemoteImageToR2(remoteOutputUrl, `generated-looks/${generationId}.png`);

      await generationRepository.updateStatus(generationId, "completed", {
        output_image_url: outputImageUrl,
        provider: "fal",
        provider_job_id: result.requestId,
        cost_usd: estimatedCost.toFixed(4),
      });
    } catch (error) {
      await generationRepository.updateStatus(generationId, "failed");
      logger.error({ err: error, generationId, inputImageUrl, garmentImageUrl }, "Try-on generation failed");
      throw error;
    }
  }, { concurrency: 2 });
}
