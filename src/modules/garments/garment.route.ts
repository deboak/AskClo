import { Router, raw } from "express";
import { auth } from "../../middlewares/authenticate";
import { createRateLimiter } from "../../middlewares/rateLimiter";
import { sendSuccess } from "../../utils/response";
import { garmentService } from "./garment.service";

const garmentRouter = Router();
garmentRouter.get("/", auth, async (req, res, next) => { try { sendSuccess(res, await garmentService.list(req.user.sub)); } catch (error) { next(error); } });
garmentRouter.post("/upload", auth, createRateLimiter({ windowMs: 60_000, max: 10 }), raw({ type: "image/*", limit: "10mb" }), async (req, res, next) => {
  try { const contentType = String(req.headers["content-type"] ?? "").split(";", 1)[0]; sendSuccess(res, await garmentService.upload(req.user.sub, req.body as Buffer, contentType), { statusCode: 201 }); } catch (error) { next(error); }
});
export default garmentRouter;
