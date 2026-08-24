import { SendGrid } from "../../config/env";
import { AppError } from "../../utils/appError";
export class SendGridService {
  async sendEmail(to: string, subject: string, text: string): Promise<void> {
    if (!SendGrid.API_KEY || !SendGrid.FROM_EMAIL) throw new AppError(503, "Email delivery is not configured");
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST", headers: { Authorization: `Bearer ${SendGrid.API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ personalizations: [{ to: [{ email: to }] }], from: { email: SendGrid.FROM_EMAIL }, subject, content: [{ type: "text/plain", value: text }] }),
    });
    if (!response.ok) throw new AppError(502, "Unable to send email");
  }
}
export const sendGridService = new SendGridService();
