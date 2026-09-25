import { notificationPreferenceRepository } from "../../db/repositories/NotificationPreferenceRepository";

export type NotificationPreferenceUpdate = {
  styling_emails?: boolean;
  try_on_alerts?: boolean;
  product_news?: boolean;
};

export class NotificationPreferenceService {
  async get(userId: string) {
    const existing = await notificationPreferenceRepository.findByUserId(userId);
    return existing ?? notificationPreferenceRepository.upsertByUserId(userId, {});
  }

  update(userId: string, input: NotificationPreferenceUpdate) {
    return notificationPreferenceRepository.upsertByUserId(userId, input);
  }
}

export const notificationPreferenceService = new NotificationPreferenceService();
