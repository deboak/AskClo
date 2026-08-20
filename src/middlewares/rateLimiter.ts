import { rateLimit } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from './../config/redis';
import { AppEnv } from './../config/env';

interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  message?: string;
}

function positiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const defaultWindowMs = positiveNumber(AppEnv.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000);
const defaultMax = positiveNumber(AppEnv.RATE_LIMIT_MAX, 100);

export const createRateLimiter = (options?: RateLimitOptions) =>
  rateLimit({
    windowMs: options?.windowMs ?? defaultWindowMs,
    max: options?.max ?? defaultMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: options?.message ?? 'Too many requests, please try again later.' },
    store: new RedisStore({
      sendCommand: (...args: string[]) => redis.call(args[0], ...args.slice(1)) as Promise<number>,
    }),
  });
