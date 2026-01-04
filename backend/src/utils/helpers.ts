/**
 * Helper utilities for Ownrex.ai Backend
 */

import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req_${uuidv4().replace(/-/g, '')}`;
}

/**
 * Generate a unique completion ID
 */
export function generateCompletionId(): string {
  return `chatcmpl-${uuidv4().replace(/-/g, '')}`;
}

/**
 * Generate a unique embedding ID
 */
export function generateEmbeddingId(): string {
  return `emb_${uuidv4().replace(/-/g, '')}`;
}

/**
 * Get current Unix timestamp in seconds
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Create a hash for cache key
 */
export function createCacheKey(data: object): string {
  const jsonString = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash('sha256').update(jsonString).digest('hex');
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Truncate string to max length
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Check if value is a valid array
 */
export function isValidArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Extract bearer token from authorization header
 */
export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return null;
  return parts[1];
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Calculate elapsed time in milliseconds
 */
export function getElapsedTime(startTime: [number, number]): number {
  const diff = process.hrtime(startTime);
  return diff[0] * 1000 + diff[1] / 1000000;
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
}

/**
 * Sanitize user input for logging
 */
export function sanitizeForLogging(input: unknown, maxLength: number = 500): string {
  if (typeof input === 'string') {
    return truncate(input.replace(/[\n\r]/g, ' '), maxLength);
  }
  if (typeof input === 'object') {
    return truncate(JSON.stringify(input), maxLength);
  }
  return String(input);
}

/**
 * Parse JSON safely
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Validate model name
 */
export function isValidModelName(model: string): boolean {
  return /^[a-zA-Z0-9-_.]+$/.test(model);
}

/**
 * Format SSE (Server-Sent Events) data
 */
export function formatSSE(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

/**
 * Create SSE done message
 */
export function formatSSEDone(): string {
  return 'data: [DONE]\n\n';
}

