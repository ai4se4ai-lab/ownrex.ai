/**
 * Completion Routes (Legacy Completions API)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { openaiService } from '../services/openai.service';
import { telemetryService } from '../services/telemetry.service';
import { validateCompletion } from '../middleware/validator';
import { completionsRateLimiter } from '../middleware/rateLimiter';
import { CompletionRequest } from '../types/requests';
import { getLogger } from '../utils/logger';
import { formatSSE, formatSSEDone } from '../utils/helpers';
import { getConfig } from '../config';

const router = Router();
const logger = getLogger();

/**
 * POST /v1/completions
 * Create a text completion
 */
router.post(
  '/completions',
  completionsRateLimiter,
  validateCompletion,
  async (req: Request, res: Response, next: NextFunction) => {
    const requestId = (req as any).requestId;
    const tracker = telemetryService.createTracker(requestId, '/v1/completions', 'POST');
    const config = getConfig();

    try {
      const body: CompletionRequest = req.body;
      const model = body.model || config.models.defaultCompletion;
      const stream = body.stream === true;

      tracker.setModel(model);

      const request: CompletionRequest = {
        ...body,
        model
      };

      if (stream) {
        // Streaming response
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        try {
          const streamResponse = await openaiService.createCompletionStream(request);

          for await (const chunk of streamResponse) {
            const sseChunk = {
              id: chunk.id,
              object: 'text_completion',
              created: chunk.created,
              model: chunk.model,
              choices: chunk.choices.map((choice, index) => ({
                text: choice.text,
                index,
                logprobs: null,
                finish_reason: choice.finish_reason
              }))
            };

            res.write(formatSSE(sseChunk));
          }

          res.write(formatSSEDone());
          res.end();
          tracker.success(200);
        } catch (error) {
          logger.error('Streaming error', { requestId, error });
          res.write(formatSSE({ error: { message: 'Stream error occurred' } }));
          res.end();
          tracker.failure(500, 'stream_error');
        }
      } else {
        // Non-streaming response
        const response = await openaiService.createCompletion(request);

        // Update tracker with token usage
        if (response.usage) {
          tracker.setTokens(response.usage.prompt_tokens, response.usage.completion_tokens);
        }

        res.json(response);
        tracker.success(200);
      }
    } catch (error) {
      next(error);
    }
  }
);

export default router;

