import Redis from 'ioredis';
import { AppEnv } from './env';

const REDIS_URL = AppEnv.REDIS_URL ?? 'redis://localhost:6379';

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // required by BullMQ
  enableReadyCheck: false,
});

//redis.on('error', (err) => (err, 'Redis error'));

