import { createWorker } from "../../queue/createWorker";
import type { NotificationJobData } from "../../queue/jobs/notification";
import { emailService } from "./email.service";
export function startNotificationWorker() {
  return createWorker<NotificationJobData>("notification", async (job) => {
    if (job.data.channel !== "email" || !job.data.recipient) throw new Error(`Unsupported notification channel: ${job.data.channel}`);
    await emailService.sendEmail(job.data.recipient, job.data.title, job.data.message);
  });
}
