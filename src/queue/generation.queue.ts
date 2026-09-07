import { queueManager } from "./queueManager";

export interface GenerationJobData {
  generationId: string;
  prompt: string;
  inputImageUrl: string;
  garmentImageUrl: string;
  garmentCategory: "tops" | "bottoms" | "one-pieces" | "auto";
}

export function queueGenerationJob(data: GenerationJobData) {
  return queueManager.add("generation", "generate-try-on", data, {
    attempts: 1,
    removeOnComplete: 100,
    removeOnFail: 500,
  });
}
