import crypto from "crypto";
import type { Transaction } from "objection";
import { AppEnv } from "../../config/env";
import { db } from "../../config/db";
import { redis } from "../../config/redis";
import { AppError } from "../../utils/appError";

const DISPOSABLE_DOMAINS = new Set([
  "10minutemail.com", "dispostable.com", "emailondeck.com", "guerrillamail.com",
  "maildrop.cc", "mailinator.com", "sharklasers.com", "temp-mail.org", "tempmail.com",
  "throwawaymail.com", "yopmail.com",
]);

function digest(value: string): string {
  const secret = AppEnv.ANTI_ABUSE_HASH_SECRET || AppEnv.JWT_ACCESS_SECRET;
  if (!secret) throw new AppError(503, "Anti-abuse protection is not configured");
  return crypto.createHmac("sha256", secret).update(value.trim().toLowerCase()).digest("hex");
}

export function assertAcceptableEmail(email: string): void {
  const domain = email.split("@").pop()?.toLowerCase() ?? "";
  if (DISPOSABLE_DOMAINS.has(domain)) {
    throw new AppError(400, "Please use a permanent email address");
  }
}

export async function verifyCaptcha(token: string | undefined, ip: string): Promise<void> {
  if (!AppEnv.TURNSTILE_SECRET_KEY) {
    if (AppEnv.NODE_ENV === "production") throw new AppError(503, "Human verification is not configured");
    return;
  }
  if (!token) throw new AppError(400, "Complete the human verification challenge");
  const body = new URLSearchParams({ secret: AppEnv.TURNSTILE_SECRET_KEY, response: token, remoteip: ip });
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
  const result = (await response.json()) as { success?: boolean };
  if (!response.ok || !result.success) throw new AppError(400, "Human verification failed. Please try again");
}

export async function claimFreeTrial(
  userId: string,
  deviceId: string,
  ip: string,
  trx: Transaction,
): Promise<boolean> {
  const deviceHash = digest(`device:${deviceId}`);
  const ipHash = digest(`ip:${ip}`);
  await db.raw("select pg_advisory_xact_lock(hashtext(?))", [`free-trial-device:${deviceHash}`]).transacting(trx);
  const existing = await db("free_trial_claims").transacting(trx).where({ device_hash: deviceHash }).first();
  const rollingKey = `anti-abuse:free-trial-ip:${ipHash}`;
  const ipClaims = await redis.incr(rollingKey);
  if (ipClaims === 1) await redis.expire(rollingKey, 24 * 60 * 60);
  const reason = existing ? "device_already_claimed" : ipClaims > 2 ? "ip_trial_limit" : null;

  if (reason) {
    await db("abuse_signals").transacting(trx).insert({
      user_id: userId,
      device_hash: deviceHash,
      ip_hash: ipHash,
      reason,
      metadata: JSON.stringify({ ipClaims }),
    });
    return false;
  }

  await db("free_trial_claims").transacting(trx).insert({ user_id: userId, device_hash: deviceHash, ip_hash: ipHash });
  const sameIpCount = Number((await db("free_trial_claims").transacting(trx).where({ ip_hash: ipHash }).count("id as count").first())?.count ?? 0);
  if (sameIpCount > 1) {
    await db("abuse_signals").transacting(trx).insert({
      user_id: userId, device_hash: deviceHash, ip_hash: ipHash,
      reason: "shared_ip_multiple_accounts", metadata: JSON.stringify({ accountCount: sameIpCount }),
    });
  }
  return true;
}
