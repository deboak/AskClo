import { ModelClass } from "objection";
import { PaymentTransactionModel } from "../models/PaymentTransaction";
import { BaseRepository } from "./BaseRepository";
export class PaymentTransactionRepository extends BaseRepository<PaymentTransactionModel> {
  protected model: ModelClass<PaymentTransactionModel> = PaymentTransactionModel;
  findByReference(reference: string) { return this.findOne({ reference }); }
}
export const paymentTransactionRepository = new PaymentTransactionRepository();
