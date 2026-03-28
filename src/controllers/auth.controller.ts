import asyncHandler from "../utils/asyncHandler.js";
import { type Request, type Response } from "express";
import {
  signupRequestSchema,
  signInRequestSchema,
} from "../validations/request.validation.js";
import {
  getUserByEmail,
  createUser,
  getUserByUsername,
  storeVerificationToken,
  verifyEmailToken,
} from "../services/user.service.js";
import { sendError, sendSuccess } from "../utils/response.js";
import {
  hashPassword,
  verifyToken,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  generateTemporaryToken,
} from "../services/auth.service.js";
import { sendEmail, emailContent } from "../utils/mail.js";
import { APP_BASE_URL } from "../config/env.js";
import crypto from "crypto";
import msConverter from "../utils/msConverter.js";
// import logger from "../utils/logger.js"; // swap with your actual logger

// Controller for handling user registration
export const signUp = asyncHandler(async (req: Request, res: Response) => {
  // Validate the incoming request data against the signup schema
  const validationResult = signupRequestSchema.safeParse(req.body);

  // If validation fails, return a 400 error with details
  if (!validationResult.success) {
    return sendError(
      res,
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
    return sendError(res, "User already exists", 409);
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
    return sendError(res, "Failed to create user", 500);
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
    throw new Error("APP_BASE_URL environment variable is not set");
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
    return sendError(
      res,
      "Invalid request data",
      400,
      validationResult.error.format(),
    );
  }

  // Destructure the validated data
  const { username, email, password } = validationResult.data;

  // Ensure that either email or username is provided
  if (!email && !username) {
    return sendError(res, "Email or username is required", 400);
  }

  // Normalize email to lowercase if provided, otherwise use username for lookup
  const emailNormalized = email ? email.toLowerCase() : undefined;

  // Fetch the user from the database using email or username
  const user = emailNormalized
    ? await getUserByEmail(emailNormalized)
    : await getUserByUsername(username as string);

  if (!user) {
    return sendError(res, "Invalid email or password", 401);
  }

  // Check if email is verified before allowing login
  if (!user.isEmailVerified) {
    return sendError(
      res,
      "Please verify your email before signing in. Check your inbox for the verification link.",
      403,
    );
  }

  // Compare the provided password with the stored hashed password
  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    return sendError(res, "Invalid email or password", 401);
  }

  // Sign the access token with the user's ID and set an expiration time
  const accessToken = await generateAccessToken(user.id);

  // Sign the refresh token with the user's ID and set a longer expiration time
  const refreshToken = await generateRefreshToken(user.id);

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Use secure cookies in production
    sameSite: "strict" as const, // Prevent CSRF
  };

  // Set tokens as HTTP-only cookies instead of exposing them in the response body
  res.cookie("accessToken", accessToken, {
    ...options,
    maxAge: msConverter("15m"),
  }); // 15 minutes
  res.cookie("refreshToken", refreshToken, {
    ...options,
    maxAge: msConverter("7d"),
  }); // 7 days

  return sendSuccess(
    res,
    { userId: user.id, accessToken, refreshToken } as any,
    "User logged in successfully",
  );
});

// Controller for handling email verification
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.query;

  // Validate that token is provided
  if (!token || typeof token !== "string") {
    return sendError(res, "Verification token is required", 400);
  }

  // Hash the token to compare with stored hash
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Find user with matching token and check expiry
  const user = await verifyEmailToken(hashedToken);

  if (!user) {
    return sendError(res, "Invalid or expired verification token", 400);
  }

  // Check if token has expired
  if (
    user.emailVerificationTokenExpiry &&
    new Date() > user.emailVerificationTokenExpiry
  ) {
    return sendError(
      res,
      "Verification token has expired. Please request a new one.",
      400,
    );
  }

  // Check if already verified
  if (user.isEmailVerified) {
    return sendSuccess(res, null, "Email already verified", 200);
  }

  return sendSuccess(
    res,
    null,
    "Email verified successfully. You can now sign in.",
    200,
  );
});
