/**
 * Authentication Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { tokenService } from '../services/token.service';
import { AuthenticationError } from '../utils/errors';
import { getLogger } from '../utils/logger';
import { getConfig } from '../config';

const logger = getLogger();

/**
 * Authentication middleware - validates API key in Authorization header
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const config = getConfig();

  // Skip auth if disabled
  if (!config.auth.enabled) {
    return next();
  }

  const authHeader = req.headers.authorization;
  const result = tokenService.validateAuthHeader(authHeader);

  if (!result.valid) {
    logger.warn(`Authentication failed: ${result.reason}`, {
      ip: req.ip,
      path: req.path
    });

    const error = new AuthenticationError(result.reason);
    res.status(error.statusCode).json({
      error: {
        message: error.message,
        type: error.type,
        code: error.code
      }
    });
    return;
  }

  // Add token info to request for downstream use
  (req as any).tokenInfo = result.tokenInfo;
  next();
}

/**
 * Optional auth middleware - validates if present, allows if absent
 */
export function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  return authMiddleware(req, res, next);
}

export default authMiddleware;

