import { Model, ModelObject } from "objection";
import type { UserModel } from "./User";
import type { MessageModelType } from "./Messages";

export class ConversationModel extends Model {
  static get tableName() {
    return "conversations";
  }

  id!: string;
  user_id!: string;
  title?: string | null;
  last_message_at?: string | null;
  created_at!: string;
  updated_at!: string;

  user?: UserModel;
  messages?: MessageModelType[];

  static get relationMappings() {
    const { UserModel } = require("./User");
    const { MessageModel } = require("./Messages");

    return {
      user: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserModel,
      join: {
        from: "conversations.user_id",
        to: "users.id",
      },
      },
      messages: {
        relation: Model.HasManyRelation,
        modelClass: MessageModel,
        join: {
          from: "conversations.id",
          to: "messages.conversation_id",
        },
      },
    };
  }
}

export type ConversationModelType = ModelObject<ConversationModel>;
