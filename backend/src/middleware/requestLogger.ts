/**
 * Request Logging Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { getLogger, createRequestLogger } from '../utils/logger';
import { generateRequestId, getElapsedTime, sanitizeForLogging } from '../utils/helpers';
import { telemetryService } from '../services/telemetry.service';

const logger = getLogger();

/**
 * Request logging middleware
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Generate unique request ID
  const requestId = req.headers['x-request-id'] as string || generateRequestId();
  const startTime = process.hrtime();

  // Attach request ID to request object
  (req as any).requestId = requestId;
  (req as any).startTime = startTime;

  // Create child logger with request context
  (req as any).logger = createRequestLogger(requestId);

  // Set request ID in response header
  res.setHeader('x-request-id', requestId);

  // Log incoming request
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    path: req.path,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  // Capture response
  const originalSend = res.send.bind(res);
  res.send = function(body: any): Response {
    const elapsed = getElapsedTime(startTime);

    // Log response
    logger.info('Response sent', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${elapsed.toFixed(2)}ms`
    });

    // Record telemetry
    telemetryService.recordRequest({
      requestId,
      endpoint: req.path,
      method: req.method,
      latencyMs: Math.round(elapsed),
      statusCode: res.statusCode,
      success: res.statusCode < 400,
      error: res.statusCode >= 400 ? sanitizeForLogging(body, 200) : undefined,
      timestamp: new Date()
    });

    return originalSend(body);
  };

  next();
}

/**
 * Body logging middleware (for debugging)
 */
export function bodyLogger(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (req.body && Object.keys(req.body).length > 0) {
    const requestId = (req as any).requestId || 'unknown';
    
    // Log body without sensitive data
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.messages) {
      sanitizedBody.messages = `[${sanitizedBody.messages.length} messages]`;
    }
    if (sanitizedBody.input) {
      sanitizedBody.input = Array.isArray(sanitizedBody.input)
        ? `[${sanitizedBody.input.length} inputs]`
        : sanitizeForLogging(sanitizedBody.input, 100);
    }

    logger.debug('Request body', {
      requestId,
      body: sanitizedBody
    });
  }

  next();
}

export default requestLogger;

