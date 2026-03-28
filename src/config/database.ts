import { DATABASE_URL } from "./env.js";
import { drizzle } from "drizzle-orm/neon-http";
import logger from "../utils/logger.js";

const db = drizzle(DATABASE_URL);

// Test database connection
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    // Simple query to test connection
    await db.execute("SELECT 1");
    return true;
  } catch (error) {
    logger.error("Database connection failed:", error);
    return false;
  }
};

export default db;
