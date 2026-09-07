import { z } from "zod";

export const sendMessageSchema = z.object({
  body: z.object({
    content: z.string().trim().min(1, "Message content is required").max(4_000),
    conversationId: z.string().uuid().optional(),
  }),
});

export const conversationHistorySchema = z.object({
  params: z.object({
    conversationId: z.string().uuid(),
  }),
});

export const conversationMessageSchema = z.object({
  params: z.object({
    conversationId: z.string().uuid(),
  }),
  body: z.object({
    content: z.string().trim().min(1, "Message content is required").max(4_000),
  }),
});
