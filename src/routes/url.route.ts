import express from "express";
const router = express.Router();
import { shortenUrl, redirectToUrl } from "../controllers/url.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { apiRateLimiter } from "../middlewares/rateLimiter.js";

// Route to shorten a URL
router.post("/shorten", authMiddleware, apiRateLimiter, shortenUrl);

// Route to redirect to the original URL (Public route)
router.get("/:shortCode", redirectToUrl);

export default router;