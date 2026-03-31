import { eq } from "drizzle-orm";
import { type Request, type Response } from "express";
import db from "../config/database.js";
import { urlsTable } from "../models/url.model.js";
import type { AuthenticatedRequest } from "../types/index.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { shortenUrlRequestSchema } from "../validations/request.validation.js";
import { nanoid } from "nanoid";

// Controller for shortening a URL
export const shortenUrl = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const validationResult = shortenUrlRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw new AppError(
        "Invalid request data",
        400,
        validationResult.error.format(),
      );
    }

    let { originalUrl, shortCode } = validationResult.data;

    // Normalize URL: prepend https:// if no protocol
    if (
      !originalUrl.startsWith("http://") &&
      !originalUrl.startsWith("https://")
    ) {
      originalUrl = `https://${originalUrl}`;
    }

    // Retry logic for auto-generated codes only
    const maxAttempts = 3;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const finalShortCode = shortCode ?? nanoid(10);
      attempts++;

      try {
        const [newUrl] = await db
          .insert(urlsTable)
          .values({
            originalUrl,
            shortCode: finalShortCode,
            userId: req.userId,
          })
          .returning();

        return sendSuccess(res, {
          message: "URL shortened successfully",
          data: { url: newUrl },
        });
      } catch (error: any) {
        // If user-provided code conflicts, fail immediately
        if (error.code === "23505" && shortCode) {
          throw new AppError("Short code already exists", 409);
        }

        // If auto-generated code conflicts, retry
        if (error.code === "23505" && !shortCode && attempts < maxAttempts) {
          continue;
        }

        // Max retries exhausted for auto-generated code
        if (error.code === "23505") {
          throw new AppError("Failed to generate unique short code", 500);
        }

        throw error;
      }
    }
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
      throw new AppError("URL not found", 404);
    }

    // Redirect to the original URL
    return res.redirect(urlRecord.originalUrl);
  },
);
