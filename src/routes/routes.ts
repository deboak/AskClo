import {Router} from "express"
import authRouter from "../modules/auth/auth.route";
import chatRouter from "../modules/chat/chat.route";
import subscriptionRouter from "../modules/subscription/subscription.route";
import generationRouter from "../modules/generations/generation.route";
import profileRouter from "../modules/profile/profile.route";
import garmentRouter from "../modules/garments/garment.route";
import paymentRouter from "../modules/payment/payment.route";

const router = Router()

router.use("/auth", authRouter);
router.use("/chat", chatRouter);
router.use("/subscriptions", subscriptionRouter);
router.use("/generations", generationRouter);
router.use("/profile", profileRouter);
router.use("/garments", garmentRouter);
router.use("/payments", paymentRouter);

export default router;
