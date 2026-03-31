import {
  boolean,
  integer,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "./user.model.js";

export const urlsTable = pgTable("urls", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  originalUrl: varchar({ length: 255 }).notNull(),

  shortCode: varchar({ length: 10 }).notNull().unique(),

  userId: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),

  isActive: boolean().notNull().default(true),

  clicks: integer().notNull().default(0),

  createdAt: timestamp({ mode: "date" }).notNull().defaultNow(),
});
