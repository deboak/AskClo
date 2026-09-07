import { Router, raw } from "express";
import { auth } from "../../middlewares/authenticate";
import { createRateLimiter } from "../../middlewares/rateLimiter";
import { profileController } from "./profile.controller";
import { validate } from "../../middlewares/validate";
import { updateProfileSchema } from "./profile.validator";

const profileRouter = Router();

profileRouter.get("/", auth, profileController.get);
profileRouter.patch("/", auth, validate(updateProfileSchema), profileController.update);
profileRouter.post(
  "/photo",
  auth,
  createRateLimiter({ windowMs: 60_000, max: 5, message: "Too many profile photo uploads" }),
  raw({ type: "image/*", limit: "10mb" }),
  profileController.uploadPhoto,
);

export default profileRouter;
