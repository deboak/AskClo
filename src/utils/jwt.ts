import jwt, { SignOptions } from "jsonwebtoken";
import { randomUUID } from "crypto";
import { AppEnv } from "./../config/env";

export type TokenScope = "provisional" | "full";

export interface JwtPayload {
  sub: string;
  scope: TokenScope;
  role: string;
}

export interface RefreshJwtPayload {
  sub: string;
  scope: TokenScope;
  sid: string;
}

// Fail fast at startup if secrets are missing — never silently sign/verify
// tokens with an undefined secret.
if (!AppEnv.JWT_ACCESS_SECRET || !AppEnv.JWT_REFRESH_SECRET) {
  throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are required");
}

// Separate secrets for access vs refresh tokens. If one leaks, the other
// token type is not automatically compromised.
const ACCESS_SECRET = AppEnv.JWT_ACCESS_SECRET;
const REFRESH_SECRET = AppEnv.JWT_REFRESH_SECRET;

const ACCESS_TTL: Record<TokenScope, SignOptions["expiresIn"]> = {
  provisional: "30m", // e.g. phone verified, profile not yet complete
  full: "7d",
};

const DEFAULT_REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

function resolveRefreshTtlSeconds(): number {
  const parsed = Number(AppEnv.REFRESH_TOKEN_TTL_SECONDS ?? DEFAULT_REFRESH_TTL_SECONDS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_REFRESH_TTL_SECONDS;
}

const REFRESH_TTL_SECONDS = resolveRefreshTtlSeconds();

export function getRefreshTtlSeconds(): number {
  return REFRESH_TTL_SECONDS;
}

export function signAccessToken(userId: string, scope: TokenScope, role: string): string {
  return jwt.sign(
    { sub: userId, scope, role, type: "access" },
    ACCESS_SECRET,
    { expiresIn: ACCESS_TTL[scope] },
  );
}

export function signRefreshToken(
  userId: string,
  scope: TokenScope,
  sid: string = randomUUID(),
): string {
  return jwt.sign(
    { sub: userId, scope, sid, type: "refresh" },
    REFRESH_SECRET,
    { expiresIn: REFRESH_TTL_SECONDS },
  );
}

export function verifyAccessToken(token: string): JwtPayload {
  const payload = jwt.verify(token, ACCESS_SECRET) as JwtPayload & { type: string };

  if (payload.type !== "access") {
    throw new Error("Invalid token type");
  }

  return {
    sub: payload.sub,
    scope: payload.scope,
    role: payload.role,
  };
}

export function verifyRefreshToken(token: string): RefreshJwtPayload {
  const payload = jwt.verify(token, REFRESH_SECRET) as RefreshJwtPayload & { type: string };

  if (payload.type !== "refresh") {
    throw new Error("Invalid token type");
  }

  return {
    sub: payload.sub,
    scope: payload.scope,
    sid: payload.sid,
  };
}
