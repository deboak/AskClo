import { Router } from "express";
import { auth } from "../../middlewares/authenticate";
import { validate } from "../../middlewares/validate";
import { notificationPreferenceController } from "./notification-preference.controller";
import { updateNotificationPreferencesSchema } from "./notification-preference.validator";

const notificationRouter = Router();
notificationRouter.get("/preferences", auth, notificationPreferenceController.get);
notificationRouter.patch("/preferences", auth, validate(updateNotificationPreferencesSchema), notificationPreferenceController.update);
export default notificationRouter;
