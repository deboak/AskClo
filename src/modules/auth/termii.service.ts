import { Termii } from "../../config/env";
import { AppError } from "../../utils/appError";

export class TermiiService {
  async sendVerificationOtp(phoneNumber: string, code: string): Promise<void> {
    if (!Termii.API_KEY || !Termii.SENDER_ID) {
      throw new AppError(503, "SMS verification is not configured");
    }

    const response = await fetch(`${Termii.BASE_URL}/sms/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: phoneNumber.replace(/^\+/, ""),
        from: Termii.SENDER_ID,
        sms: `Your AskClo verification code is ${code}. It expires in 10 minutes.`,
        type: "plain",
        channel: "dnd",
        api_key: Termii.API_KEY,
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new AppError(502, `Unable to send verification SMS: ${details}`);
    }
  }
}

export const termiiService = new TermiiService();
