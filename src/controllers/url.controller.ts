import { and, eq, sql } from 'drizzle-orm';
import { type Request, type Response } from 'express';
import db from '../config/database.js';
import { urlsTable } from '../models/url.model.js';
import type { AuthenticatedRequest } from '../types/index.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import {
  shortenUrlRequestSchema,
  deleteUrlRequestSchema,
  updateUrlRequestSchema,
} from '../validations/request.validation.js';
import { validateAndNormalizeUrl } from '../utils/urlValidator.js';
import { createShortUrl } from '../services/url.service.js';
import {
  recordClick,
  getRedisAnalytics,
  deleteAnalytics,
} from '../services/analytics.service.js';
import logger from '../utils/logger.js';

// Controller for shortening a URL
export const shortenUrl = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const validationResult = shortenUrlRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw new AppError(
        'Invalid request data',
        400,
        validationResult.error.format(),
      );
    }

    const { originalUrl, shortCode } = validationResult.data;
    const newUrl = await createShortUrl(originalUrl, req.userId, shortCode);

    return sendSuccess(res, { url: newUrl }, 'URL shortened successfully', 201);
  },
);

// Controller for redirecting to original URL
export const redirectToUrl = asyncHandler(
  async (req: Request, res: Response) => {
    const { shortCode } = req.params;

    const [urlRecord] = await db
      .select()
      .from(urlsTable)
      .where(eq(urlsTable.shortCode, shortCode as string));

    if (!urlRecord) {
      throw new AppError('URL not found', 404);
    }

    // Record click in Redis (fire-and-forget — errors are caught inside the service)
    recordClick(urlRecord.id);

    // Atomically increment click count in the DB — avoids stale read/race under concurrent redirects
    db.update(urlsTable)
      .set({ clicks: sql`${urlsTable.clicks} + 1` })
      .where(eq(urlsTable.id, urlRecord.id))
      .catch((err: unknown) => {
        logger.error('[URL] Failed to increment DB click count', {
          urlId: urlRecord.id,
          error: err instanceof Error ? err.message : err,
        });
      });

    return res.redirect(urlRecord.originalUrl);
  },
);

// Controller for getting all URLs for the authenticated user
export const getUserUrls = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    const userUrls = await db
      .select()
      .from(urlsTable)
      .where(eq(urlsTable.userId, userId));

    return sendSuccess(res, { urls: userUrls }, 'URLs retrieved successfully');
  },
);

// Controller for deleting a URL
export const deleteUrl = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const validationResult = deleteUrlRequestSchema.safeParse(req.params);

    if (!validationResult.success) {
      throw new AppError(
        'Invalid URL ID format',
        400,
        validationResult.error.format(),
      );
    }

    const { id } = validationResult.data;
    const userId = req.userId;

    const urlRecord = await db
      .delete(urlsTable)
      .where(and(eq(urlsTable.id, id), eq(urlsTable.userId, userId)))
      .returning();

    if (!urlRecord.length) {
      throw new AppError(
        "URL not found or you don't have permission to delete it",
        404,
      );
    }

    // Clean up Redis analytics keys for the deleted URL
    deleteAnalytics(id);

    return sendSuccess(res, null, 'URL deleted successfully');
  },
);

// Controller for updating a URL
export const updateUrl = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const validationResult = updateUrlRequestSchema.safeParse({
      ...req.body,
      ...req.params,
    });

    if (!validationResult.success) {
      throw new AppError(
        'Invalid URL update data',
        400,
        validationResult.error.format(),
      );
    }

    const { id, originalUrl } = validationResult.data;
    const userId = req.userId;
    const normalizedUrl = validateAndNormalizeUrl(originalUrl);

    const urlRecord = await db
      .update(urlsTable)
      .set({ originalUrl: normalizedUrl })
      .where(and(eq(urlsTable.id, id), eq(urlsTable.userId, userId)))
      .returning();

    if (!urlRecord.length) {
      throw new AppError(
        "URL not found or you don't have permission to update it",
        404,
      );
    }

    return sendSuccess(res, { url: urlRecord[0] }, 'URL updated successfully');
  },
);

// Controller for getting URL analytics (click count + Redis real-time data)
export const getUrlAnalytics = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { shortCode } = req.params;
    const userId = req.userId;

    const [urlRecord] = await db
      .select()
      .from(urlsTable)
      .where(
        and(
          eq(urlsTable.shortCode, shortCode as string),
          eq(urlsTable.userId, userId),
        ),
      );

    if (!urlRecord) {
      throw new AppError(
        "URL not found or you don't have permission to view analytics",
        404,
      );
    }

    // Fetch real-time analytics from Redis
    const redisData = await getRedisAnalytics(urlRecord.id);

    return sendSuccess(
      res,
      {
        analytics: {
          // Prefer Redis click count as it is real-time; fall back to DB value
          totalClicks: redisData.redisClicks || urlRecord.clicks,
          dbClicks: urlRecord.clicks,
          redisClicks: redisData.redisClicks,
          lastAccessed: redisData.lastAccessed,
          dailyStats: redisData.dailyStats,
          url: {
            id: urlRecord.id,
            shortCode: urlRecord.shortCode,
            originalUrl: urlRecord.originalUrl,
            createdAt: urlRecord.createdAt,
            isActive: urlRecord.isActive,
          },
        },
      },
      'URL analytics retrieved successfully',
    );
  },
);
