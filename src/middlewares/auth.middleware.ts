import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { type Request, type Response, type NextFunction } from "express";
import { JWT_SECRET } from "../config/env.js";

// Extend the Express Request interface to include a userId property
interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const authMiddleware = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    // Check if the Authorization header is present and starts with "Bearer "
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Extract the token from the header
    const token = authHeader.split(" ")[1];

    // If no token is found, return an unauthorized error
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Verify the token and extract the user ID
    try {
      const decoded = jwt.verify(token, JWT_SECRET as string) as {
        id: string;
      };
      req.userId = decoded.id;
      next();
    } catch (err) {
      console.error("JWT Error:", err);
      return res.status(401).json({ message: "Unauthorized" });
    }
  },
);
