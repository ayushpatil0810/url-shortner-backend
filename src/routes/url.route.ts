import express from "express";
import {
  shortenUrl,
  redirectToUrl,
  getUserUrls,
  deleteUrl,
  updateUrl,
} from "../controllers/url.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { apiRateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// Protected routes (require authentication)
router.post("/shorten", authMiddleware, apiRateLimiter, shortenUrl);
router.get("/", authMiddleware, apiRateLimiter, getUserUrls);
router.patch("/:id", authMiddleware, apiRateLimiter, updateUrl);
router.delete("/:id", authMiddleware, apiRateLimiter, deleteUrl);

// Public route - redirect to original URL (must be last to avoid conflicts)
router.get("/:shortCode", redirectToUrl);

export default router;
