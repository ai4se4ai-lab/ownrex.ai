/**
 * Global Error Handler Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { isAppError } from '../utils/errors';
import { getLogger } from '../utils/logger';
import { HTTP_STATUS, ERROR_TYPES } from '../config/constants';
import { getConfig } from '../config';

const logger = getLogger();

/**
 * Not found handler - catches 404 errors
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    error: {
      message: `Cannot ${req.method} ${req.path}`,
      type: ERROR_TYPES.NOT_FOUND_ERROR,
      code: 'endpoint_not_found'
    }
  });
}

/**
 * Global error handler
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const config = getConfig();
  const requestId = (req as any).requestId || 'unknown';

  // Log the error
  if (isAppError(err)) {
    if (err.statusCode >= 500) {
      logger.error('Server error', {
        requestId,
        error: err.message,
        type: err.type,
        stack: err.stack
      });
    } else {
      logger.warn('Client error', {
        requestId,
        error: err.message,
        type: err.type
      });
    }
  } else {
    logger.error('Unexpected error', {
      requestId,
      error: err.message,
      stack: err.stack
    });
  }

  // Send error response
  if (isAppError(err)) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        type: err.type,
        param: err.param,
        code: err.code
      }
    });
    return;
  }

  // Handle OpenAI errors
  if (err.name === 'OpenAIError' || (err as any).status) {
    const status = (err as any).status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    res.status(status).json({
      error: {
        message: err.message,
        type: ERROR_TYPES.API_ERROR,
        code: 'openai_error'
      }
    });
    return;
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: {
        message: 'Invalid JSON in request body',
        type: ERROR_TYPES.INVALID_REQUEST,
        code: 'invalid_json'
      }
    });
    return;
  }

  // Default to 500 internal server error
  const message = config.nodeEnv === 'production'
    ? 'An internal server error occurred'
    : err.message;

  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    error: {
      message,
      type: ERROR_TYPES.SERVER_ERROR,
      code: 'internal_error'
    }
  });
}

export default errorHandler;

