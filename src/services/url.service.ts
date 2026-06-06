import db from "../config/database.js";
import { urlsTable } from "../models/url.model.js";
import { URL_CONFIG } from "../config/constants.js";
import { nanoid } from "nanoid";
import { validateAndNormalizeUrl } from "../utils/urlValidator.js";
import AppError from "../utils/AppError.js";
import { type InferSelectModel } from "drizzle-orm";

export type UrlRecord = InferSelectModel<typeof urlsTable>;

/**
 * Attempts to insert a URL record with the given short code.
 * Returns the created record on success, or `undefined` on a unique-constraint
 * violation so the caller can decide whether to retry.
 * Re-throws all other database errors.
 */
const tryInsertUrl = async (
  originalUrl: string,
  shortCode: string,
  userId: number,
): Promise<UrlRecord | undefined> => {
  try {
    const [newUrl] = await db
      .insert(urlsTable)
      .values({ originalUrl, shortCode, userId })
      .returning();
    return newUrl;
  } catch (error: any) {
    if (error.code === "23505") {
      return undefined; // unique-constraint violation — signal the caller to retry/fail
    }
    throw error; // unexpected error — propagate
  }
};

/**
 * Shortens a URL for the given user.
 * When a custom short code is provided it is used as-is (no retry on conflict).
 * When no code is provided a random one is generated and the insert is retried
 * up to MAX_RETRY_ATTEMPTS times before giving up.
 *
 * Returns the newly created URL record.
 */
export const createShortUrl = async (
  rawUrl: string,
  userId: number,
  customShortCode?: string,
): Promise<UrlRecord> => {
  const normalizedUrl = validateAndNormalizeUrl(rawUrl);

  if (customShortCode) {
    const record = await tryInsertUrl(normalizedUrl, customShortCode, userId);
    if (record === undefined) {
      throw new AppError("Short code already exists", 409);
    }
    return record;
  }

  // Auto-generate with retry
  for (let attempt = 0; attempt < URL_CONFIG.MAX_RETRY_ATTEMPTS; attempt++) {
    const shortCode = nanoid(URL_CONFIG.SHORT_CODE_LENGTH);
    const record = await tryInsertUrl(normalizedUrl, shortCode, userId);
    if (record !== undefined) {
      return record;
    }
    // undefined → collision, loop and try again
  }

  throw new AppError("Failed to generate unique short code", 500);
};
