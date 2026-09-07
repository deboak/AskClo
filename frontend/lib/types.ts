export interface Profile {
  id: string;
  user_id: string;
  gender: "male" | "female" | "other" | "prefer_not_to_say" | null;
  date_of_birth?: string | null;
  style_preference: string | null;
  body_type: string | null;
  age: string | null;
  cultural_preference: string | null;
  photo_url: string | null;
}

export interface Garment {
  id: string;
  image_url: string;
  name: string | null;
  category: "tops" | "bottoms" | "one-pieces" | "other" | null;
  colour: string | null;
  created_at: string;
}

export interface Generation {
  id: string;
  type: "generic_model" | "own_photo";
  status: "pending" | "processing" | "completed" | "failed";
  input_image_url?: string | null;
  garment_image_url?: string | null;
  output_image_url?: string | null;
  prompt?: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  tier: "free_trial" | "basic" | "pro" | "gold";
  status: "active" | "expired" | "cancelled" | "past_due";
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

export interface SubscriptionOverview {
  subscription: Subscription;
  entitlements: { genericTryOn: boolean; ownPhotoTryOn: boolean; freeGenerationLimit: number | null };
  daysRemaining: number;
  isActive: boolean;
}

export interface ConversationSummary { id: string; title: string; preview: string | null; lastMessageAt: string }
