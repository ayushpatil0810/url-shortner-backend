import {
  JWT_SECRET,
  ACCESS_TOKEN_CONFIG,
  REFRESH_TOKEN_CONFIG,
  SALT_ROUNDS,
} from "../config/env.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// Define the structure of the JWT payload
interface JwtPayload {
  id: string;
}

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

// Verify a JWT and return the decoded payload if valid
const verifyToken = async (token: string): Promise<JwtPayload | null> => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (err) {
    return null;
  }
};

// Generate an access token for a user
const generateAccessToken = async (userId: number): Promise<string> => {
  return jwt.sign({ id: userId }, ACCESS_TOKEN_CONFIG.secret, {
    expiresIn: ACCESS_TOKEN_CONFIG.expiresIn,
  });
};

// Generate a refresh token for a user
const generateRefreshToken = async (userId: number): Promise<string> => {
  return jwt.sign({ id: userId }, REFRESH_TOKEN_CONFIG.secret, {
    expiresIn: REFRESH_TOKEN_CONFIG.expiresIn,
  });
};

// Generate a temporary token for a user
const generateTemporaryToken = async (
  userId: number,
): Promise<{ hashedToken: string; token: string; expiry: Date }> => {
  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
  return { hashedToken, token, expiry };
};

export {
  hashPassword,
  comparePassword,
  verifyToken,
  generateAccessToken,
  generateRefreshToken,
  generateTemporaryToken,
};
