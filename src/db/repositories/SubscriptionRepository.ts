import { ModelClass, Transaction } from "objection";
import { SubscriptionModel } from "../models/Subscriptions";
import { BaseRepository, QueryOptions } from "./BaseRepository";

export class SubscriptionRepository extends BaseRepository<SubscriptionModel> {
  protected model: ModelClass<SubscriptionModel> = SubscriptionModel;

  async findByUserId(
    userId: string,
    options?: QueryOptions,
  ): Promise<SubscriptionModel | undefined> {
    return this.findOne({ user_id: userId }, options);
  }

  async findActiveByUserId(
    userId: string,
    options?: QueryOptions,
  ): Promise<SubscriptionModel | undefined> {
    return this.findOne({ user_id: userId, status: "active" }, options);
  }

  async createInTrx(
    data: Partial<SubscriptionModel>,
    trx: Transaction,
  ): Promise<SubscriptionModel> {
    return this.model.query(trx).insertAndFetch(data) as unknown as Promise<SubscriptionModel>;
  }

  async updateByUserId(
    userId: string,
    data: Partial<SubscriptionModel>,
  ): Promise<SubscriptionModel | undefined> {
    const subscription = await this.findByUserId(userId);
    return subscription ? this.updateById(subscription.id, data) : undefined;
  }

  async findExpiredButActive(now = new Date()): Promise<SubscriptionModel[]> {
    return this.model
      .query()
      .where("status", "active")
      .where("current_period_end", "<", now.toISOString()) as unknown as Promise<SubscriptionModel[]>;
  }
}

export const subscriptionRepository = new SubscriptionRepository();
