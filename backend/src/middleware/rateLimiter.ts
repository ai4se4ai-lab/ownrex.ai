/**
 * Rate Limiting Middleware
 */

import rateLimit, { RateLimitRequestHandler, Options } from 'express-rate-limit';
import { Request, Response } from 'express';
import { getConfig } from '../config';
import { getLogger } from '../utils/logger';
import { RATE_LIMIT, HTTP_STATUS, ERROR_TYPES } from '../config/constants';

const logger = getLogger();

/**
 * Create a rate limiter with custom options
 */
function createLimiter(options: Partial<Options> = {}): RateLimitRequestHandler {
  const config = getConfig();

  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
      error: {
        message: 'Rate limit exceeded. Please try again later.',
        type: ERROR_TYPES.RATE_LIMIT_ERROR,
        code: 'rate_limit_exceeded'
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request): string => {
      // Use API key if available, otherwise use IP
      const tokenInfo = (req as any).tokenInfo;
      if (tokenInfo?.token) {
        return `key:${tokenInfo.token}`;
      }
      return `ip:${req.ip}`;
    },
    handler: (req: Request, res: Response) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path
      });

      res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        error: {
          message: 'Rate limit exceeded. Please try again later.',
          type: ERROR_TYPES.RATE_LIMIT_ERROR,
          code: 'rate_limit_exceeded'
        }
      });
    },
    skip: (req: Request): boolean => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/v1/health';
    },
    ...options
  });
}

/**
 * Default rate limiter for all endpoints
 */
export const defaultRateLimiter = createLimiter();

/**
 * Stricter rate limiter for chat endpoints
 */
export const chatRateLimiter = createLimiter({
  max: RATE_LIMIT.CHAT_MAX_REQUESTS,
  message: {
    error: {
      message: 'Chat rate limit exceeded. Please try again later.',
      type: ERROR_TYPES.RATE_LIMIT_ERROR,
      code: 'chat_rate_limit_exceeded'
    }
  }
});

/**
 * Stricter rate limiter for completion endpoints
 */
export const completionsRateLimiter = createLimiter({
  max: RATE_LIMIT.COMPLETIONS_MAX_REQUESTS,
  message: {
    error: {
      message: 'Completions rate limit exceeded. Please try again later.',
      type: ERROR_TYPES.RATE_LIMIT_ERROR,
      code: 'completions_rate_limit_exceeded'
    }
  }
});

/**
 * More lenient rate limiter for embeddings
 */
export const embeddingsRateLimiter = createLimiter({
  max: RATE_LIMIT.EMBEDDINGS_MAX_REQUESTS,
  message: {
    error: {
      message: 'Embeddings rate limit exceeded. Please try again later.',
      type: ERROR_TYPES.RATE_LIMIT_ERROR,
      code: 'embeddings_rate_limit_exceeded'
    }
  }
});

export default defaultRateLimiter;

