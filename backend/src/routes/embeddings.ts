/**
 * Embeddings Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { openaiService } from '../services/openai.service';
import { cacheService } from '../services/cache.service';
import { telemetryService } from '../services/telemetry.service';
import { validateEmbedding } from '../middleware/validator';
import { embeddingsRateLimiter } from '../middleware/rateLimiter';
import { EmbeddingRequest } from '../types/requests';
import { getLogger } from '../utils/logger';
import { getConfig } from '../config';

const router = Router();
const logger = getLogger();

/**
 * POST /v1/embeddings
 * Create embeddings for the input text
 */
router.post(
  '/embeddings',
  embeddingsRateLimiter,
  validateEmbedding,
  async (req: Request, res: Response, next: NextFunction) => {
    const requestId = (req as any).requestId;
    const tracker = telemetryService.createTracker(requestId, '/v1/embeddings', 'POST');
    const config = getConfig();

    try {
      const body: EmbeddingRequest = req.body;
      const model = body.model || config.models.defaultEmbedding;

      tracker.setModel(model);

      // Check cache
      if (cacheService.getStats().enabled) {
        const cacheKey = cacheService.createEmbeddingCacheKey({
          model,
          input: body.input,
          dimensions: body.dimensions
        });

        const cached = cacheService.get(cacheKey);
        if (cached) {
          logger.info('Returning cached embeddings', { requestId });
          res.json(cached);
          tracker.success(200);
          return;
        }
      }

      const request: EmbeddingRequest = {
        ...body,
        model
      };

      const response = await openaiService.createEmbedding(request);

      // Update tracker with token usage
      if (response.usage) {
        tracker.setTokens(response.usage.prompt_tokens, 0);
      }

      // Cache the response
      if (cacheService.getStats().enabled) {
        const cacheKey = cacheService.createEmbeddingCacheKey({
          model,
          input: body.input,
          dimensions: body.dimensions
        });
        cacheService.set(cacheKey, response);
      }

      res.json(response);
      tracker.success(200);
    } catch (error) {
      next(error);
    }
  }
);

export default router;

