import asyncHandler from "../utils/asyncHandler.js";
import { type Request, type Response } from "express";
import { sendError, sendSuccess } from "../utils/response.js";
import {
  getUserById,
  updateUserProfile,
  getUserByEmail,
  getUserByUsername,
} from "../services/user.service.js";
import { hashPassword, comparePassword } from "../services/auth.service.js";

// Get current user profile
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  if (!userId) {
    return sendError(res, "Unauthorized", 401);
  }

  const user = await getUserById(userId);

  if (!user) {
    return sendError(res, "User not found", 404);
  }

  return sendSuccess(res, user, "Profile retrieved successfully", 200);
});

// Update user profile
export const updateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const { username, email } = req.body;

    if (!userId) {
      return sendError(res, "Unauthorized", 401);
    }

    // Validate that at least one field is provided
    if (!username && !email) {
      return sendError(
        res,
        "At least one field (username or email) is required",
        400,
      );
    }

    // Check if new email already exists
    if (email) {
      const emailNormalized = email.toLowerCase();
      const existingUser = await getUserByEmail(emailNormalized);
      if (existingUser && existingUser.id !== userId) {
        return sendError(res, "Email already in use", 409);
      }
    }

    // Check if new username already exists
    if (username) {
      const existingUser = await getUserByUsername(username);
      if (existingUser && existingUser.id !== userId) {
        return sendError(res, "Username already in use", 409);
      }
    }

    const updates: { username?: string; email?: string } = {};
    if (username) updates.username = username.toLowerCase();
    if (email) updates.email = email.toLowerCase();

    const updatedUser = await updateUserProfile(userId, updates);

    if (!updatedUser) {
      return sendError(res, "Failed to update profile", 500);
    }

    return sendSuccess(
      res,
      updatedUser,
      "Profile updated successfully",
      200,
    );
  },
);

// Change user password
export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return sendError(res, "Unauthorized", 401);
    }

    if (!currentPassword || !newPassword) {
      return sendError(
        res,
        "Current password and new password are required",
        400,
      );
    }

    if (newPassword.length < 8) {
      return sendError(res, "New password must be at least 8 characters", 400);
    }

    // Get user with password to verify current password
    const [user] = await (async () => {
      const db = (await import("../config/database.js")).default;
      const { usersTable } = await import("../models/index.js");
      const { eq } = await import("drizzle-orm");
      return db.select().from(usersTable).where(eq(usersTable.id, userId));
    })();

    if (!user) {
      return sendError(res, "User not found", 404);
    }

    // Verify current password
    const isPasswordValid = await comparePassword(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      return sendError(res, "Current password is incorrect", 401);
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password in database
    const { updatePassword } = await import("../services/user.service.js");
    await updatePassword(userId, hashedPassword);

    return sendSuccess(
      res,
      null,
      "Password changed successfully",
      200,
    );
  },
);
