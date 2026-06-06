import express from 'express';
import {
  signUp,
  signIn,
  verifyEmail,
  resendVerificationEmail,
  logout,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js';
import {
  authRateLimiter,
  passwordResetRateLimiter,
  resendEmailRateLimiter,
} from '../middlewares/rateLimiter.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
const router = express.Router();

// Public routes (no authentication required) with rate limiting
router.route('/signup').post(authRateLimiter, signUp);
router.route('/signin').post(authRateLimiter, signIn);
router.route('/verify-email').get(verifyEmail);
router
  .route('/resend-verification-email')
  .post(resendEmailRateLimiter, resendVerificationEmail);
router.route('/refresh-token').post(refreshAccessToken);
router.route('/forgot-password').post(passwordResetRateLimiter, forgotPassword);
router.route('/reset-password').post(passwordResetRateLimiter, resetPassword);

// Protected routes (require authentication)
router.route('/logout').post(authMiddleware, logout);

export default router;
