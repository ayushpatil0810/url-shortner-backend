import asyncHandler from '../utils/asyncHandler.js';
import { type Request, type Response } from 'express';
import {
  signupRequestSchema,
  signInRequestSchema,
  forgotPasswordRequestSchema,
  resetPasswordRequestSchema,
} from '../validations/request.validation.js';
import {
  getUserByEmail,
  createUser,
  getUserByUsername,
  storeVerificationToken,
  verifyEmailToken,
  clearRefreshToken,
  storeForgotPasswordToken,
  verifyForgotPasswordToken,
  updatePassword,
  verifyRefreshToken,
} from '../services/user.service.js';
import { sendSuccess } from '../utils/response.js';
import {
  hashPassword,
  comparePassword,
  generateTemporaryToken,
  verifyRefreshTokenJwt,
  issueTokenPair,
  buildCookieOptions,
} from '../services/auth.service.js';
import { emailQueue } from '../queues/email.queue.js';
import { APP_BASE_URL } from '../config/env.js';
import crypto from 'crypto';
import AppError from '../utils/AppError.js';
import { type AuthenticatedRequest } from '../types/index.js';
import logger from '../utils/logger.js';

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/** SHA-256 hash of a plain-text token (for comparing with stored hashes). */
const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

/**
 * Builds the email-verification URL.
 * Throws AppError 500 if APP_BASE_URL is missing so broken links are caught
 * at runtime rather than silently sent.
 */
const buildVerificationUrl = (token: string): string => {
  if (!APP_BASE_URL) {
    throw new AppError("APP_BASE_URL environment variable is not set", 500);
  }
  const url = new URL("/api/v1/auth/verify-email", APP_BASE_URL);
  url.searchParams.set("token", token);
  return url.toString();
};

/** Generates a temporary token, stores its hash, and enqueues the verification email. */
const sendVerificationLink = async (
  userId: number,
  username: string,
  email: string,
  type: 'welcome' | 'resend'
): Promise<void> => {
  const { hashedToken, token, expiry } = await generateTemporaryToken(userId);
  await storeVerificationToken(userId, hashedToken, expiry);
  const verificationUrl = buildVerificationUrl(token);
  
  const enqueuePromise = emailQueue.add(type, {
    type,
    to: email,
    username,
    verificationLink: verificationUrl.toString(),
  });

  if (type === 'welcome') {
    enqueuePromise.catch((err) =>
      logger.error('[SignUp] Failed to enqueue welcome email', {
        userId,
        error: err instanceof Error ? err.message : err,
      }),
    );
  } else {
    await enqueuePromise;
  }
};

// ---------------------------------------------------------------------------
// Controllers
// ---------------------------------------------------------------------------

// Controller for handling user registration
export const signUp = asyncHandler(async (req: Request, res: Response) => {
  const validationResult = signupRequestSchema.safeParse(req.body);

  if (!validationResult.success) {
    throw new AppError(
      'Invalid request data',
      400,
      validationResult.error.format(),
    );
  }

  const { username, email, password } = validationResult.data;
  const emailNormalized = email.toLowerCase();

  const existingUser = await getUserByEmail(emailNormalized);
  if (existingUser) {
    throw new AppError('User already exists', 409);
  }

  const hashedPassword = await hashPassword(password);
  const newUser = await createUser({
    email: emailNormalized,
    password: hashedPassword,
    username,
    isEmailVerified: false,
  });

  if (!newUser) {
    throw new AppError('Failed to create user', 500);
  }

  await sendVerificationLink(newUser.id, username, emailNormalized, 'welcome');

  return sendSuccess(
    res,
    { userId: newUser.id },
    'Account created successfully. A verification email has been sent — you can verify anytime from your account.',
    201,
  );
});

// Controller for handling user sign-in
export const signIn = asyncHandler(async (req: Request, res: Response) => {
  const validationResult = signInRequestSchema.safeParse(req.body);

  if (!validationResult.success) {
    throw new AppError(
      'Invalid sign-in credentials format',
      400,
      validationResult.error.format(),
    );
  }

  const { username, email, password } = validationResult.data;

  if (!email && !username) {
    throw new AppError('Email or username is required', 400);
  }

  const emailNormalized = email ? email.toLowerCase() : undefined;
  const user = emailNormalized
    ? await getUserByEmail(emailNormalized)
    : await getUserByUsername(username as string);

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }

  await issueTokenPair(user.id, res);

  // Include isEmailVerified so the frontend can nudge unverified users
  // without blocking their access
  return sendSuccess(
    res,
    { userId: user.id, isEmailVerified: user.isEmailVerified },
    'Signed in successfully',
  );
});

