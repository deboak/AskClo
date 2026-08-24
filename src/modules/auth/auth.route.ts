import { Router } from "express";
import { allowPartialAuth } from "../../middlewares/authenticate";
import { validate } from "../../middlewares/validate";
import { authController } from "./auth.contoller";
import { loginSchema, registerSchema, verifyContactSchema } from "./auth.validator";

const authRouter = Router();

authRouter.post("/register", validate(registerSchema), authController.register);
authRouter.post("/login", validate(loginSchema), authController.login);
authRouter.post("/verify", allowPartialAuth, validate(verifyContactSchema), authController.verifyContact
);

export default authRouter;
