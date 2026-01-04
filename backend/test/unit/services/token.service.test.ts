/**
 * Unit tests for Token Service
 */

import { TokenService } from '../../../src/services/token.service';
import { resetConfig } from '../../../src/config';

describe('TokenService', () => {
  let tokenService: TokenService;

  beforeEach(() => {
    resetConfig();
    TokenService.resetInstance();
    process.env.AUTH_ENABLED = 'true';
    process.env.OWNREX_API_KEY = 'test-api-key';
    tokenService = TokenService.getInstance();
  });

  afterEach(() => {
    resetConfig();
    TokenService.resetInstance();
  });

  describe('validateApiKey', () => {
    it('should validate configured API key', () => {
      const result = tokenService.validateApiKey('test-api-key');
      
      expect(result.valid).toBe(true);
      expect(result.tokenInfo?.token).toBe('test-api-key');
    });

    it('should reject invalid API keys', () => {
      const result = tokenService.validateApiKey('wrong-key');
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid API key');
    });

    it('should allow all keys when auth is disabled', () => {
      process.env.AUTH_ENABLED = 'false';
      resetConfig();
      TokenService.resetInstance();
      tokenService = TokenService.getInstance();
      
      const result = tokenService.validateApiKey('any-key');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateAuthHeader', () => {
    it('should validate Bearer token', () => {
      const result = tokenService.validateAuthHeader('Bearer test-api-key');
      
      expect(result.valid).toBe(true);
    });

    it('should reject missing header when auth is enabled', () => {
      const result = tokenService.validateAuthHeader(undefined);
      
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('required');
    });

    it('should reject invalid format', () => {
      const result = tokenService.validateAuthHeader('Basic abc123');
      
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Invalid');
    });
  });

  describe('registerToken', () => {
    it('should register new tokens', () => {
      const tokenInfo = tokenService.registerToken('new-token');
      
      expect(tokenInfo.isValid).toBe(true);
      expect(tokenService.validateApiKey('new-token').valid).toBe(true);
    });

    it('should register tokens with expiration', () => {
      const tokenInfo = tokenService.registerToken('expiring-token', 3600000);
      
      expect(tokenInfo.expiresAt).toBeDefined();
    });
  });

  describe('revokeToken', () => {
    it('should revoke registered tokens', () => {
      tokenService.registerToken('to-revoke');
      const revoked = tokenService.revokeToken('to-revoke');
      
      expect(revoked).toBe(true);
      expect(tokenService.validateApiKey('to-revoke').valid).toBe(false);
    });

    it('should return false for non-existent tokens', () => {
      const revoked = tokenService.revokeToken('nonexistent');
      expect(revoked).toBe(false);
    });
  });

  describe('generateApiKey', () => {
    it('should generate unique API keys', () => {
      const key1 = tokenService.generateApiKey();
      const key2 = tokenService.generateApiKey();
      
      expect(key1).not.toBe(key2);
      expect(key1).toMatch(/^ownrex_/);
    });
  });

  describe('createApiKey', () => {
    it('should create and register new API key', () => {
      const tokenInfo = tokenService.createApiKey();
      
      expect(tokenInfo.isValid).toBe(true);
      expect(tokenService.validateApiKey(tokenInfo.token).valid).toBe(true);
    });
  });

  describe('getValidTokens', () => {
    it('should return list of valid tokens', () => {
      tokenService.registerToken('token1');
      tokenService.registerToken('token2');
      
      const tokens = tokenService.getValidTokens();
      
      expect(tokens.length).toBeGreaterThanOrEqual(2);
      expect(tokens.every(t => t.isValid)).toBe(true);
    });
  });

  describe('clearTokens', () => {
    it('should clear all tokens and reinitialize default', () => {
      tokenService.registerToken('token1');
      tokenService.registerToken('token2');
      tokenService.clearTokens();
      
      // Default token should still work
      expect(tokenService.validateApiKey('test-api-key').valid).toBe(true);
      // Registered tokens should not
      expect(tokenService.validateApiKey('token1').valid).toBe(false);
    });
  });
});

