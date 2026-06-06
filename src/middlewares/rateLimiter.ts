import rateLimit from 'express-rate-limit';
import { RATE_LIMITS } from '../config/constants.js';

// Rate limiter for authentication endpoints (signup, signin)
export const authRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.AUTH.WINDOW_MS,
  max: RATE_LIMITS.AUTH.MAX_REQUESTS,
  message: 'Too many authentication attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Rate limiter for password reset/forgot endpoints
export const passwordResetRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.FORGOT_PASSWORD.WINDOW_MS,
  max: RATE_LIMITS.FORGOT_PASSWORD.MAX_REQUESTS,
  message: 'Too many password reset attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for resend email verification endpoint
export const resendEmailRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.RESEND_EMAIL.WINDOW_MS,
  max: RATE_LIMITS.RESEND_EMAIL.MAX_REQUESTS,
  message: 'Too many email requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for general API endpoints (less strict)
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

