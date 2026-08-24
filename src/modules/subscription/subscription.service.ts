import type { Transaction } from "objection";
import { subscriptionRepository, SubscriptionRepository } from "../../db/repositories/SubscriptionRepository";
import { AppError } from "../../utils/appError";
import { logger } from "../../utils/logger";

export type SubscriptionTier = "free_trial" | "basic" | "pro" | "gold";
export type PaidSubscriptionTier = Exclude<SubscriptionTier, "free_trial">;

const FREE_TRIAL_DAYS = 7;
const BILLING_PERIOD_DAYS = 30;

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export class SubscriptionService {
  constructor(private readonly subscriptionRepo: SubscriptionRepository) {}

  async createFreeTrialSubscription(userId: string, trx: Transaction) {
    const existing = await this.subscriptionRepo.findByUserId(userId);
    if (existing) return existing;

    const now = new Date();
    return this.subscriptionRepo.createInTrx({
      user_id: userId,
      tier: "free_trial",
      status: "active",
      current_period_start: now.toISOString(),
      current_period_end: addDays(now, FREE_TRIAL_DAYS).toISOString(),
    }, trx);
  }

  async getActiveSubscription(userId: string) {
    const subscription = await this.subscriptionRepo.findActiveByUserId(userId);
    if (!subscription) throw new AppError(404, "No active subscription found for this account");
    return subscription;
  }

  async activatePaidTier(userId: string, tier: PaidSubscriptionTier) {
    const subscription = await this.subscriptionRepo.findByUserId(userId);
    if (!subscription) throw new AppError(404, "No subscription found for this account");

    const now = new Date();
    const updated = await this.subscriptionRepo.updateById(subscription.id, {
      tier,
      status: "active",
      current_period_start: now.toISOString(),
      current_period_end: addDays(now, BILLING_PERIOD_DAYS).toISOString(),
    });
    logger.info({ userId, tier }, "Paid subscription activated");
    return updated;
  }

  async cancelSubscription(userId: string) {
    const subscription = await this.subscriptionRepo.updateByUserId(userId, { status: "cancelled" });
    if (!subscription) throw new AppError(404, "No subscription found for this account");
    return subscription;
  }

  async expireLapsedSubscriptions(): Promise<number> {
    const lapsed = await this.subscriptionRepo.findExpiredButActive();
    await Promise.all(lapsed.map(async (subscription) => {
      await this.subscriptionRepo.updateById(subscription.id, { status: "expired" });
      logger.info({ userId: subscription.user_id }, "Subscription expired");
    }));
    return lapsed.length;
  }

}

export const subscriptionService = new SubscriptionService(subscriptionRepository);
