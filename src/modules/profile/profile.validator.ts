import { z } from "zod";

const profileFields = z.object({
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).nullable().optional(),
  date_of_birth: z.coerce.date().nullable().optional(),
  style_preference: z.string().trim().min(1).max(100).nullable().optional(),
  body_type: z.string().trim().min(1).max(100).nullable().optional(),
  age: z.string().trim().min(1).max(20).nullable().optional(),
  cultural_preference: z.string().trim().min(1).max(100).nullable().optional(),
});

export const updateProfileSchema = z.object({ body: profileFields });
