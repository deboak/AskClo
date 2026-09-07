import { Router } from "express";
import { allowPartialAuth } from "../../middlewares/authenticate";
import { validate } from "../../middlewares/validate";
import { authController } from "./auth.contoller";
import { loginSchema, refreshSchema, registerSchema, requestPasswordResetSchema, resetPasswordSchema, verifyContactSchema } from "./auth.validator";

const authRouter = Router();

authRouter.post("/register", validate(registerSchema), authController.register);
authRouter.post("/login", validate(loginSchema), authController.login);
authRouter.post("/verify", validate(verifyContactSchema), authController.verifyContact);
authRouter.post("/resend-otp", allowPartialAuth, authController.resendOtp);
authRouter.post("/refresh", validate(refreshSchema), authController.refresh);
authRouter.post("/logout", validate(refreshSchema), authController.logout);
authRouter.post("/password-reset/request", validate(requestPasswordResetSchema), authController.requestPasswordReset);
authRouter.post("/password-reset/confirm", validate(resetPasswordSchema), authController.resetPassword);

export default authRouter;
