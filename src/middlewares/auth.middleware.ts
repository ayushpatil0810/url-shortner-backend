import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { type Request, type Response, type NextFunction } from "express";
import { ACCESS_TOKEN_CONFIG } from "../config/env.js";

// Extend the Express Request interface to include a userId property
interface AuthenticatedRequest extends Request {
  userId?: number;
}

// Middleware to authenticate requests using JWT (checks cookies and Authorization header)
export const authMiddleware = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Mobile clients might send the token in the Authorization header, while web clients might use cookies
    const token =
      req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Verify the token and extract the user ID
      const decoded = jwt.verify(token, ACCESS_TOKEN_CONFIG.secret) as {
        id: number;
      };
      // Attach the user ID to the request object for use in subsequent middleware or route handlers
      req.userId = decoded.id;
      next();
    } catch (err) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  },
);
