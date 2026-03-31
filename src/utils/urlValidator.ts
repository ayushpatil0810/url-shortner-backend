import { URL_CONFIG } from "../config/constants.js";
import AppError from "./AppError.js";

/**
 * Validates and normalizes a URL
 * @param url - The URL to validate
 * @returns The normalized URL with protocol
 * @throws AppError if URL is invalid or too long
 */
export const validateAndNormalizeUrl = (url: string): string => {
  // Check length
  if (url.length > URL_CONFIG.MAX_URL_LENGTH) {
    throw new AppError(
      `URL exceeds maximum length of ${URL_CONFIG.MAX_URL_LENGTH} characters`,
      400,
    );
  }

  // Normalize URL: prepend https:// if no protocol
  let normalizedUrl = url;
  if (
    !normalizedUrl.startsWith("http://") &&
    !normalizedUrl.startsWith("https://")
  ) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  // Validate URL format
  try {
    const urlObject = new URL(normalizedUrl);

    // Ensure valid protocol
    if (!["http:", "https:"].includes(urlObject.protocol)) {
      throw new AppError("URL must use HTTP or HTTPS protocol", 400);
    }

    // Ensure hostname exists
    if (!urlObject.hostname) {
      throw new AppError("URL must include a valid hostname", 400);
    }

    return normalizedUrl;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Invalid URL format", 400);
  }
};
