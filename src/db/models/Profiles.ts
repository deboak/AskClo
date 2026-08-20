import { Model, ModelObject } from "objection";
import { UserModel } from "./User";


export class ProfileModel extends Model {
  static get tableName() {
        return "profiles";
    }

    id!: string;
    user_id!: string;
    gender?: "male" | "female" | "other" | "prefer_not_to_say";
    date_of_birth?: Date;
    location?: string | null;
    style_preference?: string | null;
    body_type?: string | null;
    cultural_preference?: string | null;
    created_at!: Date;
    updated_at!: Date;


    static relationMappings = {
        user: {
            relation: Model.BelongsToOneRelation,
            modelClass: UserModel,
            join: {
                from: "profiles.user_id",
                to: "users.id"
            }
        }
    }
}


export type ProfileModelType = ModelObject<ProfileModel>;

