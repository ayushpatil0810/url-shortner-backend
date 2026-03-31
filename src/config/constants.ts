/**
 * Application constants
 */

// URL shortener configuration
export const URL_CONFIG = {
  SHORT_CODE_LENGTH: 10,
  MAX_URL_LENGTH: 2048,
  MAX_RETRY_ATTEMPTS: 3,
} as const;

// Rate limiting configuration (requests per time window)
export const RATE_LIMITS = {
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 5, // 5 requests per window
  },
  RESEND_EMAIL: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX_REQUESTS: 3, // 3 requests per window
  },
  FORGOT_PASSWORD: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX_REQUESTS: 3, // 3 requests per window
  },
} as const;
