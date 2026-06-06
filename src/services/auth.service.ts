import {
  ACCESS_TOKEN_CONFIG,
  REFRESH_TOKEN_CONFIG,
  SALT_ROUNDS,
} from "../config/env.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { type Response } from "express";
import { storeRefreshToken } from "./user.service.js";

// Hash a plain text password
const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

// Compare a plain text password with a hashed password
const comparePassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Generate an access token for a user
const generateAccessToken = async (userId: number): Promise<string> => {
  return jwt.sign({ id: userId }, ACCESS_TOKEN_CONFIG.secret, {
    expiresIn: ACCESS_TOKEN_CONFIG.expiresIn as string,
  } as jwt.SignOptions);
};

// Generate a refresh token for a user
const generateRefreshToken = async (userId: number): Promise<string> => {
  return jwt.sign({ id: userId }, REFRESH_TOKEN_CONFIG.secret, {
    expiresIn: REFRESH_TOKEN_CONFIG.expiresIn as string,
  } as jwt.SignOptions);
};

// Generate a temporary token for a user
const generateTemporaryToken = async (
  userId: number,
): Promise<{ hashedToken: string; token: string; expiry: Date }> => {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
  return { hashedToken, token, expiry };
};

// Verify an access token and return the decoded payload if valid
const verifyAccessToken = async (
  token: string,
): Promise<{ id: number } | null> => {
  try {
    return jwt.verify(token, ACCESS_TOKEN_CONFIG.secret) as { id: number };
  } catch (err) {
    return null;
  }
};

// Verify a refresh token JWT signature and return the decoded payload if valid
const verifyRefreshTokenJwt = async (
  token: string,
): Promise<{ id: number } | null> => {
  try {
    return jwt.verify(token, REFRESH_TOKEN_CONFIG.secret) as { id: number };
  } catch (err) {
    return null;
  }
};

/** Returns the standard HTTP-only cookie options for auth cookies. */
const buildCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
});

/**
 * Generates a fresh access+refresh token pair, persists the refresh token in
 * the database, and sets both tokens as HTTP-only cookies on the response.
 * Returns the new tokens for callers that need them.
 */
const issueTokenPair = async (
  userId: number,
  res: Response,
): Promise<{ accessToken: string; refreshToken: string }> => {
  const accessToken = await generateAccessToken(userId);
  const refreshToken = await generateRefreshToken(userId);

  const refreshTokenExpiry = new Date(
    Date.now() + REFRESH_TOKEN_CONFIG.expiresInMs,
  );
  await storeRefreshToken(userId, refreshToken, refreshTokenExpiry);

  const cookieOptions = buildCookieOptions();
  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: ACCESS_TOKEN_CONFIG.expiresInMs,
  });
  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: REFRESH_TOKEN_CONFIG.expiresInMs,
  });

  return { accessToken, refreshToken };
};

export {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  generateTemporaryToken,
  verifyAccessToken,
  verifyRefreshTokenJwt,
  buildCookieOptions,
  issueTokenPair,
};
