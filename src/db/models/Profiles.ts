import { Model, ModelObject } from "objection";
import type { UserModel } from "./User";

const GENDER_OPTIONS = ["male", "female", "other", "prefer_not_to_say"] as const;

export class ProfileModel extends Model {
  static get tableName() {
        return "profiles";
    }

    id!: string;
    user_id!: string;
    gender?: typeof GENDER_OPTIONS[number] | null
    date_of_birth?: Date;
    location?: string | null;
    style_preference?: string | null;
    body_type?: string | null;
    age?: string | null;
    cultural_preference?: string | null;
    created_at!: Date;
    updated_at!: Date;


    static get relationMappings() {
        const { UserModel } = require("./User");

        return {
        user: {
            relation: Model.BelongsToOneRelation,
            modelClass: UserModel,
            join: {
                from: "profiles.user_id",
                to: "users.id"
            }
        }
        };
    }
}


export type ProfileModelType = ModelObject<ProfileModel>;

