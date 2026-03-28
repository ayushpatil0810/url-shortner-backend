import express from "express";
import { signUp, signIn, verifyEmail } from "../controllers/auth.controller.js";
import { authRateLimiter } from "../middlewares/rateLimiter.js";
const router = express.Router();

// Public routes (no authentication required) with rate limiting
router.route("/signup").post(authRateLimiter, signUp);
router.route("/signin").post(authRateLimiter, signIn);
router.route("/verify-email").get(verifyEmail);

// Protected routes would go below with authMiddleware applied individually
// Example: router.route("/profile").get(authMiddleware, getProfile);

export default router;
