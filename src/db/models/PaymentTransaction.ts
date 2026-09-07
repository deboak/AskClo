import { Model, ModelObject } from "objection";
export class PaymentTransactionModel extends Model {
  static get tableName() { return "payment_transactions"; }
  id!: string; user_id!: string; provider!: string; reference!: string; tier!: "basic" | "pro" | "gold";
  amount_kobo!: number; currency!: string; status!: "pending" | "successful" | "failed";
  provider_payload?: Record<string, unknown> | null; created_at!: string; updated_at!: string;
}
export type PaymentTransactionModelType = ModelObject<PaymentTransactionModel>;
