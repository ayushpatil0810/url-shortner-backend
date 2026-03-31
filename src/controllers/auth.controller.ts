import asyncHandler from "../utils/asyncHandler.js";
import { type Request, type Response } from "express";
import {
  signupRequestSchema,
  signInRequestSchema,
  forgotPasswordRequestSchema,
  resetPasswordRequestSchema,
} from "../validations/request.validation.js";
import {
  getUserByEmail,
  createUser,
  getUserByUsername,
  storeVerificationToken,
  verifyEmailToken,
  storeRefreshToken,
  verifyRefreshToken,
  clearRefreshToken,
  storeForgotPasswordToken,
  verifyForgotPasswordToken,
  updatePassword,
} from "../services/user.service.js";
import { sendError, sendSuccess } from "../utils/response.js";
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  generateTemporaryToken,
  verifyRefreshToken as verifyRefreshTokenJWT,
} from "../services/auth.service.js";
import { sendEmail, emailContent } from "../utils/mail.js";
import {
  APP_BASE_URL,
  ACCESS_TOKEN_CONFIG,
  REFRESH_TOKEN_CONFIG,
} from "../config/env.js";
import crypto from "crypto";
import AppError from "../utils/AppError.js";
import { type AuthenticatedRequest, type SafeUser } from "../types/index.js";

// Controller for handling user registration
export const signUp = asyncHandler(async (req: Request, res: Response) => {
  // Validate the incoming request data against the signup schema
  const validationResult = signupRequestSchema.safeParse(req.body);

  // If validation fails, return a 400 error with details
  if (!validationResult.success) {
    throw new AppError(
      "Invalid request data",
      400,
      validationResult.error.format(),
    );
  }

  // Destructure the validated data
  const { username, email, password } = validationResult.data;
  const emailNormalized = email.toLowerCase();

  // Check if a user with the provided email already exists
  const existingUser = await getUserByEmail(emailNormalized);
  if (existingUser) {
    throw new AppError("User already exists", 409);
  }

  // Hash the password before storing it in the database
  const hashedPassword = await hashPassword(password);

  // Create the user in the database with email verification fields
  const newUser = await createUser({
    email: emailNormalized,
    password: hashedPassword,
    username,
    isEmailVerified: false,
  });

  if (!newUser) {
    throw new AppError("Failed to create user", 500);
  }

  // Generate a temporary token for email verification
  const { hashedToken, token, expiry } = await generateTemporaryToken(
    newUser.id,
  );

  // Store the hashed token and expiry in the database for later verification
  await storeVerificationToken(newUser.id, hashedToken, expiry);

  // Construct the verification URL to be sent in the email
  if (!APP_BASE_URL) {
    // Fail loudly at runtime rather than silently sending a broken link
    throw new AppError("APP_BASE_URL environment variable is not set", 500);
  }
  // Use URL API to construct the verification link with query parameters
  const verificationUrl = new URL("/api/v1/auth/verify-email", APP_BASE_URL);
  verificationUrl.searchParams.set("token", token);

  await sendEmail({
    to: emailNormalized,
    subject: "Verify Your Email",
    mailgenContent: emailContent(
      username,
      "welcome",
      verificationUrl.toString(),
    ),
  });

  return sendSuccess(
    res,
    { userId: newUser.id },
    "Account created. Please check your email to verify your account before signing in.",
    201,
  );
});

