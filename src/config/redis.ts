import Redis from 'ioredis';
import { AppEnv } from './env';
import { logger } from '../utils/logger';

const REDIS_URL = AppEnv.REDIS_URL ?? 'redis://localhost:6379';

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // required by BullMQ
  enableReadyCheck: false,
});

redis.on('error', (err) => {
  logger.error({err}, 'Redis connection error:');
});

redis.on('connect', () => {
  logger.info('Connected to Redis');
});

process.on('SIGTERM', async () => {
  await redis.quit();
});
