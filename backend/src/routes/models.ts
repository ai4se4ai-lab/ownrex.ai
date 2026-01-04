/**
 * Models Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { openaiService } from '../services/openai.service';
import { cacheService } from '../services/cache.service';
import { telemetryService } from '../services/telemetry.service';
import { getLogger } from '../utils/logger';
import { CACHE_KEYS } from '../config/constants';

const router = Router();
const logger = getLogger();

/**
 * GET /v1/models
 * List available models
 */
router.get(
  '/models',
  async (req: Request, res: Response, next: NextFunction) => {
    const requestId = (req as any).requestId;
    const tracker = telemetryService.createTracker(requestId, '/v1/models', 'GET');

    try {
      // Check cache
      const cached = cacheService.get(CACHE_KEYS.MODELS);
      if (cached) {
        logger.info('Returning cached models list', { requestId });
        res.json(cached);
        tracker.success(200);
        return;
      }

      const response = await openaiService.listModels();

      // Cache for 1 hour
      cacheService.set(CACHE_KEYS.MODELS, response, 3600000);

      res.json(response);
      tracker.success(200);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /v1/models/:model
 * Retrieve a specific model
 */
router.get(
  '/models/:model',
  async (req: Request, res: Response, next: NextFunction) => {
    const requestId = (req as any).requestId;
    const modelId = req.params.model;
    const tracker = telemetryService.createTracker(requestId, `/v1/models/${modelId}`, 'GET');

    try {
      const cacheKey = `${CACHE_KEYS.MODELS}:${modelId}`;

      // Check cache
      const cached = cacheService.get(cacheKey);
      if (cached) {
        logger.info('Returning cached model info', { requestId, modelId });
        res.json(cached);
        tracker.success(200);
        return;
      }

      const response = await openaiService.retrieveModel(modelId);

      // Cache for 1 hour
      cacheService.set(cacheKey, response, 3600000);

      res.json(response);
      tracker.success(200);
    } catch (error) {
      next(error);
    }
  }
);

export default router;

