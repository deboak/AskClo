import { subscriptionRepository } from "../../db/repositories/SubscriptionRepository";
import { paymentTransactionRepository } from "../../db/repositories/PaymentTransactionRepository";
import { userRepository } from "../../db/repositories/UserRepository";
import { AppError } from "../../utils/appError";
import { AppEnv, Paystack } from "../../config/env";
import { randomUUID } from "crypto";
import { logger } from "../../utils/logger";
import {
  PaidSubscriptionTier,
  subscriptionService,
} from "../subscription/subscription.service";

const TIER_PRICING_NGN: Record<PaidSubscriptionTier, number> = {
  basic: 6_800,
  pro: 9_500,
};

const TIER_PLAN_CODES: Record<PaidSubscriptionTier, string | undefined> = {
  basic: Paystack.BASIC_PLAN_CODE,
  pro: Paystack.PRO_PLAN_CODE,
};

export interface PaystackWebhookEvent {
  event: string;
  data: {
    customer?: { customer_code?: string };
    subscription_code?: string;
    email_token?: string;
    subscription?: { subscription_code?: string; email_token?: string };
    metadata?: { userId?: string; tier?: string };
  };
}

/**
 * Payment-provider orchestration. The caller must verify the Paystack
 * signature against the raw request body before passing an event here.
 */
export class PaymentService {
  getSubscriptionPrice(tier: PaidSubscriptionTier): number {
    return TIER_PRICING_NGN[tier];
  }

