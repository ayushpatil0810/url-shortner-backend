import { DATABASE_URL } from './env.js';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import logger from '../utils/logger.js';

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
});

const db = drizzle(pool);

// Test database connection
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    // Simple query to test connection
    await db.execute('SELECT 1');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
};

export default db;
