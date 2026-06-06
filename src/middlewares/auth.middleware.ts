import asyncHandler from '../utils/asyncHandler.js';
import { type Response, type NextFunction } from 'express';
import AppError from '../utils/AppError.js';
import { verifyAccessToken } from '../services/auth.service.js';
import { type AuthenticatedRequest } from '../types/index.js';

// Middleware to authenticate requests using JWT (checks cookies and Authorization header)
export const authMiddleware = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Mobile clients might send the token in the Authorization header, while web clients might use cookies
    const token =
      req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new AppError('Unauthorized', 401);
    }

    // Verify the token and extract the user ID
    const decoded = await verifyAccessToken(token);

    if (!decoded) {
      throw new AppError('Unauthorized', 401);
    }

    // Attach the user ID to the request object for use in subsequent middleware or route handlers
    req.userId = decoded.id;
    next();
  },
);
