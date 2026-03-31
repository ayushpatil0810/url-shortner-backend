import asyncHandler from "../utils/asyncHandler.js";
import { type Response } from "express";
import { sendError, sendSuccess } from "../utils/response.js";
import {
  getUserById,
  updateUserProfile,
  getUserByEmail,
  getUserByUsername,
  getUserWithPassword,
  updatePassword as updateUserPassword,
} from "../services/user.service.js";
import { hashPassword, comparePassword } from "../services/auth.service.js";
import AppError from "../utils/AppError.js";
import {
  updateProfileRequestSchema,
  changePasswordRequestSchema,
} from "../validations/request.validation.js";
import { type AuthenticatedRequest } from "../types/index.js";

// Get current user profile
export const getProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const user = await getUserById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return sendSuccess(res, user, "Profile retrieved successfully", 200);
  },
);

// Update user profile
export const updateProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    // Validate request
    const validationResult = updateProfileRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw new AppError(
        "Invalid request data",
        400,
        validationResult.error.format(),
      );
    }

    const { username, email } = validationResult.data;

    // Validate that at least one field is provided
    if (!username && !email) {
      throw new AppError(
        "At least one field (username or email) is required",
        400,
      );
    }

    // Check if new email already exists
    if (email) {
      const emailNormalized = email.toLowerCase();
      const existingUser = await getUserByEmail(emailNormalized);
      if (existingUser && existingUser.id !== userId) {
        throw new AppError("Email already in use", 409);
      }
    }

    // Check if new username already exists
    if (username) {
      const existingUser = await getUserByUsername(username);
      if (existingUser && existingUser.id !== userId) {
        throw new AppError("Username already in use", 409);
      }
    }

    const updates: { username?: string; email?: string } = {};
    if (username) updates.username = username.toLowerCase();
    if (email) updates.email = email.toLowerCase();

    const updatedUser = await updateUserProfile(userId, updates);

    if (!updatedUser) {
      throw new AppError("Failed to update profile", 500);
    }

    return sendSuccess(res, updatedUser, "Profile updated successfully", 200);
  },
);

// Change user password
export const changePassword = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;

    if (!userId) {
      throw new AppError("Unauthorized - authentication required", 401);
    }

    // Validate request
    const validationResult = changePasswordRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw new AppError(
        "Invalid password data",
        400,
        validationResult.error.format(),
      );
    }

    const { currentPassword, newPassword } = validationResult.data;

    // Get user with password to verify current password
    const user = await getUserWithPassword(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Verify current password
    const isPasswordValid = await comparePassword(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new AppError("Current password is incorrect", 401);
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password in database
    await updateUserPassword(userId, hashedPassword);

    return sendSuccess(res, null, "Password changed successfully", 200);
  },
);
