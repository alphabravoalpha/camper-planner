import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DataService, type DataServiceConfig, type RateLimitConfig, type RequestContext } from '../DataService';

// Mock fetch globally
global.fetch = vi.fn();

// Concrete implementation for testing
class TestDataService extends DataService {
  constructor(config: DataServiceConfig, rateLimit: RateLimitConfig) {
    super(config, rateLimit);
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  // Expose protected methods for testing
  public async testRequest<T>(context: RequestContext): Promise<T> {
    return this.request<T>(context);
  }

  public testGenerateCacheKey(context: RequestContext): string {
    return this.generateCacheKey(context);
  }

  public testGetFromCache<T>(key: string): T | null {
    return this.getFromCache<T>(key);
  }

  public testSetCache<T>(key: string, data: T, ttl?: number): void {
    return this.setCache(key, data, ttl);
  }
}

describe('DataService', () => {
  let service: TestDataService;
  let config: DataServiceConfig;
  let rateLimit: RateLimitConfig;

  beforeEach(() => {
    // Reset fetch mock
    vi.clearAllMocks();

    config = {
      baseUrl: 'https://api.example.com',
      timeout: 5000,
      retries: 2,
      cacheEnabled: true,
      cacheTtl: 60000, // 1 minute
      userAgent: 'TestAgent/1.0',
      apiKey: 'test-api-key',
    };

    rateLimit = {
      requests: 10,
      windowMs: 60000, // 1 minute
      enabled: true,
    };

    service = new TestDataService(config, rateLimit);
  });

  afterEach(() => {
    service.clearCache();
  });

  describe('Constructor', () => {
    it('should initialize with config and rate limit', () => {
      expect(service).toBeInstanceOf(DataService);

      const info = service.getServiceInfo();
      expect(info.name).toBe('TestDataService');
      expect(info.baseUrl).toBe('https://api.example.com');
      expect(info.cacheSize).toBe(0);
    });
  });

  describe('HTTP Requests', () => {
    it('should make GET request successfully', async () => {
      const mockData = { id: 1, name: 'Test' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      });

      const context: RequestContext = {
        method: 'GET',
        endpoint: '/test',
      };

      const result = await service.testRequest(context);
      expect(result).toEqual(mockData);
    });

    it('should make GET request with query params', async () => {
      const mockData = { results: [] };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      });

      const context: RequestContext = {
        method: 'GET',
        endpoint: '/search',
        params: { q: 'test query', limit: 10 },
      };

      await service.testRequest(context);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/search?q=test+query&limit=10',
        expect.any(Object)
      );
    });

    it('should make POST request with JSON body', async () => {
      const mockResponse = { success: true };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      });

      const context: RequestContext = {
        method: 'POST',
        endpoint: '/create',
        body: { name: 'Test', value: 123 },
      };

      const result = await service.testRequest(context);
      expect(result).toEqual(mockResponse);

