import { ModelClass, Transaction } from "objection";
import { MessageModel } from "../models/Messages";
import { BaseRepository, QueryOptions } from "./BaseRepository";

export class MessageRepository extends BaseRepository<MessageModel> {
  protected model: ModelClass<MessageModel> = MessageModel;

  async findByIdAndConversationId(
    messageId: string,
    conversationId: string,
    options?: QueryOptions,
  ): Promise<MessageModel | undefined> {
    return this.findOne({ id: messageId, conversation_id: conversationId }, options);
  }

  async findAllByConversationId(
    conversationId: string,
    options?: QueryOptions,
  ): Promise<MessageModel[]> {
    const query = this.model
      .query()
      .where("conversation_id", conversationId)
      .orderBy("created_at", "asc");

    return this.applyOptions(query, options) as unknown as Promise<MessageModel[]>;
  }

  async createInTrx(data: Partial<MessageModel>, trx: Transaction): Promise<MessageModel> {
    return this.model.query(trx).insertAndFetch(data) as unknown as Promise<MessageModel>;
  }
}

export const messageRepository = new MessageRepository();
