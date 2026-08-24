import { ModelClass, Transaction } from "objection";
import { UserModel } from "../models/User";
import { BaseRepository, QueryOptions } from "./BaseRepository";

export class UserRepository extends BaseRepository<UserModel> {
  protected model: ModelClass<UserModel> = UserModel;

  async findByEmail(email: string, options?: QueryOptions): Promise<UserModel | undefined> {
    return this.findOne({ email }, options);
  }

  async findByPhoneNumber(
    phoneNumber: string,
    options?: QueryOptions,
  ): Promise<UserModel | undefined> {
    return this.findOne({ phone_number: phoneNumber }, options);
  }

  async findByEmailOrPhone(
    identifier: string,
    options?: QueryOptions,
  ): Promise<UserModel | undefined> {
    const query = this.model
      .query()
      .where("email", identifier)
      .orWhere("phone_number", identifier)
      .first();

    return this.applyOptions(query, options) as unknown as Promise<UserModel | undefined>;
  }

  async createInTrx(data: Partial<UserModel>, trx: Transaction): Promise<UserModel> {
    return this.model.query(trx).insertAndFetch(data) as unknown as Promise<UserModel>;
  }
}

export const userRepository = new UserRepository();
