/**
 * Chat Completion Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { openaiService } from '../services/openai.service';
import { cacheService } from '../services/cache.service';
import { promptService } from '../services/prompt.service';
import { telemetryService } from '../services/telemetry.service';
import { validateChatCompletion } from '../middleware/validator';
import { chatRateLimiter } from '../middleware/rateLimiter';
import { ChatCompletionRequest } from '../types/requests';
import { getLogger } from '../utils/logger';
import { formatSSE, formatSSEDone } from '../utils/helpers';
import { getConfig } from '../config';

const router = Router();
const logger = getLogger();

/**
 * POST /v1/chat/completions
 * Create a chat completion
 */
router.post(
  '/chat/completions',
  chatRateLimiter,
  validateChatCompletion,
  async (req: Request, res: Response, next: NextFunction) => {
    const requestId = (req as any).requestId;
    const tracker = telemetryService.createTracker(requestId, '/v1/chat/completions', 'POST');
    const config = getConfig();

    try {
      const body: ChatCompletionRequest = req.body;
      const model = body.model || config.models.defaultChat;
      const stream = body.stream === true;

      tracker.setModel(model);

      // Validate and enhance messages
      const validation = promptService.validateMessages(body.messages);
      if (!validation.valid) {
        res.status(400).json({
          error: {
            message: validation.error,
            type: 'invalid_request_error',
            code: 'invalid_messages'
          }
        });
        tracker.failure(400, 'invalid_messages');
        return;
      }

      // Enhance messages with system prompt if needed
      const enhancedMessages = promptService.enhanceMessages(body.messages);

      // Check cache for non-streaming requests
      if (!stream && cacheService.getStats().enabled) {
        const cacheKey = cacheService.createChatCacheKey({
          model,
          messages: enhancedMessages,
          temperature: body.temperature,
          max_tokens: body.max_tokens
        });

        const cached = cacheService.get(cacheKey);
        if (cached) {
          logger.info('Returning cached chat completion', { requestId });
          res.json(cached);
          tracker.success(200);
          return;
        }
      }

      const request: ChatCompletionRequest = {
        ...body,
        model,
        messages: enhancedMessages
      };

      if (stream) {
        // Streaming response
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        try {
          const streamResponse = await openaiService.createChatCompletionStream(request);

          for await (const chunk of streamResponse) {
            const sseChunk = {
              id: chunk.id,
              object: 'chat.completion.chunk',
              created: chunk.created,
              model: chunk.model,
              choices: chunk.choices.map((choice, index) => ({
                index,
                delta: {
                  role: choice.delta.role,
                  content: choice.delta.content,
                  tool_calls: choice.delta.tool_calls
                },
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
        const response = await openaiService.createChatCompletion(request);

        // Update tracker with token usage
        if (response.usage) {
          tracker.setTokens(response.usage.prompt_tokens, response.usage.completion_tokens);
        }

        // Cache the response
        if (cacheService.getStats().enabled) {
          const cacheKey = cacheService.createChatCacheKey({
            model,
            messages: enhancedMessages,
            temperature: body.temperature,
            max_tokens: body.max_tokens
          });
          cacheService.set(cacheKey, response);
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

