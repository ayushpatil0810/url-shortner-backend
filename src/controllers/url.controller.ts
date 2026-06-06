import { and, eq } from 'drizzle-orm';
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
import { nanoid } from 'nanoid';
import { validateAndNormalizeUrl } from '../utils/urlValidator.js';
import { URL_CONFIG } from '../config/constants.js';
import {
  recordClick,
  getRedisAnalytics,
  deleteAnalytics,
} from '../services/analytics.service.js';

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

    let { originalUrl, shortCode } = validationResult.data;

    // Validate and normalize URL
    const normalizedUrl = validateAndNormalizeUrl(originalUrl);

    // Retry logic for auto-generated codes only
    let attempts = 0;

    while (attempts < URL_CONFIG.MAX_RETRY_ATTEMPTS) {
      const finalShortCode = shortCode ?? nanoid(URL_CONFIG.SHORT_CODE_LENGTH);
      attempts++;

      try {
        const [newUrl] = await db
          .insert(urlsTable)
          .values({
            originalUrl: normalizedUrl,
            shortCode: finalShortCode,
            userId: req.userId,
          })
          .returning();

        return sendSuccess(
          res,
          { url: newUrl },
          'URL shortened successfully',
          201,
        );
      } catch (error: any) {
        // If user-provided code conflicts, fail immediately
        if (error.code === '23505' && shortCode) {
          throw new AppError('Short code already exists', 409);
        }

        // If auto-generated code conflicts, retry
        if (
          error.code === '23505' &&
          !shortCode &&
          attempts < URL_CONFIG.MAX_RETRY_ATTEMPTS
        ) {
          continue;
        }

        // Max retries exhausted for auto-generated code
        if (error.code === '23505') {
          throw new AppError('Failed to generate unique short code', 500);
        }

        throw error;
      }
    }

    // This should never be reached, but ensures all code paths return
    throw new AppError('Failed to generate unique short code', 500);
  },
);

// Controller for redirecting to original URL
export const redirectToUrl = asyncHandler(
  async (req: Request, res: Response) => {
    const { shortCode } = req.params;

    // Find the original URL based on the short code
    const [urlRecord] = await db
      .select()
      .from(urlsTable)
      .where(eq(urlsTable.shortCode, shortCode as string));

    if (!urlRecord) {
      throw new AppError('URL not found', 404);
    }

    // Record click in Redis (fire-and-forget — errors are caught inside the service)
    recordClick(urlRecord.id);

    // Persist the click count to the DB as well (best-effort)
    db.update(urlsTable)
      .set({ clicks: urlRecord.clicks + 1 })
      .where(eq(urlsTable.id, urlRecord.id))
      .catch((err: any) => {
        console.error('[URL] Failed to increment DB click count:', err);
      });

    // Redirect to the original URL
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

    // Attempt to delete the URL record, ensuring it belongs to the authenticated user
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

    // Validate and normalize URL
    const normalizedUrl = validateAndNormalizeUrl(originalUrl);

    // Attempt to update the URL record, ensuring it belongs to the authenticated user
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

    // Find the URL record based on the short code and user ID
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
