/**
 * Configuration module for Ownrex.ai Backend
 * Loads configuration from environment variables
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface Config {
  port: number;
  nodeEnv: string;
  openai: {
    apiKey: string;
    organization?: string;
    baseURL: string;
  };
  models: {
    defaultChat: string;
    defaultCompletion: string;
    defaultEmbedding: string;
  };
  auth: {
    enabled: boolean;
    apiKey: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  cache: {
    enabled: boolean;
    ttl: number;
    type: 'memory' | 'redis';
  };
  logging: {
    level: string;
    fileEnabled: boolean;
    filePath: string;
  };
  cors: {
    origin: string | string[];
  };
  telemetry: {
    enabled: boolean;
  };
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
}

function parseNumber(value: string | undefined, defaultValue: number): number {
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

function validateConfig(config: Config): void {
  if (!config.openai.apiKey || config.openai.apiKey === 'sk-your-openai-api-key-here') {
    console.warn('[Config] Warning: OPENAI_API_KEY is not set. API calls will fail.');
  }
}

export function loadConfig(): Config {
  const config: Config = {
    port: parseNumber(process.env.PORT, 8000),
    nodeEnv: process.env.NODE_ENV || 'development',
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      organization: process.env.OPENAI_ORGANIZATION,
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    },
    models: {
      defaultChat: process.env.DEFAULT_CHAT_MODEL || 'gpt-4',
      defaultCompletion: process.env.DEFAULT_COMPLETION_MODEL || 'gpt-3.5-turbo-instruct',
      defaultEmbedding: process.env.DEFAULT_EMBEDDING_MODEL || 'text-embedding-3-small'
    },
    auth: {
      enabled: parseBoolean(process.env.AUTH_ENABLED, false),
      apiKey: process.env.OWNREX_API_KEY || 'ownrex-default-key'
    },
    rateLimit: {
      windowMs: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
      maxRequests: parseNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 100)
    },
    cache: {
      enabled: parseBoolean(process.env.CACHE_ENABLED, true),
      ttl: parseNumber(process.env.CACHE_TTL, 3600),
      type: (process.env.CACHE_TYPE as 'memory' | 'redis') || 'memory'
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      fileEnabled: parseBoolean(process.env.LOG_FILE_ENABLED, true),
      filePath: process.env.LOG_FILE_PATH || './logs/ownrex.log'
    },
    cors: {
      origin: process.env.CORS_ORIGIN || '*'
    },
    telemetry: {
      enabled: parseBoolean(process.env.TELEMETRY_ENABLED, false)
    }
  };

  validateConfig(config);
  return config;
}

// Singleton config instance
let configInstance: Config | null = null;

export function getConfig(): Config {
  if (!configInstance) {
    configInstance = loadConfig();
  }
  return configInstance;
}

export function resetConfig(): void {
  configInstance = null;
}

// Export default config
export const config = getConfig();

export default config;

