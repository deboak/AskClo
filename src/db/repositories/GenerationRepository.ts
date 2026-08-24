import { ModelClass, Transaction } from "objection";
import {
  GenerationModel,
  GenerationStatus,
  GenerationType,
} from "../models/Generations";
import { BaseRepository, QueryOptions } from "./BaseRepository";

export class GenerationRepository extends BaseRepository<GenerationModel> {
  protected model: ModelClass<GenerationModel> = GenerationModel;

  async findByIdAndUserId(
    generationId: string,
    userId: string,
    options?: QueryOptions,
  ): Promise<GenerationModel | undefined> {
    return this.findOne({ id: generationId, user_id: userId }, options);
  }

  async findByProviderJobId(
    providerJobId: string,
    options?: QueryOptions,
  ): Promise<GenerationModel | undefined> {
    return this.findOne({ provider_job_id: providerJobId }, options);
  }

  async findAllByUserId(
    userId: string,
    options?: QueryOptions,
  ): Promise<GenerationModel[]> {
    const query = this.model.query().where("user_id", userId).orderBy("created_at", "desc");
    return this.applyOptions(query, options) as unknown as Promise<GenerationModel[]>;
  }

  async countCompletedByUserSince(
    userId: string,
    type: GenerationType,
    since: Date | string,
  ): Promise<number> {
    const result = (await this.model
      .query()
      .where({ user_id: userId, type, status: "completed" })
      .where("created_at", ">=", since instanceof Date ? since.toISOString() : since)
      .count("id as count")
      .first()) as unknown as { count?: string | number } | undefined;

    return Number(result?.count ?? 0);
  }

  async createInTrx(data: Partial<GenerationModel>, trx: Transaction): Promise<GenerationModel> {
    return this.model.query(trx).insertAndFetch(data) as unknown as Promise<GenerationModel>;
  }

  async updateStatus(
    generationId: string,
    status: GenerationStatus,
    data: Partial<GenerationModel> = {},
  ): Promise<GenerationModel> {
    return this.updateById(generationId, { ...data, status });
  }
}

export const generationRepository = new GenerationRepository();
