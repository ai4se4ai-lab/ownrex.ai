/**
 * Custom Error Classes for Ownrex.ai Backend
 */

import { HTTP_STATUS, ERROR_TYPES } from '../config/constants';

export interface ErrorDetails {
  message: string;
  type: string;
  param?: string;
  code?: string;
  statusCode: number;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly type: string;
  public readonly param?: string;
  public readonly code?: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    type: string = ERROR_TYPES.SERVER_ERROR,
    param?: string,
    code?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.param = param;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): ErrorDetails {
    return {
      message: this.message,
      type: this.type,
      param: this.param,
      code: this.code,
      statusCode: this.statusCode
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, param?: string) {
    super(message, HTTP_STATUS.BAD_REQUEST, ERROR_TYPES.INVALID_REQUEST, param, 'validation_error');
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Invalid authentication credentials') {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_TYPES.AUTHENTICATION_ERROR, undefined, 'invalid_api_key');
  }
}

export class PermissionError extends AppError {
  constructor(message: string = 'Permission denied') {
    super(message, HTTP_STATUS.FORBIDDEN, ERROR_TYPES.PERMISSION_ERROR, undefined, 'permission_denied');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, HTTP_STATUS.NOT_FOUND, ERROR_TYPES.NOT_FOUND_ERROR, undefined, 'not_found');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, HTTP_STATUS.TOO_MANY_REQUESTS, ERROR_TYPES.RATE_LIMIT_ERROR, undefined, 'rate_limit_exceeded');
  }
}

export class OpenAIError extends AppError {
  public readonly originalError?: Error;

  constructor(message: string, statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR, originalError?: Error) {
    super(message, statusCode, ERROR_TYPES.API_ERROR, undefined, 'openai_error');
    this.originalError = originalError;
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable') {
    super(message, HTTP_STATUS.SERVICE_UNAVAILABLE, ERROR_TYPES.SERVICE_UNAVAILABLE, undefined, 'service_unavailable');
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function createErrorFromOpenAI(error: any): OpenAIError {
  const message = error?.message || 'OpenAI API error';
  const statusCode = error?.status || error?.response?.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  return new OpenAIError(message, statusCode, error);
}

