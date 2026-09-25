import { Model, ModelObject } from "objection";

export class NotificationPreferenceModel extends Model {
  static get tableName() { return "notification_preferences"; }
  id!: string;
  user_id!: string;
  styling_emails!: boolean;
  try_on_alerts!: boolean;
  product_news!: boolean;
  created_at!: Date;
  updated_at!: Date;
}

export type NotificationPreferenceModelType = ModelObject<NotificationPreferenceModel>;
