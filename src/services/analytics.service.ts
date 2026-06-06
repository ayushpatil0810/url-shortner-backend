import redis from '../config/redis.js';
import logger from '../utils/logger.js';

// How many days to retain per-day click data in Redis
const DAILY_STATS_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

// ─── Key Helpers ─────────────────────────────────────────────────────────────

const keys = {
  totalClicks: (urlId: number) => `url:${urlId}:clicks`,
  dailyClicks: (urlId: number, date: string) => `url:${urlId}:daily:${date}`,
  lastAccessed: (urlId: number) => `url:${urlId}:lastAccessed`,
};

const todayKey = (): string => new Date().toISOString().split('T')[0]!; // YYYY-MM-DD

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Records a click event for a URL in Redis.
 * Updates total click counter, today's daily counter, and last-accessed timestamp.
 * All operations are fire-and-forget (errors are logged, not thrown).
 */
export const recordClick = async (urlId: number): Promise<void> => {
  try {
    const today = todayKey();
    const dailyKey = keys.dailyClicks(urlId, today);

    await Promise.all([
      // Increment the all-time click counter
      redis.incr(keys.totalClicks(urlId)),

      // Increment the daily click counter and set TTL atomically using a pipeline
      redis.pipeline()
        .incr(dailyKey)
        .expire(dailyKey, DAILY_STATS_TTL_SECONDS)
        .exec(),

      // Store the last-accessed ISO timestamp
      redis.set(keys.lastAccessed(urlId), new Date().toISOString()),
    ]);
  } catch (err) {
    logger.error('[Analytics] Failed to record click in Redis', {
      urlId,
      error: err instanceof Error ? err.message : err,
    });
  }
};

// ─── Read ─────────────────────────────────────────────────────────────────────

export interface RedisAnalytics {
  /** Total click count from Redis (real-time) */
  redisClicks: number;
  /** Last time this URL was accessed (ISO string or null) */
  lastAccessed: string | null;
  /** Per-day breakdown for the last 7 days */
  dailyStats: { date: string; clicks: number }[];
}

/**
 * Retrieves real-time analytics for a URL from Redis.
 */
export const getRedisAnalytics = async (urlId: number): Promise<RedisAnalytics> => {
  try {
    // Build date strings for the last 7 days (newest first)
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0]!;
    });

    // Fetch all keys in a single pipeline
    const pipeline = redis.pipeline();
    pipeline.get(keys.totalClicks(urlId));
    pipeline.get(keys.lastAccessed(urlId));
    for (const date of dates) {
      pipeline.get(keys.dailyClicks(urlId, date));
    }

    const results = await pipeline.exec();

    if (!results) {
      return { redisClicks: 0, lastAccessed: null, dailyStats: [] };
    }

    const redisClicks = parseInt((results[0]?.[1] as string | null) ?? '0', 10) || 0;
    const lastAccessed = (results[1]?.[1] as string | null) ?? null;

    const dailyStats = dates.map((date, i) => ({
      date,
      clicks: parseInt((results[i + 2]?.[1] as string | null) ?? '0', 10) || 0,
    }));

    return { redisClicks, lastAccessed, dailyStats };
  } catch (err) {
    logger.error('[Analytics] Failed to read analytics from Redis', {
      urlId,
      error: err instanceof Error ? err.message : err,
    });
    return { redisClicks: 0, lastAccessed: null, dailyStats: [] };
  }
};

/**
 * Deletes all Redis analytics keys for a URL (call when a URL is deleted).
 */
export const deleteAnalytics = async (urlId: number): Promise<void> => {
  try {
    const dates = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0]!;
    });

    const dailyKeys = dates.map((date) => keys.dailyClicks(urlId, date));

    await redis.del(
      keys.totalClicks(urlId),
      keys.lastAccessed(urlId),
      ...dailyKeys,
    );
  } catch (err) {
    logger.error('[Analytics] Failed to delete analytics from Redis', {
      urlId,
      error: err instanceof Error ? err.message : err,
    });
  }
};
