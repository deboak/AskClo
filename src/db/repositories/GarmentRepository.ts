import { ModelClass } from "objection";
import { GarmentModel } from "../models/Garment";
import { BaseRepository } from "./BaseRepository";

export class GarmentRepository extends BaseRepository<GarmentModel> {
  protected model: ModelClass<GarmentModel> = GarmentModel;
  async findByIdAndUserId(id: string, userId: string): Promise<GarmentModel | undefined> {
    return this.findOne({ id, user_id: userId });
  }
  async findAllByUserId(userId: string): Promise<GarmentModel[]> {
    return this.model.query().where("user_id", userId).orderBy("created_at", "desc") as unknown as Promise<GarmentModel[]>;
  }
}
export const garmentRepository = new GarmentRepository();
