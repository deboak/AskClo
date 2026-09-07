import { createHmac, timingSafeEqual } from "crypto";
import type { NextFunction, Request, Response } from "express";
import { Paystack } from "../../config/env";
import { AppError } from "../../utils/appError";
import { sendSuccess } from "../../utils/response";
import { paymentService } from "./payment.service";

export const paymentController = {
  initialize: async (req: Request, res: Response, next: NextFunction) => { try { sendSuccess(res, await paymentService.initializePaystackCheckout(req.user.sub, req.body.tier)); } catch (error) { next(error); } },
  webhook: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!Paystack.WEBHOOK_SECRET) throw new AppError(503, "Paystack webhook is not configured");
      const signature = String(req.headers["x-paystack-signature"] ?? "");
      const expected = createHmac("sha512", Paystack.WEBHOOK_SECRET).update(req.body as Buffer).digest("hex");
      if (!signature || signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new AppError(401, "Invalid Paystack webhook signature");
      await paymentService.handleVerifiedPaystackEvent(JSON.parse((req.body as Buffer).toString("utf8")));
      res.sendStatus(200);
    } catch (error) { next(error); }
  },
};
