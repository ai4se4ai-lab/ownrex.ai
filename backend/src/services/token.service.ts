/**
 * Token Service - API key validation and token management
 */

import { getConfig } from '../config';
import { getLogger } from '../utils/logger';
// import { AuthenticationError } from '../utils/errors';
import { extractBearerToken, generateRequestId } from '../utils/helpers';

const logger = getLogger();

export interface TokenInfo {
  token: string;
  isValid: boolean;
  type: 'api_key' | 'bearer';
  expiresAt?: number;
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  tokenInfo?: TokenInfo;
}

export class TokenService {
  private static instance: TokenService | null = null;
  private validTokens: Map<string, TokenInfo>;

  constructor() {
    this.validTokens = new Map();
    this.initializeDefaultToken();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  /**
   * Reset singleton instance (for testing)
   */
  public static resetInstance(): void {
    TokenService.instance = null;
  }

  /**
   * Initialize default API key from config
   */
  private initializeDefaultToken(): void {
    const config = getConfig();
    if (config.auth.apiKey) {
      this.validTokens.set(config.auth.apiKey, {
        token: config.auth.apiKey,
        isValid: true,
        type: 'api_key'
      });
    }
  }

  /**
   * Validate an API key
   */
  validateApiKey(apiKey: string): ValidationResult {
    const config = getConfig();

    // If auth is disabled, all keys are valid
    if (!config.auth.enabled) {
      return {
        valid: true,
        tokenInfo: {
          token: apiKey,
          isValid: true,
          type: 'api_key'
        }
      };
    }

    // Check if key is in valid tokens
    const tokenInfo = this.validTokens.get(apiKey);
    if (tokenInfo && tokenInfo.isValid) {
      // Check expiration if set
      if (tokenInfo.expiresAt && Date.now() > tokenInfo.expiresAt) {
        return {
          valid: false,
          reason: 'Token has expired'
        };
      }

      return {
        valid: true,
        tokenInfo
      };
    }

    // Check against configured API key
    if (apiKey === config.auth.apiKey) {
      return {
        valid: true,
        tokenInfo: {
          token: apiKey,
          isValid: true,
          type: 'api_key'
        }
      };
    }

    return {
      valid: false,
      reason: 'Invalid API key'
    };
  }

  /**
   * Validate authorization header
   */
  validateAuthHeader(authHeader: string | undefined): ValidationResult {
    const config = getConfig();

    // If auth is disabled, skip validation
    if (!config.auth.enabled) {
      return { valid: true };
    }

    if (!authHeader) {
      return {
        valid: false,
        reason: 'Authorization header is required'
      };
    }

    // Extract bearer token
    const token = extractBearerToken(authHeader);
    if (!token) {
      return {
        valid: false,
        reason: 'Invalid authorization header format. Expected: Bearer <token>'
      };
    }

    return this.validateApiKey(token);
  }

  /**
   * Register a new valid token
   */
  registerToken(token: string, expiresInMs?: number): TokenInfo {
    const tokenInfo: TokenInfo = {
      token,
      isValid: true,
      type: 'api_key',
      expiresAt: expiresInMs ? Date.now() + expiresInMs : undefined
    };

    this.validTokens.set(token, tokenInfo);
    logger.info('New token registered');

    return tokenInfo;
  }

  /**
   * Revoke a token
   */
  revokeToken(token: string): boolean {
    const tokenInfo = this.validTokens.get(token);
    if (tokenInfo) {
      tokenInfo.isValid = false;
      this.validTokens.set(token, tokenInfo);
      logger.info('Token revoked');
      return true;
    }
    return false;
  }

  /**
   * Generate a new API key
   */
  generateApiKey(): string {
    const prefix = 'ownrex_';
    const key = generateRequestId().replace('req_', '');
    return `${prefix}${key}`;
  }

  /**
   * Create a new API key and register it
   */
  createApiKey(expiresInMs?: number): TokenInfo {
    const apiKey = this.generateApiKey();
    return this.registerToken(apiKey, expiresInMs);
  }

  /**
   * Get all valid tokens (for admin purposes)
   */
  getValidTokens(): TokenInfo[] {
    return Array.from(this.validTokens.values()).filter(t => t.isValid);
  }

  /**
   * Clear all tokens
   */
  clearTokens(): void {
    this.validTokens.clear();
    this.initializeDefaultToken();
  }
}

// Export singleton
export const tokenService = TokenService.getInstance();

export default tokenService;

