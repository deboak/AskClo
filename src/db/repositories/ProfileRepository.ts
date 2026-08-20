import { ModelClass, Transaction } from "objection";
import { ProfileModel } from "../models/Profiles";
import { BaseRepository, QueryOptions } from "./BaseRepository";

export class ProfileRepository extends BaseRepository<ProfileModel> {
  protected model: ModelClass<ProfileModel> = ProfileModel;

  async findByUserId(
    userId: string,
    options?: QueryOptions,
  ): Promise<ProfileModel | undefined> {
    return this.findOne({ user_id: userId }, options);
  }

  async createInTrx(
    data: Partial<ProfileModel>,
    trx: Transaction,
  ): Promise<ProfileModel> {
    return this.model.query(trx).insertAndFetch(data) as unknown as Promise<ProfileModel>;
  }

  async updateByUserId(
    userId: string,
    data: Partial<ProfileModel>,
  ): Promise<ProfileModel | undefined> {
    const profile = await this.findByUserId(userId);
    return profile ? this.updateById(profile.id, data) : undefined;
  }
}

export const profileRepository = new ProfileRepository();
