import { z } from "zod";

export const updateGarmentSchema = z.object({
  params: z.object({ garmentId: z.string().uuid() }),
  body: z.object({
    name: z.string().trim().min(1).max(120).nullable().optional(),
    category: z.enum(["tops", "bottoms", "one-pieces", "other"]).nullable().optional(),
    colour: z.string().trim().min(1).max(50).nullable().optional(),
  }),
});