// Controller for handling user sign-in
export const signIn = asyncHandler(async (req: Request, res: Response) => {
  const validationResult = signInRequestSchema.safeParse(req.body);

  // If validation fails, return a 400 error with details
  if (!validationResult.success) {
    throw new AppError(
      "Invalid request data",
      400,
      validationResult.error.format(),
    );
  }

  // Destructure the validated data
  const { username, email, password } = validationResult.data;

  // Ensure that either email or username is provided
  if (!email && !username) {
    throw new AppError("Email or username is required", 400);
  }

  // Normalize email to lowercase if provided, otherwise use username for lookup
  const emailNormalized = email ? email.toLowerCase() : undefined;

  // Fetch the user from the database using email or username
  const user = emailNormalized
    ? await getUserByEmail(emailNormalized)
    : await getUserByUsername(username as string);

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  // Check if email is verified before allowing login
  if (!user.isEmailVerified) {
    throw new AppError(
      "Please verify your email before signing in. Check your inbox for the verification link.",
      403,
    );
  }

  // Compare the provided password with the stored hashed password
  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  // Sign the access token with the user's ID and set an expiration time
  const accessToken = await generateAccessToken(user.id);

  // Sign the refresh token with the user's ID and set a longer expiration time
  const refreshToken = await generateRefreshToken(user.id);

  // Store refresh token in database
  const refreshTokenExpiry = new Date(
    Date.now() + REFRESH_TOKEN_CONFIG.expiresInMs,
  );
  await storeRefreshToken(user.id, refreshToken, refreshTokenExpiry);

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Use secure cookies in production
    sameSite: "strict" as const, // Prevent CSRF
  };

  // Set tokens as HTTP-only cookies instead of exposing them in the response body
  res.cookie("accessToken", accessToken, {
    ...options,
    maxAge: ACCESS_TOKEN_CONFIG.expiresInMs,
  });
  res.cookie("refreshToken", refreshToken, {
    ...options,
    maxAge: REFRESH_TOKEN_CONFIG.expiresInMs,
  });

  return sendSuccess(res, { userId: user.id }, "User logged in successfully");
});

// Controller for handling user logout
export const logout = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
    };

    // Get userId from request (set by authMiddleware)
    const userId = req.userId;

    // Clear refresh token from database
    if (userId) {
      await clearRefreshToken(userId);
    }

    // Clear auth cookies so browser clients are logged out immediately
    res.clearCookie("accessToken", options);
    res.clearCookie("refreshToken", options);

    return sendSuccess(res, null, "User logged out successfully", 200);
  },
);

// Controller for refreshing access token
export const refreshAccessToken = asyncHandler(
  async (req: Request, res: Response) => {
    // Get refresh token from cookies or body
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      throw new AppError("Refresh token is required", 401);
    }

    try {
      // Verify the refresh token JWT
      const decoded = await verifyRefreshTokenJWT(refreshToken);

      if (!decoded) {
        throw new AppError("Invalid or expired refresh token", 401);
      }

      // Verify refresh token exists in database and hasn't expired
      const user = await verifyRefreshToken(decoded.id, refreshToken);

      if (!user) {
        throw new AppError("Invalid or expired refresh token", 401);
      }

      // Generate new access token
      const newAccessToken = await generateAccessToken(user.id);

      // Generate new refresh token (token rotation)
      const newRefreshToken = await generateRefreshToken(user.id);
      const refreshTokenExpiry = new Date(
        Date.now() + REFRESH_TOKEN_CONFIG.expiresInMs,
      );
      await storeRefreshToken(user.id, newRefreshToken, refreshTokenExpiry);

      const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict" as const,
      };

      // Set new tokens as cookies
      res.cookie("accessToken", newAccessToken, {
        ...options,
        maxAge: ACCESS_TOKEN_CONFIG.expiresInMs,
      });
      res.cookie("refreshToken", newRefreshToken, {
        ...options,
        maxAge: REFRESH_TOKEN_CONFIG.expiresInMs,
      });

      return sendSuccess(
        res,
        { userId: user.id },
        "Token refreshed successfully",
        200,
      );
    } catch (error) {
      throw new AppError("Invalid refresh token", 401);
    }
  },
);

