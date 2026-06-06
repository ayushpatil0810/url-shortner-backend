import { REDIS_URL } from './env.js';
import { Redis } from 'ioredis';
import logger from '../utils/logger.js';

const redis = new Redis(REDIS_URL, {
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err: Error) {
    const targetErrors = ['ECONNREFUSED', 'ETIMEDOUT'];
    if (targetErrors.includes((err as any).code)) {
      return true;
    }
    return false;
  },
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (err: Error) => {
  logger.error('Redis connection error', { message: err.message });
});

export default redis;
