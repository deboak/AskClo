import { ModelClass, Transaction } from "objection";
import { ConversationModel } from "../models/Conversation";
import { BaseRepository, QueryOptions } from "./BaseRepository";

export class ConversationRepository extends BaseRepository<ConversationModel> {
  protected model: ModelClass<ConversationModel> = ConversationModel;

  async findByIdAndUserId(
    conversationId: string,
    userId: string,
    options?: QueryOptions,
  ): Promise<ConversationModel | undefined> {
    return this.findOne({ id: conversationId, user_id: userId }, options);
  }

  async findAllByUserId(
    userId: string,
    options?: QueryOptions,
  ): Promise<ConversationModel[]> {
    const query = this.model
      .query()
      .where("user_id", userId)
      .orderBy("last_message_at", "desc")
      .orderBy("created_at", "desc");

    return this.applyOptions(query, options) as unknown as Promise<ConversationModel[]>;
  }

  async createInTrx(
    data: Partial<ConversationModel>,
    trx: Transaction,
  ): Promise<ConversationModel> {
    return this.model.query(trx).insertAndFetch(data) as unknown as Promise<ConversationModel>;
  }

  async touchLastMessage(conversationId: string): Promise<ConversationModel> {
    return this.updateById(conversationId, { last_message_at: new Date().toISOString() });
  }
}

export const conversationRepository = new ConversationRepository();
