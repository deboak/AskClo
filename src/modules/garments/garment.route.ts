import { Router, raw } from "express";
import { auth } from "../../middlewares/authenticate";
import { createRateLimiter } from "../../middlewares/rateLimiter";
import { garmentController } from "./garment.controller";
import { validate } from "../../middlewares/validate";
import { updateGarmentSchema } from "./garment.validator";

const garmentRouter = Router();
garmentRouter.get("/", auth, garmentController.list);
garmentRouter.post("/upload", auth, createRateLimiter({ windowMs: 60_000, max: 10 }), raw({ type: "image/*", limit: "10mb" }), garmentController.upload);
garmentRouter.patch("/:garmentId", auth, validate(updateGarmentSchema), garmentController.update);
export default garmentRouter;
