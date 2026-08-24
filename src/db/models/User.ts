import { Model, ModelObject } from "objection";
import type { AuthIdentityModelType } from "./AuthIdentity";
import type { ProfileModelType } from "./Profiles";
import type { SubscriptionModelType } from "./Subscriptions";

export class UserModel extends Model {
  static get tableName() {
    return "users";
  }

  id!: string;
  first_name!: string;
  last_name!: string;
  age?: string | null;
  username?: string | null;
  phone_number?: string | null;
  email?: string | null;
  password_hash?: string | null;
  role!: "user" | "admin";
  email_verified!: boolean;
  pending_email?: string | null;
  avatar?: string | null;
  is_active!: boolean;
  is_deleted!: boolean;
  is_blocked!: boolean;
  phone_verified!: boolean;
  created_at!: Date;
  updated_at!: Date;

  authIdentity?: AuthIdentityModelType;
  profile?: ProfileModelType;
  subscription?: SubscriptionModelType;
  

  static get relationMappings() {
    const { AuthIdentityModel } = require("./AuthIdentity");
    const { ProfileModel } = require("./Profiles");
    const { SubscriptionModel } = require("./Subscriptions");

    return {
      authIdentity: {
        relation: Model.HasOneRelation,
        modelClass: AuthIdentityModel,
        join: {
            from: "users.id",
            to: "auth_identities.user_id"
        },
    },

    profile: {
        relation: Model.HasOneRelation,
        modelClass: ProfileModel,
        join: {
            from: "users.id",
            to: "profiles.user_id",
        },
    },

    subscription: {
        relation: Model.HasOneRelation,
        modelClass: SubscriptionModel,
        join: {
            from: "users.id",
            to: "subscriptions.user_id",
        },
    },
    };
  }
}
export type UserModelType = ModelObject<UserModel>;
