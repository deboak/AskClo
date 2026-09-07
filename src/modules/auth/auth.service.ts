import bcrypt from "bcrypt";
import { UserModel } from "../../db/models/User";
import { UserRepository, userRepository } from "../../db/repositories/UserRepository";
import { AppError } from "../../utils/appError";
import { signAccessToken, signRefreshToken, verifyRefreshToken, getRefreshTtlSeconds } from "../../utils/jwt";
import { normalizeNigerianPhoneNumber } from "../../utils/phoneNumber";
import { OtpStore, otpStore } from "./otp.store";
import { TermiiService, termiiService } from "./termii.service";
import { subscriptionService } from "../subscription/subscription.service";
import { db } from "../../config/db";
import { redis } from "../../config/redis";
import { queueOtpJob } from "../../queue/jobs/otp";
import { queueNotificationJob } from "../../queue/jobs/notification";
import { profileRepository } from "../../db/repositories/ProfileRepository";

const PASSWORD_SALT_ROUNDS = 12;

export interface RegisterInput {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  password: string;
}

export interface LoginInput {
  identifier: string;
  password: string;
}

export type VerificationMethod = "email" | "phone";

function toPublicUser(user: UserModel) {
  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone_number: user.phone_number,
    role: user.role,
    email_verified: user.email_verified,
    phone_verified: user.phone_verified,
  };
}

function issueTokens(user: UserModel) {
  const scope = "full";

  return {
    access_token: signAccessToken(user.id, scope, user.role),
    refresh_token: signRefreshToken(user.id, scope),
    user: toPublicUser(user),
  };
}

function issueProvisionalAccessToken(user: UserModel) {
  return {
    access_token: signAccessToken(user.id, "provisional", user.role),
    verification_required: true,
    user: toPublicUser(user),
  };
}

export class AuthService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly otpStore: OtpStore,
    private readonly smsService: TermiiService,
  ) {}

  async register(input: RegisterInput) {
    const email = input.email.trim().toLowerCase();
    const phoneNumber = normalizeNigerianPhoneNumber(input.phone_number).e164;

    const [emailInUse, phoneInUse] = await Promise.all([
      this.userRepo.findByEmail(email),
      this.userRepo.findByPhoneNumber(phoneNumber),
    ]);

    if (emailInUse || phoneInUse) {
      throw new AppError(409, "An account already exists with this email or phone number");
    }

    const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);
    const user = await UserModel.transaction(async (trx) => {
      const createdUser = await this.userRepo.createInTrx(
        {
          first_name: input.first_name.trim(),
          last_name: input.last_name.trim(),
          email,
          phone_number: phoneNumber,
          password_hash: passwordHash,
          role: "user",
          email_verified: false,
          phone_verified: false,
        },
        trx,
      );
      await profileRepository.createInTrx({ user_id: createdUser.id }, trx);
      return createdUser;
    });

    const code = await this.otpStore.create(user.id, "phone");
    if (process.env.NODE_ENV === "production") {
      try {
        await queueOtpJob({ userId: user.id, method: "phone", recipient: phoneNumber, code });
      } catch (error) {
        await this.otpStore.remove(user.id, "phone");
        throw error;
      }
    }

    return issueProvisionalAccessToken(user);
  }

  async login(input: LoginInput) {
    const identifier = input.identifier.trim();
    const isEmail = identifier.includes("@");
    const user = isEmail
      ? await this.userRepo.findByEmail(identifier.toLowerCase())
      : await this.userRepo.findByPhoneNumber(normalizeNigerianPhoneNumber(identifier).e164);

    if (!user?.password_hash || !(await bcrypt.compare(input.password, user.password_hash))) {
      throw new AppError(401, "Invalid email, phone number, or password");
    }

    if (!user.is_active || user.is_deleted || user.is_blocked) {
      throw new AppError(403, "This account is not available");
    }

    if (!user.email_verified && !user.phone_verified) {
      throw new AppError(403, "Verify your email or phone number before signing in");
    }

    return issueTokens(user);
  }

  async completeVerification(
    method: VerificationMethod,
    code: string,
    identifier: { email?: string; phone_number?: string },
  ) {
    const user = method === "email"
      ? await this.userRepo.findByEmail(identifier.email ?? "")
      : await this.userRepo.findByPhoneNumber(normalizeNigerianPhoneNumber(identifier.phone_number ?? "").e164);
    if (!user) throw new AppError(400, "Invalid or expired verification code");

    const userId = user.id;
    await this.otpStore.verify(userId, method, code);

    const verifiedUser = await db.transaction(async (trx) => {
      const verifiedUser = await this.userRepo.updateByIdInTrx(userId, {
        ...(method === "email" ? { email_verified: true } : { phone_verified: true }),
      }, trx);

      if (method === "phone") {
        await subscriptionService.createFreeTrialSubscription(userId, trx);
      }

      return verifiedUser;
    });

    return issueTokens(verifiedUser);
  }

  async resendVerificationOtp(userId: string): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user?.phone_number) throw new AppError(404, "Account not found");
    if (user.phone_verified) throw new AppError(400, "Phone number is already verified");
    const cooldownKey = `auth:otp-resend:${userId}`;
    if (!(await redis.set(cooldownKey, "1", "EX", 60, "NX"))) {
      throw new AppError(429, "Please wait before requesting another code");
    }
    const code = await this.otpStore.create(userId, "phone");
    if (process.env.NODE_ENV === "production") await queueOtpJob({ userId, method: "phone", recipient: user.phone_number, code });
  }

  async refresh(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    if (await redis.get(`auth:revoked-refresh:${payload.sid}`)) throw new AppError(401, "Refresh token has been revoked");
    const user = await this.userRepo.findById(payload.sub);
    if (!user || !user.is_active || user.is_deleted || user.is_blocked) throw new AppError(401, "Account is not available");
    await redis.set(`auth:revoked-refresh:${payload.sid}`, "1", "EX", getRefreshTtlSeconds());
    return issueTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
    const payload = verifyRefreshToken(refreshToken);
    await redis.set(`auth:revoked-refresh:${payload.sid}`, "1", "EX", getRefreshTtlSeconds());
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) return;
    const cooldownKey = `auth:password-reset:${user.id}`;
    if (!(await redis.set(cooldownKey, "1", "EX", 60, "NX"))) throw new AppError(429, "Please wait before requesting another reset code");
    const code = await this.otpStore.create(user.id, "email");
    if (process.env.NODE_ENV === "production") await queueNotificationJob({ userId: user.id, channel: "email", recipient: email, title: "Reset your AskClo password", message: `Your AskClo password reset code is ${code}. It expires in 10 minutes.` });
  }

  async resetPassword(email: string, code: string, password: string): Promise<void> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new AppError(400, "Invalid or expired reset code");
    await this.otpStore.verify(user.id, "email", code);
    await this.userRepo.updateById(user.id, { password_hash: await bcrypt.hash(password, PASSWORD_SALT_ROUNDS) });
  }
}

export const authService = new AuthService(userRepository, otpStore, termiiService);
