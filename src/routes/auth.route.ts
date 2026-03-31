import express from "express";
import {
  signUp,
  signIn,
  verifyEmail,
  resendVerificationEmail,
  logout,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";
import {
  authRateLimiter,
  passwordResetRateLimiter,
  emailRateLimiter,
} from "../middlewares/rateLimiter.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
const router = express.Router();

// Public routes (no authentication required) with rate limiting
router.route("/signup").post(authRateLimiter, signUp);
router.route("/signin").post(authRateLimiter, signIn);
router.route("/verify-email").get(emailRateLimiter, verifyEmail);
router.route("/resend-verification-email").post(emailRateLimiter, resendVerificationEmail);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/forgot-password").post(passwordResetRateLimiter, forgotPassword);
router.route("/reset-password").post(passwordResetRateLimiter, resetPassword);

// Protected routes would go below with authMiddleware applied individually
// Example: router.route("/profile").get(authMiddleware, getProfile);
router.route("/logout").post(authMiddleware, logout);

export default router;
