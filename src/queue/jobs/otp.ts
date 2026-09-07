import { queueManager } from "../queueManager";

export type OtpDeliveryMethod = "email" | "phone";

export interface OtpJobData {
  userId: string;
  method: OtpDeliveryMethod;
  recipient: string;
  code: string;
}

/** Queues delivery of a verification code after the code has been stored in Redis. */
export function queueOtpJob(data: OtpJobData) {
  return queueManager.add("otp", "send-verification-otp", data, {
    jobId: `otp-${data.method}-${data.userId}`,
    attempts: 3,
    backoff: { type: "exponential", delay: 1_000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  });
}
