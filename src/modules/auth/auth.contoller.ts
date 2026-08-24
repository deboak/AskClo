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
}

export const authController = new AuthController(authService);
