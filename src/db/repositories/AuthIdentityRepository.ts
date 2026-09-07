import { ModelClass, Transaction } from "objection";
import { AuthIdentityModel } from "../models/AuthIdentity";
import { BaseRepository, QueryOptions } from "./BaseRepository";

export class AuthIdentityRepository extends BaseRepository<AuthIdentityModel> {
  protected model: ModelClass<AuthIdentityModel> = AuthIdentityModel;

  async findByProvider(
    provider: string,
    providerUserId: string,
    options?: QueryOptions,
  ): Promise<AuthIdentityModel | undefined> {
    return this.findOne({ provider, provider_user_id: providerUserId }, options);
  }

  async findAllByUserId(userId: string, options?: QueryOptions): Promise<AuthIdentityModel[]> {
    return this.findAll({ user_id: userId }, options);
  }

  async createInTrx(
    data: Partial<AuthIdentityModel>,
    trx: Transaction
  ): Promise<AuthIdentityModel> {
    return this.model.query(trx).insertAndFetch(data) as unknown as Promise<AuthIdentityModel>;
  }
}

export const authIdentityRepository = new AuthIdentityRepository();
