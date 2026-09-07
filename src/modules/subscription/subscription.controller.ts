import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../utils/response";
import { subscriptionService, SubscriptionService } from "./subscription.service";

export class SubscriptionController {
  constructor(private readonly service: SubscriptionService) {}

  getCurrent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.getSubscriptionOverview(req.user.sub);
      sendSuccess(res, result, { message: "Subscription retrieved successfully" });
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const subscription = await this.service.cancelSubscription(req.user.sub);
      sendSuccess(res, {
        subscription,
        accessEndsAt: subscription.current_period_end,
      }, {
        message: "Cancellation scheduled. Your subscription benefits remain available until the current period ends.",
      });
    } catch (error) {
      next(error);
    }
  };

  getEntitlements = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, {
        free_trial: this.service.getTierEntitlements("free_trial"),
        basic: this.service.getTierEntitlements("basic"),
        pro: this.service.getTierEntitlements("pro"),
        gold: this.service.getTierEntitlements("gold"),
      }, { message: "Subscription entitlements retrieved successfully" });
    } catch (error) {
      next(error);
    }
  };
}

export const subscriptionController = new SubscriptionController(subscriptionService);
