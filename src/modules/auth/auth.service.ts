import bcrypt from "bcrypt";
import { UserModel } from "../../db/models/User";
import { UserRepository, userRepository } from "../../db/repositories/UserRepository";
import { AppError } from "../../utils/appError";
import { signAccessToken, signRefreshToken } from "../../utils/jwt";
import { normalizeNigerianPhoneNumber } from "../../utils/phoneNumber";
import { OtpStore, otpStore } from "./otp.store";
import { TermiiService, termiiService } from "./termii.service";

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
    const user = await UserModel.transaction((trx) =>
      this.userRepo.createInTrx(
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
      ),
    );

    const code = await this.otpStore.create(user.id, "phone");
    if (process.env.NODE_ENV === "production") {
      try {
        await this.smsService.sendVerificationOtp(phoneNumber, code);
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

  async completeVerification(userId: string, method: VerificationMethod, code: string) {
    await this.otpStore.verify(userId, method, code);

    const user = await this.userRepo.updateById(userId, {
      ...(method === "email" ? { email_verified: true } : { phone_verified: true }),
    });

    return issueTokens(user);
  }
}

export const authService = new AuthService(userRepository, otpStore, termiiService);
