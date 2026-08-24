import { queueManager } from "../queueManager";

export type NotificationChannel = "email" | "sms" | "push" | "in_app";

export interface NotificationJobData {
  userId?: string;
  channel: NotificationChannel;
  recipient?: string;
  title: string;
  message: string;
  data?: Record<string, string>;
}

/**
 * Queues a notification for a delivery worker. `recipient` is required for
 * email, SMS, and push delivery; in-app notifications are addressed by userId.
 */
export function queueNotificationJob(data: NotificationJobData) {
  return queueManager.add("notification", "send-notification", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2_000 },
    removeOnComplete: 500,
    removeOnFail: 1_000,
  });
}
