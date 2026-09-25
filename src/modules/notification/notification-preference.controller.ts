import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../utils/response";
import { notificationPreferenceService } from "./notification-preference.service";

export class NotificationPreferenceController {
  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { sendSuccess(res, await notificationPreferenceService.get(req.user.sub)); }
    catch (error) { next(error); }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, await notificationPreferenceService.update(req.user.sub, req.body), {
        message: "Notification preferences updated",
      });
    } catch (error) { next(error); }
  };
}

export const notificationPreferenceController = new NotificationPreferenceController();
