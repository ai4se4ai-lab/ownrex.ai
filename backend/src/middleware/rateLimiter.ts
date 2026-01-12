/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Rate Limiting Middleware
 */

import rateLimit, { RateLimitRequestHandler, Options } from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
// Import config first to ensure dotenv.config() is called before we check env vars
import { getConfig } from '../config';
import { getLogger } from '../utils/logger';
import { RATE_LIMIT, HTTP_STATUS, ERROR_TYPES } from '../config/constants';

const logger = getLogger();

// Check if rate limiting is disabled via environment variable (checked at module load time)
// Also check at runtime to handle cases where env var is set after module load
const isRateLimitDisabled = (): boolean => {
	const disabled = process.env.DISABLE_RATE_LIMIT === 'true';
	if (disabled) {
		logger.debug('Rate limiting check: DISABLE_RATE_LIMIT=' + process.env.DISABLE_RATE_LIMIT + ', disabled=' + disabled);
	}
	return disabled;
};

const rateLimitDisabled = isRateLimitDisabled();

if (rateLimitDisabled) {
	logger.info('✅ Rate limiting is DISABLED via DISABLE_RATE_LIMIT environment variable');
	logger.info('   DISABLE_RATE_LIMIT=' + process.env.DISABLE_RATE_LIMIT);
} else {
	logger.warn('⚠️  Rate limiting is ENABLED. DISABLE_RATE_LIMIT=' + (process.env.DISABLE_RATE_LIMIT || 'not set'));
	logger.warn('   To disable rate limiting, set DISABLE_RATE_LIMIT=true in your .env file and restart the server');
}

/**
 * No-op middleware when rate limiting is disabled
 * Also checks at runtime to handle cases where env var changes
 */
const noOpRateLimiter = (_req: Request, _res: Response, next: NextFunction): void => {
	// Double-check at runtime in case env var was set after module load
	const currentlyDisabled = isRateLimitDisabled();
	if (!currentlyDisabled && rateLimitDisabled) {
		logger.warn('Rate limiting was enabled at runtime but module was loaded with it disabled. Restart server to apply changes.');
	}
	// Always allow the request through when using no-op middleware
	next();
};

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
 * Returns no-op middleware if rate limiting is disabled
 * Uses a function to check at runtime as well
 */
export const defaultRateLimiter: RateLimitRequestHandler | ((req: Request, res: Response, next: NextFunction) => void) = rateLimitDisabled ? noOpRateLimiter : createLimiter();

/**
 * Stricter rate limiter for chat endpoints
 * Returns no-op middleware if rate limiting is disabled
 */
export const chatRateLimiter = rateLimitDisabled ? noOpRateLimiter : createLimiter({
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
 * Returns no-op middleware if rate limiting is disabled
 */
export const completionsRateLimiter = rateLimitDisabled ? noOpRateLimiter : createLimiter({
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
 * Returns no-op middleware if rate limiting is disabled
 */
export const embeddingsRateLimiter = rateLimitDisabled ? noOpRateLimiter : createLimiter({
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

