import { Model, ModelObject } from "objection";

export class GarmentModel extends Model {
  static get tableName() { return "garments"; }
  id!: string;
  user_id!: string;
  image_url!: string;
  category?: string | null;
  colour?: string | null;
  name?: string | null;
  created_at!: string;
  updated_at!: string;
}
export type GarmentModelType = ModelObject<GarmentModel>;
