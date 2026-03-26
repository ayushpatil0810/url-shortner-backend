import {
  boolean,
  integer,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  username: varchar({ length: 255 }).notNull().unique(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),

  isEmailVerified: boolean().notNull().default(false),

  refreshToken: varchar({ length: 255 }),
  refreshTokenExpiry: timestamp(),

  forgotPasswordToken: varchar({ length: 255 }),
  forgotPasswordTokenExpiry: timestamp(),

  emailVerificationToken: varchar({ length: 255 }),
  emailVerificationTokenExpiry: timestamp(),

  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});