  async initializePaystackCheckout(userId: string, tier: PaidSubscriptionTier) {
    if (!Paystack.SECRET_KEY) throw new AppError(503, "Paystack is not configured");
    const user = await userRepository.findById(userId);
    if (!user?.email) throw new AppError(400, "An email address is required for payment");
    const reference = `askclo_${randomUUID()}`;
    const amountKobo = this.getSubscriptionPrice(tier) * 100;
    const planCode = TIER_PLAN_CODES[tier];
    if (!planCode) {
      throw new AppError(503, `${tier === "basic" ? "Basic" : "Pro"} checkout is not configured`);
    }
    await this.assertPaystackPlanMatches(tier, planCode, amountKobo);
    const callbackUrl = AppEnv.APP_URL
      ? `${AppEnv.APP_URL.replace(/\/$/, "")}/dashboard/subscription`
      : undefined;
    const response = await fetch(`${Paystack.BASE_URL}/transaction/initialize`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${Paystack.SECRET_KEY}` },
      body: JSON.stringify({
        email: user.email,
        amount: amountKobo,
        reference,
        plan: planCode,
        ...(callbackUrl ? { callback_url: callbackUrl } : {}),
        metadata: { userId, tier, reference },
      }),
    });
    if (!response.ok) throw new AppError(502, "Unable to initialize payment");
    const result = await response.json() as { status: boolean; data?: { authorization_url: string; access_code: string } };
    if (!result.status || !result.data) throw new AppError(502, "Paystack returned an unusable checkout response");
    await paymentTransactionRepository.create({ user_id: userId, provider: "paystack", reference, tier, amount_kobo: amountKobo, status: "pending" });
    return { reference, authorizationUrl: result.data.authorization_url, accessCode: result.data.access_code };
  }

  async verifyPaystackCheckout(userId: string, reference: string) {
    if (!Paystack.SECRET_KEY) throw new AppError(503, "Paystack is not configured");
    const transaction = await paymentTransactionRepository.findByReference(reference);
    if (!transaction || transaction.user_id !== userId) {
      throw new AppError(404, "Payment transaction not found");
    }

    const response = await fetch(
      `${Paystack.BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${Paystack.SECRET_KEY}` } },
    );
    if (!response.ok) throw new AppError(502, "Unable to verify payment");
    const result = await response.json() as {
      status: boolean;
      data?: {
        reference?: string;
        amount?: number;
        status?: string;
        customer?: { customer_code?: string };
        subscription?: { subscription_code?: string; email_token?: string };
        metadata?: { userId?: string; tier?: string };
      };
    };
    if (!result.status || !result.data) throw new AppError(502, "Paystack returned an unusable verification response");

    await this.handleVerifiedPaystackEvent({
      event: "charge.success",
      data: {
        ...result.data,
        subscription_code: result.data.subscription?.subscription_code,
        email_token: result.data.subscription?.email_token,
      },
    });
    const updated = await paymentTransactionRepository.findByReference(reference);
    if (updated?.status !== "successful") throw new AppError(400, "Payment was not successful");

    return {
      transaction: updated,
      subscription: await subscriptionService.getSubscriptionOverview(userId),
    };
  }

  async handleVerifiedPaystackEvent(event: PaystackWebhookEvent & { data: { reference?: string; amount?: number; status?: string; customer?: { customer_code?: string }; subscription_code?: string; email_token?: string; subscription?: { subscription_code?: string; email_token?: string }; metadata?: { userId?: string; tier?: string } } }): Promise<void> {
    const subscriptionCode = event.data.subscription_code ?? event.data.subscription?.subscription_code;
    const emailToken = event.data.email_token ?? event.data.subscription?.email_token;
    if (event.event === "subscription.create") {
      const { userId, tier } = event.data.metadata ?? {};
      const subscription = userId && this.isPaidTier(tier)
        ? await subscriptionRepository.findByUserId(userId)
        : event.data.customer?.customer_code
          ? await subscriptionRepository.findByPaystackCustomerId(event.data.customer.customer_code)
          : undefined;
      if (subscription) {
        await subscriptionRepository.updateById(subscription.id, {
          paystack_customer_id: event.data.customer?.customer_code,
          paystack_subscription_code: subscriptionCode,
          paystack_email_token: emailToken,
        });
      }
      return;
    }

    const reference = event.data.reference;
    if (!reference) { logger.warn({ event: event.event }, "Paystack webhook missing reference"); return; }
    const transaction = await paymentTransactionRepository.findByReference(reference);
    if (!transaction && event.event === "charge.success" && event.data.status === "success" && subscriptionCode) {
      const recurringSubscription = await subscriptionRepository.findByPaystackSubscriptionCode(subscriptionCode);
      if (!recurringSubscription || event.data.amount !== this.getSubscriptionPrice(recurringSubscription.tier as PaidSubscriptionTier) * 100) {
        logger.warn({ reference, subscriptionCode }, "Recurring Paystack charge did not match a subscription");
        return;
      }
      await subscriptionService.activatePaidTier(recurringSubscription.user_id, recurringSubscription.tier as PaidSubscriptionTier);
      await paymentTransactionRepository.create({
        user_id: recurringSubscription.user_id,
        provider: "paystack",
        reference,
        tier: recurringSubscription.tier as PaidSubscriptionTier,
        amount_kobo: event.data.amount,
        status: "successful",
        provider_payload: event as unknown as Record<string, unknown>,
      });
      return;
    }
    if (!transaction) { logger.warn({ reference }, "Paystack webhook did not match a payment transaction"); return; }
    if (transaction.status === "successful") return;
    if (event.event !== "charge.success" || event.data.status !== "success" || event.data.amount !== transaction.amount_kobo) {
      await paymentTransactionRepository.updateById(transaction.id, { status: "failed", provider_payload: event as unknown as Record<string, unknown> });
      return;
    }
    await subscriptionService.activatePaidTier(transaction.user_id, transaction.tier);
    await paymentTransactionRepository.updateById(transaction.id, { status: "successful", provider_payload: event as unknown as Record<string, unknown> });
    const subscription = await subscriptionRepository.findByUserId(transaction.user_id);
    if (subscription) await subscriptionRepository.updateById(subscription.id, {
      paystack_customer_id: event.data.customer?.customer_code,
      paystack_subscription_code: subscriptionCode,
      paystack_email_token: emailToken,
    });
  }

  async handlePaystackWebhook(event: PaystackWebhookEvent): Promise<void> {
    const { userId, tier } = event.data.metadata ?? {};
    if (!userId || !this.isPaidTier(tier)) {
      logger.warn({ event: event.event }, "Paystack webhook missing valid subscription metadata");
      return;
    }

    switch (event.event) {
      case "subscription.create":
      case "charge.success": {
        const subscription = await subscriptionService.activatePaidTier(userId, tier);
        await subscriptionRepository.updateById(subscription.id, {
          paystack_customer_id: event.data.customer?.customer_code,
          paystack_subscription_code: event.data.subscription_code,
        });
        logger.info({ userId, tier }, "Paystack subscription payment processed");
        return;
      }
      case "subscription.disable":
      case "invoice.payment_failed":
        await subscriptionRepository.updateByUserId(userId, { status: "past_due" });
        return;
      default:
        logger.info({ eventType: event.event }, "Unhandled Paystack webhook event");
    }
  }

  private isPaidTier(tier: string | undefined): tier is PaidSubscriptionTier {
    return tier === "basic" || tier === "pro";
  }

  private async assertPaystackPlanMatches(
    tier: PaidSubscriptionTier,
    planCode: string,
    expectedAmountKobo: number,
  ): Promise<void> {
    const response = await fetch(`${Paystack.BASE_URL}/plan/${encodeURIComponent(planCode)}`, {
      headers: { Authorization: `Bearer ${Paystack.SECRET_KEY}` },
    });
    if (!response.ok) {
      throw new AppError(502, `Unable to validate the ${tier} payment plan`);
    }
    const result = await response.json() as {
      status: boolean;
      data?: { amount?: number; interval?: string };
    };
    if (
      !result.status ||
      result.data?.amount !== expectedAmountKobo ||
      result.data.interval !== "monthly"
    ) {
      logger.error(
        { tier, planCode, expectedAmountKobo, configuredPlan: result.data },
        "Paystack plan configuration mismatch",
      );
      throw new AppError(503, `${tier === "basic" ? "Basic" : "Pro"} payment plan is misconfigured`);
    }
  }
}

export const paymentService = new PaymentService();
