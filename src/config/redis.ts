import { REDIS_URL } from './env.js';
import { Redis } from 'ioredis';

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
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});

export default redis;
