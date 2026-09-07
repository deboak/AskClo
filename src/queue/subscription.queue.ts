import { queueManager } from "./queueManager";
export function scheduleSubscriptionExpiry() {
  return queueManager.add("subscription", "expire-lapsed", {}, { jobId: "expire-lapsed-daily", repeat: { pattern: "0 0 * * *" }, removeOnComplete: 10, removeOnFail: 100 });
}
