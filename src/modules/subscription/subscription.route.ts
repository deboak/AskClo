import { Router } from "express";
import { auth } from "../../middlewares/authenticate";
import { subscriptionController } from "./subscription.controller";

const subscriptionRouter = Router();

subscriptionRouter.get("/current", auth, subscriptionController.getCurrent);
subscriptionRouter.post("/cancel", auth, subscriptionController.cancel);

export default subscriptionRouter;
