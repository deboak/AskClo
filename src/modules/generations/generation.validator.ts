import { z } from "zod";

export const requestGenerationSchema = z.object({
  body: z.object({
    type: z.enum(["generic_model", "own_photo"]),
    genericModelGender: z.enum(["male", "female"]).optional(),
    garmentId: z.string().uuid(),
    prompt: z.string().trim().max(2_000).optional(),
  }),
});
