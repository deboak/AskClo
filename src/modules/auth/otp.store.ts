import bcrypt from "bcrypt";
import { randomInt } from "crypto";
import type Redis from "ioredis";
import { redis } from "../../config/redis";
import { AppError } from "../../utils/appError";
import { logger } from "../../utils/logger";
import type { VerificationMethod } from "./auth.service";

const OTP_TTL_SECONDS = 10 * 60;
const OTP_HASH_ROUNDS = 10;

export class OtpStore {
  constructor(private readonly client: Redis) {}

  private key(userId: string, method: VerificationMethod): string {
    return `auth:verification-otp:${method}:${userId}`;
  }

  async create(userId: string, method: VerificationMethod): Promise<string> {
    const code = process.env.NODE_ENV === "production"
      ? randomInt(100_000, 1_000_000).toString()
      : "000000";
    const codeHash = await bcrypt.hash(code, OTP_HASH_ROUNDS);
    await this.client.set(this.key(userId, method), codeHash, "EX", OTP_TTL_SECONDS);

    if (process.env.NODE_ENV !== "production") {
      logger.info({ userId, method }, "Development verification OTP generated: 000000");
    }

    return code;
  }

  async remove(userId: string, method: VerificationMethod): Promise<void> {
    await this.client.del(this.key(userId, method));
  }

  async verify(userId: string, method: VerificationMethod, code: string): Promise<void> {
    const key = this.key(userId, method);
    const codeHash = await this.client.get(key);

    if (!codeHash || !(await bcrypt.compare(code, codeHash))) {
      throw new AppError(400, "Invalid or expired verification code");
    }

    await this.client.del(key);
  }
}

export const otpStore = new OtpStore(redis);
