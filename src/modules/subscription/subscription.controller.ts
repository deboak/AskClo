import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../utils/response";
import { subscriptionService, SubscriptionService } from "./subscription.service";

export class SubscriptionController {
  constructor(private readonly service: SubscriptionService) {}

  getCurrent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, await this.service.getActiveSubscription(req.user.sub));
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, await this.service.cancelSubscription(req.user.sub), {
        message: "Subscription cancelled successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}

export const subscriptionController = new SubscriptionController(subscriptionService);
