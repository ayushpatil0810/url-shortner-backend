import { type Request } from "express";
import { type InferSelectModel } from "drizzle-orm";
import { usersTable } from "../models/index.js";

// User type from database schema
export type User = InferSelectModel<typeof usersTable>;

// User without password field
export type SafeUser = Omit<User, "password">;

// Authenticated request with userId attached by auth middleware
export interface AuthenticatedRequest extends Request {
  userId: number;
}

// Standardized API response structure
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, unknown>;
}

// JWT payload structure
export interface JwtPayload {
  id: number;
  iat?: number;
  exp?: number;
}
