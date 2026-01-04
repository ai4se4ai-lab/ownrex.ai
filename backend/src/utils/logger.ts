/**
 * Winston Logger Configuration for Ownrex.ai Backend
 */

import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { getConfig } from '../config';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format for console
const consoleFormat = printf(({ level, message, timestamp, requestId, ...metadata }) => {
  let msg = `${timestamp} [${level}]`;
  if (requestId) {
    msg += ` [${requestId}]`;
  }
  msg += `: ${message}`;
  if (Object.keys(metadata).length > 0 && metadata.stack === undefined) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  if (metadata.stack) {
    msg += `\n${metadata.stack}`;
  }
  return msg;
});

// Custom log format for files
const fileFormat = printf(({ level, message, timestamp, requestId, ...metadata }) => {
  const logEntry = {
    timestamp,
    level,
    requestId,
    message,
    ...metadata
  };
  return JSON.stringify(logEntry);
});

function ensureLogDirectory(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function createLogger(): winston.Logger {
  const config = getConfig();
  const transports: winston.transport[] = [];

  // Console transport
  transports.push(
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        consoleFormat
      )
    })
  );

  // File transport (if enabled)
  if (config.logging.fileEnabled && config.nodeEnv !== 'test') {
    ensureLogDirectory(config.logging.filePath);
    
    // Regular log file
    transports.push(
      new winston.transports.File({
        filename: config.logging.filePath,
        format: combine(
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          errors({ stack: true }),
          fileFormat
        ),
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    );

    // Error log file
    const errorLogPath = config.logging.filePath.replace('.log', '-error.log');
    transports.push(
      new winston.transports.File({
        filename: errorLogPath,
        level: 'error',
        format: combine(
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          errors({ stack: true }),
          fileFormat
        ),
        maxsize: 5242880,
        maxFiles: 5
      })
    );
  }

  return winston.createLogger({
    level: config.logging.level,
    defaultMeta: { service: 'ownrex-backend' },
    transports
  });
}

// Create logger singleton
let loggerInstance: winston.Logger | null = null;

export function getLogger(): winston.Logger {
  if (!loggerInstance) {
    loggerInstance = createLogger();
  }
  return loggerInstance;
}

export function resetLogger(): void {
  if (loggerInstance) {
    loggerInstance.close();
    loggerInstance = null;
  }
}

// Child logger with request context
export function createRequestLogger(requestId: string): winston.Logger {
  const logger = getLogger();
  return logger.child({ requestId });
}

// Export default logger
export const logger = getLogger();

export default logger;

