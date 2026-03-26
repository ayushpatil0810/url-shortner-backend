import db from "../config/database.js";
import { usersTable } from "../models/index.js";
import { eq } from "drizzle-orm";

// Get a user by their email address
export const getUserByEmail = async (email: string) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));
  return user;
};

// Get a user by their ID
export const getUserById = async (id: number) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id));
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
