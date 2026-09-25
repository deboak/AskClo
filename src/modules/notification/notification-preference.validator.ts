import { z } from "zod";

export const updateNotificationPreferencesSchema = z.object({
  body: z.object({
    styling_emails: z.boolean().optional(),
    try_on_alerts: z.boolean().optional(),
    product_news: z.boolean().optional(),
  }).refine((body) => Object.keys(body).length > 0, "At least one preference is required"),
});
