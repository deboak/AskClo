import { z } from "zod";

const password = z.string().min(8, "Password must be at least 8 characters");

export const registerSchema = z.object({
  body: z.object({
    first_name: z.string().trim().min(1).max(100),
    last_name: z.string().trim().min(1).max(100),
    email: z.string().trim().email().transform((value) => value.toLowerCase()).optional(),
    phone_number: z.string().trim().min(7).max(30),
    password,
  }),
});

export const loginSchema = z.object({
  body: z.object({
    identifier: z.string().trim().min(1, "Email or phone number is required"),
    password,
  }),
});

export const verifyContactSchema = z.object({
  body: z.object({
    method: z.enum(["email", "phone"]),
    code: z.string().regex(/^\d{6}$/, "Verification code must be 6 digits"),
  }),
});
