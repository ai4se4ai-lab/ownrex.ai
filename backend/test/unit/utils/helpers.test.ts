/**
 * Unit tests for helper utilities
 */

import {
  generateRequestId,
  generateCompletionId,
  generateEmbeddingId,
  getCurrentTimestamp,
  createCacheKey,
  truncate,
  isNonEmptyString,
  isValidArray,
  extractBearerToken,
  formatBytes,
  sanitizeForLogging,
  safeJsonParse,
  isValidModelName,
  formatSSE,
  formatSSEDone
} from '../../../src/utils/helpers';

describe('helpers', () => {
  describe('generateRequestId', () => {
    it('should generate unique request IDs', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^req_[a-f0-9]+$/);
    });
  });

  describe('generateCompletionId', () => {
    it('should generate unique completion IDs', () => {
      const id1 = generateCompletionId();
      const id2 = generateCompletionId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^chatcmpl-[a-f0-9]+$/);
    });
  });

  describe('generateEmbeddingId', () => {
    it('should generate unique embedding IDs', () => {
      const id1 = generateEmbeddingId();
      const id2 = generateEmbeddingId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^emb_[a-f0-9]+$/);
    });
  });

  describe('getCurrentTimestamp', () => {
    it('should return current Unix timestamp in seconds', () => {
      const timestamp = getCurrentTimestamp();
      const expected = Math.floor(Date.now() / 1000);
      
      expect(timestamp).toBe(expected);
    });
  });

  describe('createCacheKey', () => {
    it('should create consistent cache keys for same input', () => {
      const obj = { model: 'gpt-4', temperature: 0.7 };
      const key1 = createCacheKey(obj);
      const key2 = createCacheKey(obj);
      
      expect(key1).toBe(key2);
    });

    it('should create different keys for different inputs', () => {
      const key1 = createCacheKey({ model: 'gpt-4' });
      const key2 = createCacheKey({ model: 'gpt-3.5-turbo' });
      
      expect(key1).not.toBe(key2);
    });

    it('should create same key regardless of property order', () => {
      const key1 = createCacheKey({ a: 1, b: 2 });
      const key2 = createCacheKey({ b: 2, a: 1 });
      
      expect(key1).toBe(key2);
    });
  });

  describe('truncate', () => {
    it('should not truncate short strings', () => {
      const result = truncate('hello', 10);
      expect(result).toBe('hello');
    });

    it('should truncate long strings with ellipsis', () => {
      const result = truncate('hello world', 8);
      expect(result).toBe('hello...');
    });

    it('should handle edge cases', () => {
      expect(truncate('', 5)).toBe('');
      expect(truncate('abc', 3)).toBe('abc');
    });
  });

  describe('isNonEmptyString', () => {
    it('should return true for non-empty strings', () => {
      expect(isNonEmptyString('hello')).toBe(true);
      expect(isNonEmptyString('  hello  ')).toBe(true);
    });

    it('should return false for empty or whitespace strings', () => {
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString('   ')).toBe(false);
    });

    it('should return false for non-strings', () => {
      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(undefined)).toBe(false);
      expect(isNonEmptyString(123)).toBe(false);
    });
  });

  describe('isValidArray', () => {
    it('should return true for non-empty arrays', () => {
      expect(isValidArray([1, 2, 3])).toBe(true);
      expect(isValidArray(['a'])).toBe(true);
    });

    it('should return false for empty arrays', () => {
      expect(isValidArray([])).toBe(false);
    });

    it('should return false for non-arrays', () => {
      expect(isValidArray(null)).toBe(false);
      expect(isValidArray(undefined)).toBe(false);
      expect(isValidArray('string')).toBe(false);
    });
  });

  describe('extractBearerToken', () => {
    it('should extract bearer token from valid header', () => {
      expect(extractBearerToken('Bearer abc123')).toBe('abc123');
      expect(extractBearerToken('bearer token123')).toBe('token123');
    });

    it('should return null for invalid headers', () => {
      expect(extractBearerToken(undefined)).toBeNull();
      expect(extractBearerToken('')).toBeNull();
      expect(extractBearerToken('Basic abc123')).toBeNull();
      expect(extractBearerToken('Bearer')).toBeNull();
      expect(extractBearerToken('Bearer a b c')).toBeNull();
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1536)).toBe('1.5 KB');
    });
  });

  describe('sanitizeForLogging', () => {
    it('should truncate long strings', () => {
      const longString = 'a'.repeat(1000);
      const result = sanitizeForLogging(longString, 100);
      expect(result.length).toBeLessThanOrEqual(100);
    });

    it('should remove newlines', () => {
      const result = sanitizeForLogging('hello\nworld\r\n');
      expect(result).not.toContain('\n');
      expect(result).not.toContain('\r');
    });

    it('should stringify objects', () => {
      const result = sanitizeForLogging({ key: 'value' });
      expect(result).toBe('{"key":"value"}');
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const result = safeJsonParse('{"key":"value"}', {});
      expect(result).toEqual({ key: 'value' });
    });

    it('should return default for invalid JSON', () => {
      const result = safeJsonParse('invalid', { default: true });
      expect(result).toEqual({ default: true });
    });
  });

  describe('isValidModelName', () => {
    it('should accept valid model names', () => {
      expect(isValidModelName('gpt-4')).toBe(true);
      expect(isValidModelName('gpt-3.5-turbo')).toBe(true);
      expect(isValidModelName('text-embedding-3-small')).toBe(true);
    });

    it('should reject invalid model names', () => {
      expect(isValidModelName('')).toBe(false);
      expect(isValidModelName('model with spaces')).toBe(false);
      expect(isValidModelName('model@special')).toBe(false);
    });
  });

  describe('formatSSE', () => {
    it('should format SSE data correctly', () => {
      const result = formatSSE({ message: 'hello' });
      expect(result).toBe('data: {"message":"hello"}\n\n');
    });
  });

  describe('formatSSEDone', () => {
    it('should return SSE done message', () => {
      expect(formatSSEDone()).toBe('data: [DONE]\n\n');
    });
  });
});

