/**
 * Cache Service - In-memory caching with TTL support
 */

import { getConfig } from '../config';
import { getLogger } from '../utils/logger';
import { createCacheKey } from '../utils/helpers';
import { CACHE_KEYS } from '../config/constants';

const logger = getLogger();

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

export class CacheService {
  private cache: Map<string, CacheEntry<unknown>>;
  private defaultTTL: number;
  private enabled: boolean;
  private static instance: CacheService | null = null;

  constructor() {
    const config = getConfig();
    this.cache = new Map();
    this.defaultTTL = config.cache.ttl * 1000; // Convert to milliseconds
    this.enabled = config.cache.enabled;

    // Start cleanup interval
    if (this.enabled) {
      setInterval(() => this.cleanup(), 60000); // Cleanup every minute
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Reset singleton instance (for testing)
   */
  public static resetInstance(): void {
    if (CacheService.instance) {
      CacheService.instance.clear();
    }
    CacheService.instance = null;
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    if (!this.enabled) return null;

    const entry = this.cache.get(key);
    if (!entry) {
      logger.debug(`Cache miss: ${key}`);
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      logger.debug(`Cache expired: ${key}`);
      this.cache.delete(key);
      return null;
    }

    logger.debug(`Cache hit: ${key}`);
    return entry.value as T;
  }

  /**
   * Set a value in cache
   */
  set<T>(key: string, value: T, ttlMs?: number): void {
    if (!this.enabled) return;

    const ttl = ttlMs || this.defaultTTL;
    const now = Date.now();

    this.cache.set(key, {
      value,
      createdAt: now,
      expiresAt: now + ttl
    });

    logger.debug(`Cache set: ${key}, TTL: ${ttl}ms`);
  }

  /**
   * Delete a value from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.debug(`Cache deleted: ${key}`);
    }
    return deleted;
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    if (!this.enabled) return false;
    
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    logger.debug('Cache cleared');
  }

  /**
   * Clear entries matching a prefix
   */
  clearPrefix(prefix: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }
    logger.debug(`Cache cleared ${count} entries with prefix: ${prefix}`);
    return count;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    enabled: boolean;
    defaultTTL: number;
  } {
    return {
      size: this.cache.size,
      enabled: this.enabled,
      defaultTTL: this.defaultTTL
    };
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`Cache cleanup: removed ${cleaned} expired entries`);
    }
  }

  /**
   * Create cache key for chat request
   */
  createChatCacheKey(request: object): string {
    return `${CACHE_KEYS.CHAT_PREFIX}${createCacheKey(request)}`;
  }

  /**
   * Create cache key for embedding request
   */
  createEmbeddingCacheKey(request: object): string {
    return `${CACHE_KEYS.EMBEDDINGS_PREFIX}${createCacheKey(request)}`;
  }

  /**
   * Get or set pattern - fetch from cache or compute and store
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMs?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    this.set(key, value, ttlMs);
    return value;
  }
}

// Export singleton
export const cacheService = CacheService.getInstance();

export default cacheService;

