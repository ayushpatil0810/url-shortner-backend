import db from '../config/database.js';
import { usersTable } from '../models/index.js';
import { eq } from 'drizzle-orm';
import { type User, type SafeUser } from '../types/index.js';

// Helper function to exclude password from user object
const excludePassword = (user: User | null): SafeUser | null => {
  if (!user) return null;
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// Get a user by their email address
export const getUserByEmail = async (email: string) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));
  return user;
};

// Get a user by their ID (without password)
export const getUserById = async (id: number) => {
  const [user] = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
      isEmailVerified: usersTable.isEmailVerified,
      createdAt: usersTable.createdAt,
      updatedAt: usersTable.updatedAt,
    })
    .from(usersTable)
    .where(eq(usersTable.id, id));
  return user;
};

// Get a user by their ID with password (for password verification)
export const getUserWithPassword = async (id: number) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id));
  return user;
};

// Get a user by their username
export const getUserByUsername = async (username: string) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username));
  return user;
};

// Create a new user in the database
export const createUser = async (userData: {
  email: string;
  password: string;
  username: string;
  isEmailVerified?: boolean;
}) => {
  const [newUser] = await db.insert(usersTable).values(userData).returning();
  return newUser;
};

// Store the hashed token and expiry in the database
export const storeVerificationToken = async (
  userId: number,
  hashedToken: string,
  expiry: Date,
) => {
  await db
    .update(usersTable)
    .set({
      emailVerificationToken: hashedToken,
      emailVerificationTokenExpiry: expiry,
    })
    .where(eq(usersTable.id, userId))
    .returning();
};

// Verify email token and mark email as verified
export const verifyEmailToken = async (hashedToken: string) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.emailVerificationToken, hashedToken));

  if (!user || !user.emailVerificationTokenExpiry) {
    return { user: null, error: 'invalid' };
  }

  // Check if token has expired BEFORE updating
  if (new Date() > user.emailVerificationTokenExpiry) {
    return { user: null, error: 'expired' };
  }

  // Update user to mark email as verified and clear the token
  await db
    .update(usersTable)
    .set({
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpiry: null,
    })
    .where(eq(usersTable.id, user.id));

  return { user, error: null };
};

// Store refresh token in database
export const storeRefreshToken = async (
  userId: number,
  refreshToken: string,
  expiry: Date,
) => {
  await db
    .update(usersTable)
    .set({
      refreshToken: refreshToken,
      refreshTokenExpiry: expiry,
    })
    .where(eq(usersTable.id, userId));
};

// Verify refresh token
export const verifyRefreshToken = async (userId: number, token: string) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  if (!user || !user.refreshToken || !user.refreshTokenExpiry) {
    return null;
  }

  // Check if token matches and hasn't expired
  if (user.refreshToken !== token || new Date() > user.refreshTokenExpiry) {
    return null;
  }

  return user;
};

// Clear refresh token from database (for logout)
export const clearRefreshToken = async (userId: number) => {
  await db
    .update(usersTable)
    .set({
      refreshToken: null,
      refreshTokenExpiry: null,
    })
    .where(eq(usersTable.id, userId));
};

// Store forgot password token
export const storeForgotPasswordToken = async (
  userId: number,
  hashedToken: string,
  expiry: Date,
) => {
  await db
    .update(usersTable)
    .set({
      forgotPasswordToken: hashedToken,
      forgotPasswordTokenExpiry: expiry,
    })
    .where(eq(usersTable.id, userId));
};

// Verify and clear forgot password token
export const verifyForgotPasswordToken = async (hashedToken: string) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.forgotPasswordToken, hashedToken));

  if (!user || !user.forgotPasswordTokenExpiry) {
    return null;
  }

  // Check if token has expired
  if (new Date() > user.forgotPasswordTokenExpiry) {
    return null;
  }

  return user;
};

// Update user password and clear reset token
export const updatePassword = async (userId: number, newPassword: string) => {
  await db
    .update(usersTable)
    .set({
      password: newPassword,
      forgotPasswordToken: null,
      forgotPasswordTokenExpiry: null,
    })
    .where(eq(usersTable.id, userId));
};

// Update user profile (username and/or email)
export const updateUserProfile = async (
  userId: number,
  updates: { username?: string; email?: string },
) => {
  const [updatedUser] = await db
    .update(usersTable)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, userId))
    .returning({
      id: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
      isEmailVerified: usersTable.isEmailVerified,
      createdAt: usersTable.createdAt,
      updatedAt: usersTable.updatedAt,
    });
  return updatedUser;
};