      const fetchCall = (global.fetch as any).mock.calls[0];
      expect(fetchCall[1].method).toBe('POST');
      expect(fetchCall[1].body).toBe(JSON.stringify({ name: 'Test', value: 123 }));
    });

    it('should include API key in Authorization header', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      });

      const context: RequestContext = {
        method: 'GET',
        endpoint: '/secure',
      };

      await service.testRequest(context);

      const fetchCall = (global.fetch as any).mock.calls[0];
      expect(fetchCall[1].headers['Authorization']).toBe('Bearer test-api-key');
    });

    it('should include User-Agent header', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      });

      const context: RequestContext = {
        method: 'GET',
        endpoint: '/test',
      };

      await service.testRequest(context);

      const fetchCall = (global.fetch as any).mock.calls[0];
      expect(fetchCall[1].headers['User-Agent']).toBe('TestAgent/1.0');
    });

    it('should handle text responses', async () => {
      const mockText = 'Plain text response';
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => mockText,
      });

      const context: RequestContext = {
        method: 'GET',
        endpoint: '/text',
      };

      const result = await service.testRequest(context);
      expect(result).toBe(mockText);
    });

    it('should throw error on HTTP error status', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const context: RequestContext = {
        method: 'GET',
        endpoint: '/notfound',
      };

      await expect(service.testRequest(context)).rejects.toThrow('HTTP 404: Not Found');
    });

    it('should use custom timeout', async () => {
      const context: RequestContext = {
        method: 'GET',
        endpoint: '/test',
        customTimeout: 1000,
      };

      (global.fetch as any).mockImplementationOnce((url: string, options: any) => {
        // Verify timeout signal is set
        expect(options.signal).toBeDefined();
        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({}),
        });
      });

      await service.testRequest(context);
    });
  });

  describe('Retry Logic', () => {
    it('should retry on network error', async () => {
      let attempts = 0;
      (global.fetch as any).mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ success: true }),
        });
      });

      const context: RequestContext = {
        method: 'GET',
        endpoint: '/retry',
      };

      const result = await service.testRequest(context);
      expect(result).toEqual({ success: true });
      expect(attempts).toBe(3); // Initial + 2 retries
    }, 10000); // Increase timeout for retry delays

    it('should not retry on 4xx errors', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      const context: RequestContext = {
        method: 'GET',
        endpoint: '/bad',
      };

      await expect(service.testRequest(context)).rejects.toThrow('HTTP 400');
      expect(global.fetch).toHaveBeenCalledTimes(1); // No retries
    });

    it('should throw timeout error', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';

      (global.fetch as any).mockRejectedValue(abortError);

      const context: RequestContext = {
        method: 'GET',
        endpoint: '/timeout',
      };

      await expect(service.testRequest(context)).rejects.toThrow('Request timeout after');
    });
  });

  describe('Caching', () => {
    it('should cache successful GET requests', async () => {
      const mockData = { id: 1 };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      });

      const context: RequestContext = {
        method: 'GET',
        endpoint: '/cached',
      };

      // First request - should hit API
      await service.testRequest(context);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second request - should use cache
      await service.testRequest(context);
      expect(global.fetch).toHaveBeenCalledTimes(1); // Still 1
    });

    it('should skip cache when requested', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ id: 1 }),
      });

      const context: RequestContext = {
        method: 'GET',
        endpoint: '/nocache',
        skipCache: true,
      };

      await service.testRequest(context);
      await service.testRequest(context);

      expect(global.fetch).toHaveBeenCalledTimes(2); // Both hit API
    });

    it('should generate different cache keys for different params', () => {
      const context1: RequestContext = {
        method: 'GET',
        endpoint: '/test',
        params: { id: 1 },
      };

      const context2: RequestContext = {
        method: 'GET',
        endpoint: '/test',
        params: { id: 2 },
      };

      const key1 = service.testGenerateCacheKey(context1);
      const key2 = service.testGenerateCacheKey(context2);

      expect(key1).not.toBe(key2);
    });

    it('should expire cached data after TTL', async () => {
      const mockData = { id: 1 };
      const cacheKey = 'test-key';

      service.testSetCache(cacheKey, mockData, 100); // 100ms TTL

      // Immediate get should work
      expect(service.testGetFromCache(cacheKey)).toEqual(mockData);

      // After TTL, should return null
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(service.testGetFromCache(cacheKey)).toBeNull();
    });

    it('should clear all cache', async () => {
      service.testSetCache('key1', { data: 1 });
      service.testSetCache('key2', { data: 2 });

      expect(service.getCacheStats().size).toBe(2);

      service.clearCache();

      expect(service.getCacheStats().size).toBe(0);
    });

    it('should provide cache statistics', () => {
      service.testSetCache('key1', { test: 'data' });

      const stats = service.getCacheStats();

      expect(stats.size).toBe(1);
      expect(stats.entries).toHaveLength(1);
      expect(stats.entries[0].key).toBe('key1');
      expect(stats.entries[0].size).toBeGreaterThan(0);
      expect(stats.entries[0].age).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      });

      const context: RequestContext = {
        method: 'GET',
        endpoint: '/test',
        skipCache: true, // Disable cache to test rate limiting
      };

      // Make 5 requests (within limit of 10)
      for (let i = 0; i < 5; i++) {
        await service.testRequest(context);
      }

      expect(global.fetch).toHaveBeenCalledTimes(5);
    });

    it('should throw error when rate limit exceeded', async () => {
      const smallRateLimit = {
        requests: 2,
        windowMs: 60000,
        enabled: true,
      };

      const limitedService = new TestDataService(config, smallRateLimit);

      (global.fetch as any).mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      });

      const context: RequestContext = {
        method: 'GET',
        endpoint: '/test',
        skipCache: true,
      };

      // Make requests up to limit
      await limitedService.testRequest(context);
      await limitedService.testRequest(context);

      // Third request should fail
      await expect(limitedService.testRequest(context)).rejects.toThrow('Rate limit exceeded');
    });

    it('should not enforce rate limit when disabled', async () => {
      const noRateLimit = {
        requests: 1,
        windowMs: 60000,
        enabled: false,
      };

      const unlimitedService = new TestDataService(config, noRateLimit);

      (global.fetch as any).mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      });

      const context: RequestContext = {
        method: 'GET',
        endpoint: '/test',
        skipCache: true,
      };

      // Make multiple requests (should all succeed)
      await unlimitedService.testRequest(context);
      await unlimitedService.testRequest(context);
      await unlimitedService.testRequest(context);

      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Service Info', () => {
    it('should return service information', () => {
      const info = service.getServiceInfo();

      expect(info.name).toBe('TestDataService');
      expect(info.baseUrl).toBe('https://api.example.com');
      expect(info.cacheSize).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Health Check', () => {
    it('should implement health check', async () => {
      const result = await service.healthCheck();
      expect(result).toBe(true);
    });
  });
});
