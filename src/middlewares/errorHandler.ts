import type { Request, Response, NextFunction } from "express";
import logger from "../utils/logger.js";
import AppError from "../utils/AppError.js";
import { type ApiResponse } from "../types/index.js";

// Global error handling middleware
const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Check if error is an AppError instance
  const isAppError = err instanceof AppError;

  // Extract status code and errors from AppError or use defaults
  const statusCode = isAppError ? err.statusCode : 500;
  const errors = isAppError ? err.errors : null;
  const isOperational = isAppError ? err.isOperational : false;

  logger.error("Error occurred:", {
    error: err.message,
    stack: err.stack,
    statusCode,
    isOperational,
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  // Build response object
  const response: Partial<ApiResponse> = {
    success: false,
    message: err.message,
  };

  // Include additional errors if present (e.g., validation errors)
  if (errors) {
    response.errors = errors;
  }

  // Include stack trace in development for all errors, or only non-operational errors in production
  if (process.env.NODE_ENV !== "production") {
    (response as any).stack = err.stack;
  } else if (!isOperational) {
    // In production, hide details of non-operational errors (programmer errors)
    response.message = "Internal server error";
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
