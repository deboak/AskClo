import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../utils/response";
import { AuthService, authService } from "./auth.service";

export class AuthController {
  constructor(private readonly service: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.register(req.body);
      sendSuccess(res, result, { statusCode: 201, message: "Account created successfully" });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.login(req.body);
      sendSuccess(res, result, { message: "Signed in successfully" });
    } catch (error) {
      next(error);
    }
  };

  verifyContact = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.completeVerification(
        req.user.sub,
        req.body.method,
        req.body.code,
      );
      sendSuccess(res, result, { message: "Contact verified successfully" });
    } catch (error) {
      next(error);
    }
  };

  resendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { await this.service.resendVerificationOtp(req.user.sub); sendSuccess(res, null, { message: "Verification code sent" }); } catch (error) { next(error); }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { sendSuccess(res, await this.service.refresh(req.body.refresh_token)); } catch (error) { next(error); }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { await this.service.logout(req.body.refresh_token); sendSuccess(res, null, { message: "Signed out successfully" }); } catch (error) { next(error); }
  };

  requestPasswordReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { await this.service.requestPasswordReset(req.body.email); sendSuccess(res, null, { message: "If that account exists, a reset code has been sent" }); } catch (error) { next(error); }
  };
  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { await this.service.resetPassword(req.body.email, req.body.code, req.body.password); sendSuccess(res, null, { message: "Password reset successfully" }); } catch (error) { next(error); }
  };
}

export const authController = new AuthController(authService);
