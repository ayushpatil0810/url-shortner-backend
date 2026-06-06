import { z } from 'zod';

// Strong password validation schema
const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[!@#$%^&*(),.?":{}|<>]/,
    'Password must contain at least one special character',
  );

export const signupRequestSchema = z.object({
  username: z.string().min(3).max(20).lowercase(),
  email: z.email().lowercase(),
  password: passwordSchema,
});

export const signInRequestSchema = z
  .object({
    email: z.email().lowercase().optional(),
    username: z.string().min(3).max(20).lowercase().optional(),
    password: z.string().min(6),
  })
  .refine((data) => data.email || data.username, {
    message: 'Either email or username is required',
  });

export const updateProfileRequestSchema = z.object({
  username: z.string().min(3).max(20).lowercase().optional(),
  email: z.email().lowercase().optional(),
});

export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export const forgotPasswordRequestSchema = z.object({
  email: z.email().lowercase(),
});

export const resetPasswordRequestSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: passwordSchema,
});

export const shortenUrlRequestSchema = z.object({
  originalUrl: z.url('Invalid URL format'),
  shortCode: z
    .string()
    .min(4)
    .max(10)
    .regex(/^[a-zA-Z0-9]+$/)
    .optional(),
});

export const deleteUrlRequestSchema = z.object({
  id: z.coerce.number().int().positive('Invalid URL ID'),
});

export const updateUrlRequestSchema = z.object({
  id: z.coerce.number().int().positive('Invalid URL ID'),
  originalUrl: z.string().min(1, 'URL cannot be empty'),
});
