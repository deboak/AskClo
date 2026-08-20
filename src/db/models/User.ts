import { Model, ModelObject } from "objection";
import { AuthIdentityModel, AuthIdentityModelType } from "./AuthIdentity";
import { profile } from "node:console";
import { ProfileModel, ProfileModelType } from "./Profiles";
import { SubscriptionModel, SubscriptionModelType } from "./Subscriptions";

export class UserModel extends Model {
  static get tableName() {
    return "users";
  }

  id!: string;
  first_name!: string;
  last_name!: string;
  phone_number?: string | null;
  email?: string | null;
  email_verified!: boolean;
  pending_email?: string | null;
  avatar?: string | null;
  is_active!: boolean;
  is_deleted!: boolean;
  is_blocked!: boolean;
  phone_verified!: boolean;
  created_at!: Date;
  updated_at!: Date;

  authIdentity?: AuthIdentityModelType[];
  profile?: ProfileModelType[];
  subscription?: SubscriptionModelType[];
  

  static relationMappings = {
    authIdentity: {
        relation: Model.HasOneRelation,
        modelClass: AuthIdentityModel,
        join: {
            from: "users.id",
            to: "authIdentity.user_id"
        },
    },

    profile: {
        relation: Model.HasOneRelation,
        modelClass: ProfileModel,
        join: {
            from: "users.id",
            to: "profile.user_id",
        },
    },

    subscription: {
        relation: Model.HasOneRelation,
        modelClass: SubscriptionModel,
        join: {
            from: "users.id",
            to: "subscription.user_id",
        },
    },
  }
}
export type UserModelType = ModelObject<UserModel>;
