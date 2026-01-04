/**
 * Ownrex.ai Backend Server Entry Point
 */

import { createServer } from './server';
import { getConfig, loadConfig } from './config';
import { getLogger } from './utils/logger';
import { APP_NAME, APP_VERSION } from './config/constants';

// Load configuration
loadConfig();
const config = getConfig();
const logger = getLogger();

// Create Express app
const app = createServer();

// Start server
const server = app.listen(config.port, () => {
  logger.info(`${APP_NAME} v${APP_VERSION} started`, {
    port: config.port,
    env: config.nodeEnv,
    authEnabled: config.auth.enabled,
    cacheEnabled: config.cache.enabled
  });

  logger.info('Endpoints available:');
  logger.info(`  Health: http://localhost:${config.port}/health`);
  logger.info(`  Chat:   http://localhost:${config.port}/v1/chat/completions`);
  logger.info(`  Completions: http://localhost:${config.port}/v1/completions`);
  logger.info(`  Embeddings:  http://localhost:${config.port}/v1/embeddings`);
  logger.info(`  Models: http://localhost:${config.port}/v1/models`);
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Rejection', { reason });
  process.exit(1);
});

export { app, server };