// Controller for handling user logout
export const logout = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;

    if (userId) {
      await clearRefreshToken(userId);
    }

    const options = buildCookieOptions();
    res.clearCookie('accessToken', options);
    res.clearCookie('refreshToken', options);

    return sendSuccess(res, null, 'Signed out successfully', 200);
  },
);

// Controller for refreshing access token
export const refreshAccessToken = asyncHandler(
  async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 401);
    }

    try {
      const decoded = await verifyRefreshTokenJwt(refreshToken);
      if (!decoded) {
        throw new AppError('Invalid or expired refresh token', 401);
      }

      // Verify the token also exists in the database (detects rotation attacks)
      const user = await verifyRefreshToken(decoded.id, refreshToken);
      if (!user) {
        throw new AppError('Invalid or expired refresh token', 401);
      }

      // Issue a fresh pair (token rotation: old refresh token is replaced)
      await issueTokenPair(user.id, res);

      return sendSuccess(
        res,
        { userId: user.id },
        'Token refreshed successfully',
        200,
      );
    } catch (error) {
      logger.error("Token refresh failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError("Invalid or expired refresh token", 401);
    }
  },
);

// Controller for handling email verification
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token || typeof token !== "string") {
    throw new AppError("Verification token is required", 400);
  }

  const hashedToken = hashToken(token);
  const result = await verifyEmailToken(hashedToken);

  if (!result.user) {
    if (result.error === 'expired') {
      throw new AppError(
        'Verification token has expired. Please request a new one.',
        400,
      );
    }
    throw new AppError('Invalid verification token', 400);
  }

  return sendSuccess(
    res,
    null,
    'Email verified successfully. You can now sign in.',
    200,
  );
});

// Controller for resending verification email
export const resendVerificationEmail = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const emailNormalized = email.toLowerCase();
    const user = await getUserByEmail(emailNormalized);

    // Always return success to prevent email enumeration
    if (!user) {
      return sendSuccess(
        res,
        null,
        'If that email exists, a new verification link has been sent.',
        200,
      );
    }

    if (user.isEmailVerified) {
      throw new AppError('Email is already verified. Please sign in.', 400);
    }

    await sendVerificationLink(user.id, user.username, emailNormalized, 'resend');

    return sendSuccess(
      res,
      null,
      'If that email exists, a new verification link has been sent.',
      200,
    );
  },
);

// Controller for handling forgot password request
export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const validationResult = forgotPasswordRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw new AppError(
        'Invalid email format',
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
        'If that email exists, a password reset link has been sent.',
        200,
      );
    }

    const { hashedToken, token, expiry } = await generateTemporaryToken(
      user.id,
    );
    await storeForgotPasswordToken(user.id, hashedToken, expiry);

    if (!APP_BASE_URL) {
      throw new AppError('APP_BASE_URL environment variable is not set', 500);
    }
    const resetUrl = new URL('/api/v1/auth/reset-password', APP_BASE_URL);
    resetUrl.searchParams.set('token', token);

    // Enqueue the password reset email
    await emailQueue.add('forgot', {
      type: 'forgot',
      to: email,
      username: user.username,
      passwordResetLink: resetUrl.toString(),
    });

    return sendSuccess(
      res,
      null,
      'If that email exists, a password reset link has been sent.',
      200,
    );
  },
);

// Controller for handling password reset
export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const validationResult = resetPasswordRequestSchema.safeParse({
      token: req.query.token,
      newPassword: req.body.password,
    });

    if (!validationResult.success) {
      throw new AppError(
        'Invalid password reset data',
        400,
        validationResult.error.format(),
      );
    }

    const { token, newPassword } = validationResult.data;
    const hashedToken = hashToken(token);
    const user = await verifyForgotPasswordToken(hashedToken);

    if (!user) {
      throw new AppError(
        'Invalid or expired reset token. Please request a new one.',
        400,
      );
    }

    const hashedPassword = await hashPassword(newPassword);
    await updatePassword(user.id, hashedPassword);

    return sendSuccess(
      res,
      null,
      'Password reset successfully. You can now sign in with your new password.',
      200,
    );
  },
);
