/**
 * Unit tests for Cache Service
 */

import { CacheService } from '../../../src/services/cache.service';
import { resetConfig } from '../../../src/config';

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    // Reset config and singleton to ensure fresh state
    process.env.CACHE_ENABLED = 'true';
    resetConfig();
    CacheService.resetInstance();
    cacheService = CacheService.getInstance();
  });

  afterEach(() => {
    resetConfig();
    CacheService.resetInstance();
  });

  describe('get/set', () => {
    it('should store and retrieve values', () => {
      cacheService.set('key1', { value: 'test' });
      const result = cacheService.get('key1');
      
      expect(result).toEqual({ value: 'test' });
    });

    it('should return null for non-existent keys', () => {
      const result = cacheService.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should return null for expired entries', async () => {
      cacheService.set('expiring', 'value', 10); // 10ms TTL
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const result = cacheService.get('expiring');
      expect(result).toBeNull();
    });
  });

  describe('has', () => {
    it('should return true for existing keys', () => {
      cacheService.set('exists', 'value');
      expect(cacheService.has('exists')).toBe(true);
    });

    it('should return false for non-existent keys', () => {
      expect(cacheService.has('missing')).toBe(false);
    });

    it('should return false for expired keys', async () => {
      cacheService.set('expiring', 'value', 10);
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(cacheService.has('expiring')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should remove existing entries', () => {
      cacheService.set('toDelete', 'value');
      const deleted = cacheService.delete('toDelete');
      
      expect(deleted).toBe(true);
      expect(cacheService.get('toDelete')).toBeNull();
    });

    it('should return false for non-existent entries', () => {
      const deleted = cacheService.delete('nonexistent');
      expect(deleted).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      cacheService.clear();
      
      expect(cacheService.get('key1')).toBeNull();
      expect(cacheService.get('key2')).toBeNull();
    });
  });

  describe('clearPrefix', () => {
    it('should remove entries matching prefix', () => {
      cacheService.set('chat:1', 'value1');
      cacheService.set('chat:2', 'value2');
      cacheService.set('embed:1', 'value3');
      
      const count = cacheService.clearPrefix('chat:');
      
      expect(count).toBe(2);
      expect(cacheService.get('chat:1')).toBeNull();
      expect(cacheService.get('chat:2')).toBeNull();
      expect(cacheService.get('embed:1')).toEqual('value3');
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      
      const stats = cacheService.getStats();
      
      expect(stats.size).toBe(2);
      expect(stats.enabled).toBe(true);
      expect(typeof stats.defaultTTL).toBe('number');
    });
  });

  describe('createChatCacheKey', () => {
    it('should create consistent keys for chat requests', () => {
      const request = { model: 'gpt-4', messages: [{ role: 'user', content: 'hi' }] };
      const key1 = cacheService.createChatCacheKey(request);
      const key2 = cacheService.createChatCacheKey(request);
      
      expect(key1).toBe(key2);
      expect(key1).toMatch(/^chat:/);
    });
  });

  describe('createEmbeddingCacheKey', () => {
    it('should create consistent keys for embedding requests', () => {
      const request = { model: 'text-embedding-3-small', input: 'hello' };
      const key1 = cacheService.createEmbeddingCacheKey(request);
      const key2 = cacheService.createEmbeddingCacheKey(request);
      
      expect(key1).toBe(key2);
      expect(key1).toMatch(/^embeddings:/);
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      cacheService.set('cached', 'existing');
      
      const fetchFn = jest.fn().mockResolvedValue('new');
      const result = await cacheService.getOrSet('cached', fetchFn);
      
      expect(result).toBe('existing');
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('should fetch and cache if not exists', async () => {
      const fetchFn = jest.fn().mockResolvedValue('fetched');
      const result = await cacheService.getOrSet('new', fetchFn);
      
      expect(result).toBe('fetched');
      expect(fetchFn).toHaveBeenCalled();
      expect(cacheService.get('new')).toBe('fetched');
    });
  });
});

