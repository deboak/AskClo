import type { Transaction } from "objection";
import {
  subscriptionRepository,
  SubscriptionRepository,
} from "../../db/repositories/SubscriptionRepository";
import { AppError } from "../../utils/appError";
import { logger } from "../../utils/logger";

export type SubscriptionTier = "free_trial" | "basic" | "pro" | "gold";
export type PaidSubscriptionTier = Exclude<SubscriptionTier, "free_trial">;

const TIER_ENTITLEMENTS: Record<
  SubscriptionTier,
  {
    genericTryOn: boolean;
    ownPhotoTryOn: boolean;
    freeGenerationLimit: number | null;
    monthlyGenerationLimit: number | null;
  }
> = {
  free_trial: {
    genericTryOn: true,
    ownPhotoTryOn: false,
    freeGenerationLimit: 2,
    monthlyGenerationLimit: null,
  },
  basic: {
    genericTryOn: true,
    ownPhotoTryOn: false,
    freeGenerationLimit: null,
    monthlyGenerationLimit: 25,
  },
  pro: {
    genericTryOn: true,
    ownPhotoTryOn: true,
    freeGenerationLimit: null,
    monthlyGenerationLimit: 35,
  },
  gold: {
    genericTryOn: true,
    ownPhotoTryOn: true,
    freeGenerationLimit: null,
    monthlyGenerationLimit: null,
  },
};

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
    return this.subscriptionRepo.createInTrx(
      {
        user_id: userId,
        tier: "free_trial",
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: addDays(now, FREE_TRIAL_DAYS).toISOString(),
      },
      trx,
    );
  }

  async getActiveSubscription(userId: string) {
    const subscription = await this.subscriptionRepo.findActiveByUserId(userId);
    if (!subscription)
      throw new AppError(404, "No active subscription found for this account");
    return subscription;
  }

  async getSubscriptionOverview(userId: string) {
    const subscription = await this.subscriptionRepo.findByUserId(userId);
    if (!subscription)
      throw new AppError(404, "No subscription found for this account");

    const periodEnd = new Date(subscription.current_period_end);
    const millisecondsRemaining = Math.max(0, periodEnd.getTime() - Date.now());

    return {
      subscription,
      entitlements: TIER_ENTITLEMENTS[subscription.tier],
      daysRemaining: Math.ceil(millisecondsRemaining / (24 * 60 * 60 * 1000)),
      isActive: subscription.status === "active" && millisecondsRemaining > 0,
    };
  }

  getTierEntitlements(tier: SubscriptionTier) {
    return TIER_ENTITLEMENTS[tier];
  }

  async activatePaidTier(userId: string, tier: PaidSubscriptionTier) {
    const subscription = await this.subscriptionRepo.findByUserId(userId);
    if (!subscription)
      throw new AppError(404, "No subscription found for this account");

    const now = new Date();
    const updated = await this.subscriptionRepo.updateById(subscription.id, {
      tier,
      status: "active",
      cancel_at_period_end: false,
      current_period_start: now.toISOString(),
      current_period_end: addDays(now, BILLING_PERIOD_DAYS).toISOString(),
    });
    logger.info({ userId, tier }, "Paid subscription activated");
    return updated;
  }

  async cancelSubscription(userId: string) {
    const current = await this.subscriptionRepo.findActiveByUserId(userId);
    if (!current)
      throw new AppError(404, "No active subscription found for this account");
    if (current.cancel_at_period_end) return current;
    const subscription = await this.subscriptionRepo.updateById(current.id, {
      cancel_at_period_end: true,
    });
    if (!subscription)
      throw new AppError(404, "No subscription found for this account");
    return subscription;
  }

  async expireLapsedSubscriptions(): Promise<number> {
    const lapsed = await this.subscriptionRepo.findExpiredButActive();
    await Promise.all(
      lapsed.map(async (subscription) => {
        const status = subscription.cancel_at_period_end
          ? "cancelled"
          : "expired";
        await this.subscriptionRepo.updateById(subscription.id, { status });
        logger.info(
          { userId: subscription.user_id, status },
          "Subscription period ended",
        );
      }),
    );
    return lapsed.length;
  }
}

export const subscriptionService = new SubscriptionService(
  subscriptionRepository,
);
