/**
 * Express Server Configuration
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import routes from './routes';
import { authMiddleware } from './middleware/auth';
import { requestLogger, bodyLogger } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { defaultRateLimiter } from './middleware/rateLimiter';
import { getConfig } from './config';

export function createServer(): Application {
  const config = getConfig();
  const app = express();

  // Trust proxy (for rate limiting behind reverse proxy)
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));

  // CORS
  app.use(cors({
    origin: config.cors.origin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-API-Key'],
    exposedHeaders: ['X-Request-Id'],
    credentials: true
  }));

  // Compression
  app.use(compression());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging
  app.use(requestLogger);
  
  // Body logging (debug mode)
  if (config.logging.level === 'debug') {
    app.use(bodyLogger);
  }

  // Authentication (applied globally, but can be skipped per route)
  app.use(authMiddleware);

  // Rate limiting
  app.use(defaultRateLimiter);

  // API routes
  app.use('/', routes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createServer;

