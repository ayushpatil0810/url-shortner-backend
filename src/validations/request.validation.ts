import { z } from "zod";

export const signupRequestSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(8),
});

export const signInRequestSchema = z
  .object({
    email: z.string().email().optional(),
    username: z.string().min(3).max(20).optional(),
    password: z.string().min(8),
  })
  .refine((data) => data.email || data.username, {
    message: "Either email or username is required",
  });
