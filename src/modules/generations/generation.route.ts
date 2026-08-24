import { Router } from "express";
import { auth } from "../../middlewares/authenticate";
import { createRateLimiter } from "../../middlewares/rateLimiter";
import { validate } from "../../middlewares/validate";
import { generationController } from "./generation.controller";
import { requestGenerationSchema } from "./generation.validator";

const generationRouter = Router();

generationRouter.get("/", auth, generationController.list);
generationRouter.get("/:generationId", auth, generationController.get);
generationRouter.post(
  "/",
  auth,
  createRateLimiter({ windowMs: 60_000, max: 10, message: "Too many generation requests" }),
  validate(requestGenerationSchema),
  generationController.request,
);

export default generationRouter;
