import { REDIS_HOST, REDIS_PORT } from './env.js';

/**
 * Returns plain RedisOptions for BullMQ Queue and Worker.
 *
 * Passing raw options (instead of a Redis instance) avoids the ioredis
 * version type conflict between the top-level `ioredis` package and
 * BullMQ's own bundled `ioredis`.
 */
export const getBullMQConnectionOptions = () => ({
  host: REDIS_HOST,
  port: REDIS_PORT,
  // Required by BullMQ — prevents ioredis from throwing on blocking commands
  maxRetriesPerRequest: null as null,
  retryStrategy: (times: number) => Math.min(times * 50, 2000),
  reconnectOnError: (err: Error) => {
    const retryErrors = ['ECONNREFUSED', 'ETIMEDOUT'];
    return retryErrors.includes((err as any).code);
  },
});
