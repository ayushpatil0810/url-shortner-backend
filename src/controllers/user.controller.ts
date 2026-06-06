import asyncHandler from '../utils/asyncHandler.js';
import { type Response } from 'express';
import { sendSuccess } from '../utils/response.js';
import {
  getUserById,
  updateUserProfile,
  getUserWithPassword,
  updatePassword as updateUserPassword,
  validateProfileUpdates,
} from '../services/user.service.js';
import { hashPassword, comparePassword } from '../services/auth.service.js';
import AppError from '../utils/AppError.js';
import {
  updateProfileRequestSchema,
  changePasswordRequestSchema,
} from '../validations/request.validation.js';
import { type AuthenticatedRequest } from '../types/index.js';

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/** Throws 401 if userId is missing (guards all authenticated handlers). */
function requireUserId(userId: number | undefined): asserts userId is number {
  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }
}

// ---------------------------------------------------------------------------
// Controllers
// ---------------------------------------------------------------------------

// Get current user profile
export const getProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    requireUserId(req.userId);

    const user = await getUserById(req.userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return sendSuccess(res, user, 'Profile retrieved successfully', 200);
  },
);

// Update user profile
export const updateProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    requireUserId(req.userId);

    const validationResult = updateProfileRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(
        'Invalid request data',
        400,
        validationResult.error.format(),
      );
    }

    const { username, email } = validationResult.data;

    if (!username && !email) {
      throw new AppError(
        'At least one field (username or email) is required',
        400,
      );
    }

    // Validate uniqueness and normalise casing in one service call
    const rawUpdates: { username?: string; email?: string } = {};
    if (username !== undefined) rawUpdates.username = username;
    if (email !== undefined) rawUpdates.email = email;
    const updates = await validateProfileUpdates(req.userId, rawUpdates);

    const updatedUser = await updateUserProfile(req.userId, updates);
    if (!updatedUser) {
      throw new AppError('Failed to update profile', 500);
    }

    return sendSuccess(res, updatedUser, 'Profile updated successfully', 200);
  },
);

// Change user password
export const changePassword = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    requireUserId(req.userId);

    const validationResult = changePasswordRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(
        'Invalid password data',
        400,
        validationResult.error.format(),
      );
    }

    const { currentPassword, newPassword } = validationResult.data;

    const user = await getUserWithPassword(req.userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isPasswordValid = await comparePassword(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    const hashedPassword = await hashPassword(newPassword);
    await updateUserPassword(req.userId, hashedPassword);

    return sendSuccess(res, null, 'Password changed successfully', 200);
  },
);
