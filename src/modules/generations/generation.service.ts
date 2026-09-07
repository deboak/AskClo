import { AppEnv } from "../../config/env";
import { GenerationModel, GenerationType } from "../../db/models/Generations";
import { generationRepository } from "../../db/repositories/GenerationRepository";
import { profileRepository } from "../../db/repositories/ProfileRepository";
import { garmentRepository } from "../../db/repositories/GarmentRepository";
import { subscriptionRepository } from "../../db/repositories/SubscriptionRepository";
import { queueGenerationJob } from "../../queue/generation.queue";
import { AppError } from "../../utils/appError";
import { db } from "../../config/db";

export interface RequestGenerationInput {
  type: GenerationType;
  prompt?: string;
  garmentId: string;
  genericModelGender?: "male" | "female";
}

const FREE_TIER_GENERATION_LIMIT = 2;
const EPOCH = new Date(0);

export class GenerationService {
  async requestGeneration(userId: string, input: RequestGenerationInput): Promise<GenerationModel> {
    const subscription = await subscriptionRepository.findActiveByUserId(userId);
    if (!subscription) throw new AppError(403, "An active subscription is required to generate try-ons");

    const [profile, garment] = await Promise.all([
      profileRepository.findByUserId(userId),
      garmentRepository.findByIdAndUserId(input.garmentId, userId),
    ]);
    if (!garment) throw new AppError(404, "Garment not found");
    const inputImageUrl = await this.resolveModelImage(
      userId,
      input.type,
      subscription.tier,
      input.genericModelGender,
      profile?.gender,
    );
    const generation = await db.transaction(async (trx) => {
      if (subscription.tier === "free_trial") {
        await trx.raw("select pg_advisory_xact_lock(hashtext(?))", [`generation-allowance:${userId}`]);
        const reserved = await generationRepository.countReservedByUserSinceInTrx(userId, EPOCH, trx);
        if (reserved >= FREE_TIER_GENERATION_LIMIT) {
          throw new AppError(403, "Your two free try-on generations have been used");
        }
      }
      return generationRepository.createInTrx({
        user_id: userId,
        type: input.type,
        status: "pending",
        input_image_url: inputImageUrl,
        garment_image_url: garment.image_url,
        prompt: input.prompt?.trim() || null,
      }, trx);
    });

    await queueGenerationJob({
      generationId: generation.id,
      prompt: generation.prompt ?? "",
      inputImageUrl,
      garmentImageUrl: garment.image_url,
      garmentCategory: garment.category === "tops" || garment.category === "bottoms" || garment.category === "one-pieces"
        ? garment.category
        : "auto",
    });
    return generation;
  }

  async getGeneration(userId: string, generationId: string) {
    const generation = await generationRepository.findByIdAndUserId(generationId, userId);
    if (!generation) throw new AppError(404, "Generation not found");
    return generation;
  }

  async listGenerations(userId: string) { return generationRepository.findAllByUserId(userId); }

  private async resolveModelImage(
    userId: string,
    type: GenerationType,
    tier: string,
    genericModelGender?: "male" | "female",
    profileGender?: string | null,
  ): Promise<string> {
    if (type === "generic_model") {
      const selectedGender = genericModelGender ?? (profileGender === "male" || profileGender === "female" ? profileGender : undefined);
      if (!selectedGender) {
        throw new AppError(400, "Choose a male or female generic model");
      }
      const imageUrl = selectedGender === "male"
        ? AppEnv.GENERIC_MALE_MODEL_IMAGE_URL
        : AppEnv.GENERIC_FEMALE_MODEL_IMAGE_URL;
      if (!imageUrl) {
        throw new AppError(503, `The ${selectedGender} generic model is not configured yet`);
      }
      return imageUrl;
    }

    if (tier !== "pro" && tier !== "gold") {
      throw new AppError(403, "Using your own photo is available on Pro and Gold plans");
    }
    const profile = await profileRepository.findByUserId(userId);
    if (!profile?.photo_url) {
      throw new AppError(400, "Upload a profile photo before generating a try-on with your own image");
    }
    return profile.photo_url;
  }
}

export const generationService = new GenerationService();
