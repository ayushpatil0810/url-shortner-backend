import app from './app.js';
import { PORT } from './config/env.js';
import logger from './utils/logger.js';
import { testDatabaseConnection } from './config/database.js';
// Importing the worker registers it and starts listening for BullMQ jobs
import './workers/email.worker.js';

// Test database connection on startup
const startServer = async () => {
  try {
    const dbConnected = await testDatabaseConnection();

    if (!dbConnected) {
      logger.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    logger.info('Database connection established successfully');

    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
