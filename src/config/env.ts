import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function parseProviderList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeBaseUrl(value: string | undefined): string {
  const fallback = `http://localhost:${process.env.PORT || "3000"}`;
  const raw = (value || fallback).trim().replace(/\/+$/, "");

  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(raw)) return `http://${raw}`;
  return `https://${raw}`;
}

export const AppEnv = {
  PORT: process.env.PORT,
  DB_URL: process.env.DB_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  NODE_ENV: process.env.NODE_ENV || "development",
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
  API_VERSION: process.env.API_VERSION || "v1",
  REDIS_URL: process.env.REDIS_URL,
  REFRESH_TOKEN_TTL_SECONDS: process.env.REFRESH_TOKEN_TTL_SECONDS,
  OTP_PROVIDER: process.env.OTP_PROVIDER || "twilio",
  OTP_SENDGRID_TO: process.env.OTP_SENDGRID_TO,
  PLATFORM_ADMIN_PHONES: process.env.PLATFORM_ADMIN_PHONES,
  PLATFORM_ADMIN_EMAILS: process.env.PLATFORM_ADMIN_EMAILS,
  MLRO_EMAILS: process.env.MLRO_EMAILS,
  APP_URL: process.env.APP_URL,
  BASE_URL: normalizeBaseUrl(process.env.BASE_URL),
};

export const Kora = {
  SECRET_KEY: process.env.KORA_SECRET_KEY,
  PUBLIC_KEY: process.env.KORA_PUBLIC_KEY,
  BASE_URL: process.env.KORA_BASE_URL || "https://api.korapay.com/merchant/api/v1",
  WEBHOOK_SECRET: process.env.KORA_WEBHOOK_SECRET,
};

export const Google = {
  CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "change_me_in_production",
};

export const StorageEnv = {
  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME,
  AWS_REGION: process.env.AWS_REGION,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
};

export const Termii = {
  API_KEY: process.env.TERMII_API_KEY,
  SENDER_ID: process.env.TERMII_SENDER_ID,
};

export const Twilio = {
  ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  FROM_NUMBER: process.env.TWILIO_FROM_NUMBER,
};

export const SendGrid = {
  API_KEY: process.env.SENDGRID_API_KEY,
  FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL,
};

const defaultProvider = (process.env.PAYMENT_DEFAULT_PROVIDER || "paystack").toLowerCase();
const fallbackOrder = parseProviderList(process.env.PAYMENT_PROVIDER_PRIORITY);

export const PaymentEnv = {
  DEFAULT_PROVIDER: defaultProvider,
  PROVIDER_PRIORITY: fallbackOrder.length > 0 ? fallbackOrder : [defaultProvider, "kora", "paystack"],
  FALLBACK_ENABLED: (process.env.PAYMENT_FALLBACK_ENABLED || "true").toLowerCase() === "true",
  WEBHOOK_ENFORCE_AMOUNT_CHECK:
    (process.env.PAYMENT_WEBHOOK_ENFORCE_AMOUNT_CHECK || "true").toLowerCase() === "true",
};

export const Paystack = {
  SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
  PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY,
  BASE_URL: process.env.PAYSTACK_BASE_URL || "https://api.paystack.co",
  WEBHOOK_SECRET: process.env.PAYSTACK_WEBHOOK_SECRET,
};

export const WebPush = {
  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
  VAPID_SUBJECT: process.env.VAPID_SUBJECT || "mailto:devs@winitnaija.com",
};
