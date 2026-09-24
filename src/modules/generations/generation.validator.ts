import { z } from "zod";

export const requestGenerationSchema = z.object({
  body: z.object({
    type: z.enum(["generic_model", "own_photo"]),
    genericModelGender: z.enum(["male", "female"]).optional(),
    garmentId: z.string().uuid().optional(),
    generateGarment: z.boolean().optional().default(false),
    prompt: z.string().trim().max(2_000).optional(),
  }).superRefine((body, ctx) => {
    if (!body.garmentId && !body.generateGarment) {
      ctx.addIssue({ code: "custom", path: ["garmentId"], message: "Choose a garment source" });
    }
    if (body.generateGarment && !body.prompt) {
      ctx.addIssue({ code: "custom", path: ["prompt"], message: "A styling description is required for an AI garment" });
    }
  }),
});
