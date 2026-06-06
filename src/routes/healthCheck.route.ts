import { Router } from 'express';
import { sendSuccess, sendError } from '../utils/response.js';
import { testDatabaseConnection } from '../config/database.js';

const router: Router = Router();

router.get('/health', async (req, res) => {
  const dbHealthy = await testDatabaseConnection();

  const healthStatus = {
    status: dbHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbHealthy ? 'connected' : 'disconnected',
  };

  if (!dbHealthy) {
    return sendError(res, 'Service unhealthy', 503, healthStatus);
  }

  return sendSuccess(res, healthStatus, 'Server is healthy', 200);
});

export default router;
