import { Router } from "express";
import { auth } from "../../middlewares/authenticate";
import { validate } from "../../middlewares/validate";
import { paymentController } from "./payment.controller";
import { initializeCheckoutSchema } from "./payment.validator";
const paymentRouter = Router();
paymentRouter.post("/paystack/webhook", paymentController.webhook);
paymentRouter.post("/checkout", auth, validate(initializeCheckoutSchema), paymentController.initialize);
export default paymentRouter;
