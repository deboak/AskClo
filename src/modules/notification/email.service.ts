import nodemailer from "nodemailer";
import { Email } from "../../config/env";
import { AppError } from "../../utils/appError";
import { sendGridService } from "./sendgrid.service";

export class EmailService {
  private gmailTransport() {
    if (!Email.GMAIL_USER || !Email.GMAIL_APP_PASSWORD) {
      throw new AppError(503, "Gmail email delivery is not configured");
    }

    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: Email.GMAIL_USER,
        pass: Email.GMAIL_APP_PASSWORD.replace(/\s/g, ""),
      },
    });
  }

  async sendEmail(to: string, subject: string, text: string): Promise<void> {
    if (Email.PROVIDER === "gmail") {
      await this.gmailTransport().sendMail({
        from: { name: "AskClo", address: Email.GMAIL_USER! },
        replyTo: Email.GMAIL_USER,
        to,
        subject,
        text,
      });
      return;
    }

    if (Email.PROVIDER === "sendgrid") {
      await sendGridService.sendEmail(to, subject, text);
      return;
    }

    throw new AppError(503, `Unsupported email provider: ${Email.PROVIDER}`);
  }
}

export const emailService = new EmailService();
