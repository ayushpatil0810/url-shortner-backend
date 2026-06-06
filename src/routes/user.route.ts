import express from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
} from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { apiRateLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// All user routes require authentication
router.route('/profile').get(authMiddleware, apiRateLimiter, getProfile);
router.route('/profile').patch(authMiddleware, apiRateLimiter, updateProfile);
router
  .route('/change-password')
  .post(authMiddleware, apiRateLimiter, changePassword);

export default router;
