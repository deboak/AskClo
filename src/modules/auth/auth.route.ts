import { Router } from "express";
import { allowPartialAuth } from "../../middlewares/authenticate";
import { validate } from "../../middlewares/validate";
import { authController } from "./auth.contoller";
import { captchaSchema, loginSchema, refreshSchema, registerSchema, requestPasswordResetSchema, resetPasswordSchema, verifyContactSchema } from "./auth.validator";
import { createRateLimiter } from "../../middlewares/rateLimiter";

const authRouter = Router();

authRouter.post("/register", createRateLimiter({ windowMs: 60 * 60 * 1000, max: 10 }), validate(registerSchema), authController.register);
authRouter.post("/login", validate(loginSchema), authController.login);
authRouter.post("/verify", validate(verifyContactSchema), authController.verifyContact);
authRouter.post("/resend-otp", createRateLimiter({ windowMs: 60 * 60 * 1000, max: 5 }), allowPartialAuth, validate(captchaSchema), authController.resendOtp);
authRouter.post("/refresh", validate(refreshSchema), authController.refresh);
authRouter.post("/logout", validate(refreshSchema), authController.logout);
authRouter.post("/password-reset/request", createRateLimiter({ windowMs: 60 * 60 * 1000, max: 5 }), validate(requestPasswordResetSchema), authController.requestPasswordReset);
authRouter.post("/password-reset/confirm", validate(resetPasswordSchema), authController.resetPassword);

export default authRouter;
