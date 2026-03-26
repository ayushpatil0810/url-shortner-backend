import asyncHandler from "../utils/asyncHandler.js";
import { type Request, type Response } from "express";
import {
  signupRequestSchema,
  signInRequestSchema,
} from "../validations/request.validation.js";
import {
  getUserByEmail,
  createUser,
  storeVerificationToken,
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
import type { ZodFormattedError } from "zod";
// import logger from "../utils/logger.js"; // swap with your actual logger


// Controller for handling user registration
export const signUp = asyncHandler(async (req: Request, res: Response) => {
  // Validate the incoming request data against the signup schema
  const validationResult = signupRequestSchema.safeParse(req.body);

  // If validation fails, return a 400 error with details
  if (!validationResult.success) {
    return sendError(res, "Invalid request data", 400);
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

  // Fix #3: Do NOT issue an access token before the email is verified.
  // Doing so would let unverified users authenticate, undermining the
  // isEmailVerified gate entirely. The client should prompt the user to
  // check their inbox instead.
  //
  // Uncomment and move this block to your verify-email controller once
  // the user confirms their address:
  //   const accessToken = await generateAccessToken(newUser.id);

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
  const { email, password } = req.body;

  if (!validationResult.success) {
    return sendError(res, "Invalid request data", 400);
  }

  const emailNormalized = email.toLowerCase();

  // Check if user exists
  const user = await getUserByEmail(emailNormalized);
  if (!user) {
    return sendError(res, "Invalid email or password", 401);
  }

  // Compare the provided password with the stored hashed password
  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    return sendError(res, "Invalid email or password", 401);
  }

  // Sign the access token with the user's ID and set an expiration time
  const token = await generateAccessToken(user.id);

  return sendSuccess(
    res,
    { userId: user.id, token } as any,
    "User signed in successfully",
  );
});