// Controller for handling email verification
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.query;

  // Validate that token is provided
  if (!token || typeof token !== "string") {
    throw new AppError("Verification token is required", 400);
  }

  // Hash the token to compare with stored hash
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Find user with matching token and check expiry
  const result = await verifyEmailToken(hashedToken);

  if (!result.user) {
    if (result.error === "expired") {
      throw new AppError(
        "Verification token has expired. Please request a new one.",
        400,
      );
    }
    throw new AppError("Invalid verification token", 400);
  }

  return sendSuccess(
    res,
    null,
    "Email verified successfully. You can now sign in.",
    200,
  );
});

// Controller for resending verification email
export const resendVerificationEmail = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
      throw new AppError("Email is required", 400);
    }

    const emailNormalized = email.toLowerCase();
    const user = await getUserByEmail(emailNormalized);

    // Always return success to prevent email enumeration
    if (!user) {
      return sendSuccess(
        res,
        null,
        "If that email exists, a new verification link has been sent.",
        200,
      );
    }

    // If already verified, no need to resend
    if (user.isEmailVerified) {
      throw new AppError("Email is already verified. Please sign in.", 400);
    }

    // Generate a new temporary token
    const { hashedToken, token, expiry } = await generateTemporaryToken(
      user.id,
    );

    // Overwrite the old token in the database
    await storeVerificationToken(user.id, hashedToken, expiry);

    if (!APP_BASE_URL) {
      throw new AppError("APP_BASE_URL environment variable is not set", 500);
    }

    const verificationUrl = new URL("/api/v1/auth/verify-email", APP_BASE_URL);
    verificationUrl.searchParams.set("token", token);

    await sendEmail({
      to: emailNormalized,
      subject: "Verify Your Email",
      mailgenContent: emailContent(
        user.username,
        "welcome",
        verificationUrl.toString(),
      ),
    });

    return sendSuccess(
      res,
      null,
      "If that email exists, a new verification link has been sent.",
      200,
    );
  },
);

// Controller for handling forgot password request
export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    // Validate request
    const validationResult = forgotPasswordRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw new AppError(
        "Invalid request data",
        400,
        validationResult.error.format(),
      );
    }

    const { email } = validationResult.data;
    const user = await getUserByEmail(email);

    // Always return success to prevent email enumeration
    if (!user) {
      return sendSuccess(
        res,
        null,
        "If that email exists, a password reset link has been sent.",
        200,
      );
    }

    // Generate a temporary token for password reset
    const { hashedToken, token, expiry } = await generateTemporaryToken(
      user.id,
    );

    // Store the hashed token and expiry in the database
    await storeForgotPasswordToken(user.id, hashedToken, expiry);

    // Construct the password reset URL
    if (!APP_BASE_URL) {
      throw new AppError("APP_BASE_URL environment variable is not set", 500);
    }
    const resetUrl = new URL("/api/v1/auth/reset-password", APP_BASE_URL);
    resetUrl.searchParams.set("token", token);

    // Send password reset email
    await sendEmail({
      to: email,
      subject: "Reset Your Password",
      mailgenContent: emailContent(
        user.username,
        "forgot",
        undefined,
        resetUrl.toString(),
      ),
    });

    return sendSuccess(
      res,
      null,
      "If that email exists, a password reset link has been sent.",
      200,
    );
  },
);

// Controller for handling password reset
export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    // Combine query and body for validation
    const validationResult = resetPasswordRequestSchema.safeParse({
      token: req.query.token,
      newPassword: req.body.password,
    });

    if (!validationResult.success) {
      throw new AppError(
        "Invalid request data",
        400,
        validationResult.error.format(),
      );
    }

    const { token, newPassword } = validationResult.data;

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Verify the token
    const user = await verifyForgotPasswordToken(hashedToken);

    if (!user) {
      throw new AppError(
        "Invalid or expired reset token. Please request a new one.",
        400,
      );
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update the password and clear the reset token
    await updatePassword(user.id, hashedPassword);

    return sendSuccess(
      res,
      null,
      "Password reset successfully. You can now sign in with your new password.",
      200,
    );
  },
);
