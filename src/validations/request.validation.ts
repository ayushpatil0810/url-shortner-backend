import { z } from "zod";

// Strong password validation schema
const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[!@#$%^&*(),.?":{}|<>]/,
    "Password must contain at least one special character",
  );

export const signupRequestSchema = z.object({
  username: z.string().min(3).max(20).lowercase(),
  email: z.string().email().lowercase(),
  password: passwordSchema,
});

export const signInRequestSchema = z
  .object({
    email: z.string().email().lowercase().optional(),
    username: z.string().min(3).max(20).lowercase().optional(),
    password: z.string().min(8), // Login accepts old weak passwords for existing users
  })
  .refine((data) => data.email || data.username, {
    message: "Either email or username is required",
  });

export const updateProfileRequestSchema = z.object({
  username: z.string().min(3).max(20).lowercase().optional(),
  email: z.string().email().lowercase().optional(),
});

export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});

export const forgotPasswordRequestSchema = z.object({
  email: z.string().email().lowercase(),
});

export const resetPasswordRequestSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: passwordSchema,
});
