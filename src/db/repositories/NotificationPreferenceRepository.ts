import { ModelClass } from "objection";
import { NotificationPreferenceModel } from "../models/NotificationPreference";
import { BaseRepository } from "./BaseRepository";

export class NotificationPreferenceRepository extends BaseRepository<NotificationPreferenceModel> {
  protected model: ModelClass<NotificationPreferenceModel> = NotificationPreferenceModel;

  findByUserId(userId: string) { return this.findOne({ user_id: userId }); }

  async upsertByUserId(
    userId: string,
    data: Partial<Pick<NotificationPreferenceModel, "styling_emails" | "try_on_alerts" | "product_news">>,
  ) {
    return this.model.query().insert({ user_id: userId, ...data }).onConflict("user_id")
      .merge({ ...data, updated_at: new Date() }).returning("*");
  }
}

export const notificationPreferenceRepository = new NotificationPreferenceRepository();
