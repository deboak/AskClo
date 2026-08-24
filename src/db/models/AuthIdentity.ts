import { Model, ModelObject } from "objection";
import type { UserModel } from "./User";


export class AuthIdentityModel extends Model {
    static get tableName() {
        return "auth_identities";
    }

    id!: string;
    user_id!: string;
    provider!: string;
    provider_user_id!: string;
    created_at!: Date;
    updated_at!: Date;


    static get relationMappings() {
        const { UserModel } = require("./User");

        return {
        user: {
            relation: Model.BelongsToOneRelation,
            modelClass: UserModel,
            join: {
                from: "auth_identities.user_id",
                to: "users.id"
            }
        }
        };
    }

}

export type AuthIdentityModelType = ModelObject<AuthIdentityModel>;
