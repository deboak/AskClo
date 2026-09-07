import { createWorker } from "../../queue/createWorker";
import type { OtpJobData } from "../../queue/jobs/otp";
import { termiiService } from "./termii.service";

export function startOtpWorker() {
  return createWorker<OtpJobData>("otp", async (job) => {
    if (job.data.method !== "phone") throw new Error("Email OTP delivery is not configured");
    await termiiService.sendVerificationOtp(job.data.recipient, job.data.code);
  });
}
