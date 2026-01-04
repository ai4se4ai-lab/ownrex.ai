/**
 * Health Check Routes
 */

import { Router, Request, Response } from 'express';
import { openaiService } from '../services/openai.service';
import { cacheService } from '../services/cache.service';
import { telemetryService } from '../services/telemetry.service';
import { APP_NAME, APP_VERSION } from '../config/constants';
import { getConfig } from '../config';

const router = Router();

/**
 * GET /health
 * Basic health check
 */
router.get('/health', async (_req: Request, res: Response) => {
  const startTime = Date.now();

  // Check OpenAI connection
  let openaiHealthy = false;
  try {
    openaiHealthy = await openaiService.checkHealth();
  } catch {
    openaiHealthy = false;
  }

  const cacheStats = cacheService.getStats();
  const uptime = telemetryService.getUptime();

  const response = {
    status: openaiHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
    name: APP_NAME,
    uptime,
    responseTime: Date.now() - startTime,
    services: {
      openai: openaiHealthy,
      cache: cacheStats.enabled
    }
  };

  const statusCode = openaiHealthy ? 200 : 503;
  res.status(statusCode).json(response);
});

/**
 * GET /health/live
 * Liveness probe - is the server running?
 */
router.get('/health/live', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'live',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /health/ready
 * Readiness probe - is the server ready to accept requests?
 */
router.get('/health/ready', async (_req: Request, res: Response) => {
  const config = getConfig();

  // Check if OpenAI API key is configured
  if (!config.openai.apiKey) {
    res.status(503).json({
      status: 'not_ready',
      reason: 'OpenAI API key not configured',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Check OpenAI connection
  const openaiHealthy = await openaiService.checkHealth();
  if (!openaiHealthy) {
    res.status(503).json({
      status: 'not_ready',
      reason: 'Cannot connect to OpenAI API',
      timestamp: new Date().toISOString()
    });
    return;
  }

  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /health/stats
 * Server statistics
 */
router.get('/health/stats', (_req: Request, res: Response) => {
  const stats = telemetryService.getUsageStats();
  const cacheStats = cacheService.getStats();

  res.status(200).json({
    uptime: telemetryService.getUptime(),
    requests: stats,
    cache: cacheStats,
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

export default router;

