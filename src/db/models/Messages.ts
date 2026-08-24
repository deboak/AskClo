import { Model, ModelObject } from "objection";
import type { ConversationModel } from "./Conversation";

export type MessageRole = "user" | "assistant" | "system";

export class MessageModel extends Model {
  static get tableName() {
    return "messages";
  }

  id!: string;
  conversation_id!: string;
  role!: MessageRole;
  content!: string;
  metadata?: Record<string, unknown> | null;
  created_at!: string;
  updated_at!: string;

  conversation?: ConversationModel;

  static get relationMappings() {
    const { ConversationModel } = require("./Conversation");

    return {
      conversation: {
      relation: Model.BelongsToOneRelation,
      modelClass: ConversationModel,
      join: {
        from: "messages.conversation_id",
        to: "conversations.id",
      },
      },
    };
  }
}

export type MessageModelType = ModelObject<MessageModel>;
