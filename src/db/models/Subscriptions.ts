import { Model, ModelObject } from "objection";
import { UserModel } from "./User";

export class SubscriptionModel extends Model {
  static get tableName() {
        return "subscriptions";
    }

    id!: string;
    user_id!: string;
    tier!: "free_trial" | "basic" | "pro" | "gold";
    status!: "active" | "expired" | "cancelled" | "past_due";
    current_period_start!: string;
    current_period_end!: string;
    paystack_customer_id?: string;
    paystack_subscription_code?: string;
    created_at!: Date;
    updated_at!: Date;


    static relationMappings = {
        user: {
            relation: Model.BelongsToOneRelation,
            modelClass: UserModel,
            join: {
                from: "subscriptions.user_id",
                to: "users.id"
            }
        }
    }
}

export type SubscriptionModelType = ModelObject<SubscriptionModel>;