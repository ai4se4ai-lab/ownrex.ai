/**
 * Constants for Ownrex.ai Backend
 */

export const APP_NAME = 'Ownrex.ai Backend';
export const APP_VERSION = '1.0.0';

// API Versioning
export const API_VERSION = 'v1';
export const API_PREFIX = '/v1';

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

// Error Types
export const ERROR_TYPES = {
  INVALID_REQUEST: 'invalid_request_error',
  AUTHENTICATION_ERROR: 'authentication_error',
  PERMISSION_ERROR: 'permission_error',
  NOT_FOUND_ERROR: 'not_found_error',
  RATE_LIMIT_ERROR: 'rate_limit_error',
  API_ERROR: 'api_error',
  SERVER_ERROR: 'server_error',
  SERVICE_UNAVAILABLE: 'service_unavailable_error'
} as const;

// Default Values
export const DEFAULTS = {
  TEMPERATURE: 0.7,
  TOP_P: 1,
  MAX_TOKENS: 4096,
  FREQUENCY_PENALTY: 0,
  PRESENCE_PENALTY: 0,
  N: 1
} as const;

// Rate Limiting
export const RATE_LIMIT = {
  DEFAULT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  DEFAULT_MAX_REQUESTS: 100,
  CHAT_MAX_REQUESTS: 60,
  COMPLETIONS_MAX_REQUESTS: 60,
  EMBEDDINGS_MAX_REQUESTS: 200
} as const;

// Cache Keys
export const CACHE_KEYS = {
  MODELS: 'models:list',
  EMBEDDINGS_PREFIX: 'embeddings:',
  CHAT_PREFIX: 'chat:'
} as const;

// Request Limits
export const REQUEST_LIMITS = {
  MAX_MESSAGES: 100,
  MAX_PROMPT_LENGTH: 100000,
  MAX_INPUT_TOKENS: 128000,
  MAX_EMBEDDING_INPUTS: 2048
} as const;

// Timeouts (in milliseconds)
export const TIMEOUTS = {
  OPENAI_REQUEST: 120000, // 2 minutes
  STREAM_TIMEOUT: 300000, // 5 minutes
  HEALTH_CHECK: 5000
} as const;

// Headers
export const HEADERS = {
  REQUEST_ID: 'x-request-id',
  API_KEY: 'x-api-key',
  CONTENT_TYPE: 'content-type',
  AUTHORIZATION: 'authorization'
} as const;

// Supported Models
export const SUPPORTED_CHAT_MODELS = [
  'gpt-4',
  'gpt-4-turbo',
  'gpt-4-turbo-preview',
  'gpt-4-0125-preview',
  'gpt-4-1106-preview',
  'gpt-4-vision-preview',
  'gpt-4-32k',
  'gpt-3.5-turbo',
  'gpt-3.5-turbo-16k'
] as const;

export const SUPPORTED_COMPLETION_MODELS = [
  'gpt-3.5-turbo-instruct'
] as const;

export const SUPPORTED_EMBEDDING_MODELS = [
  'text-embedding-3-small',
  'text-embedding-3-large',
  'text-embedding-ada-002'
] as const;

