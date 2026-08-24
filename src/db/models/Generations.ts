import { Model, ModelObject } from "objection";
import { UserModel } from "./User";

export type GenerationType = "generic_model" | "own_photo";
export type GenerationStatus = "pending" | "processing" | "completed" | "failed";

export class GenerationModel extends Model {
  static get tableName() {
    return "generations";
  }

  id!: string;
  user_id!: string;
  type!: GenerationType;
  status!: GenerationStatus;
  input_image_url?: string | null;
  garment_image_url?: string | null;
  output_image_url?: string | null;
  prompt?: string | null;
  cost_usd?: string | null; // Objection returns decimals as strings by default
  provider?: string | null;
  provider_job_id?: string | null;
  created_at!: string;
  updated_at!: string;

  static relationMappings = {
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserModel,
      join: {
        from: "generations.user_id",
        to: "users.id",
      },
    },
  };
}

export type GenerationModelType = ModelObject<GenerationModel>;
