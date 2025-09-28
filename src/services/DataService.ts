// Abstract Data Service Base Class
// Phase 3.2: Service layer architecture with caching and error handling

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface DataServiceConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  cacheEnabled: boolean;
  cacheTtl: number;
  userAgent?: string;
  apiKey?: string;
}

export interface RateLimitConfig {
  requests: number;
  windowMs: number;
  enabled: boolean;
}

export interface RequestContext {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  body?: any;
  skipCache?: boolean;
  customTimeout?: number;
}

export abstract class DataService {
  protected config: DataServiceConfig;
  protected cache: Map<string, CacheEntry<any>>;
  protected rateLimitState: Map<string, { count: number; resetTime: number }>;
  protected rateLimit: RateLimitConfig;

  constructor(config: DataServiceConfig, rateLimit: RateLimitConfig) {
    this.config = config;
    this.cache = new Map();
    this.rateLimitState = new Map();
    this.rateLimit = rateLimit;

    // Clean up expired cache entries periodically
    this.startCacheCleanup();
  }

  /**
   * Make an HTTP request with caching, rate limiting, and error handling
   */
  protected async request<T>(context: RequestContext): Promise<T> {
    // Check rate limiting
    if (this.rateLimit.enabled) {
      await this.checkRateLimit();
    }

    // Generate cache key
    const cacheKey = this.generateCacheKey(context);

    // Check cache first (unless explicitly skipped)
    if (this.config.cacheEnabled && !context.skipCache) {
      const cachedData = this.getFromCache<T>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    // Make the actual HTTP request
    const result = await this.makeHttpRequest<T>(context);

    // Cache the result
    if (this.config.cacheEnabled && !context.skipCache) {
      this.setCache(cacheKey, result);
    }

    return result;
  }

  /**
   * Make the actual HTTP request with retry logic
   */
  private async makeHttpRequest<T>(context: RequestContext): Promise<T> {
    const { method, endpoint, params, headers = {}, body } = context;
    const timeout = context.customTimeout || this.config.timeout;

    // Build URL
    let url = `${this.config.baseUrl}${endpoint}`;
    if (method === 'GET' && params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }

    // Build headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (this.config.userAgent) {
      requestHeaders['User-Agent'] = this.config.userAgent;
    }

    if (this.config.apiKey) {
      requestHeaders['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    // Build request options
    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      signal: AbortSignal.timeout(timeout),
    };

    if (method !== 'GET' && body) {
      requestOptions.body = JSON.stringify(body);
    }

    // Retry logic
    let lastError: Error;
    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        const response = await fetch(url, requestOptions);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        } else {
          return await response.text() as T;
        }
      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain errors
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new Error(`Request timeout after ${timeout}ms`);
          }
          if (error.message.includes('HTTP 4')) {
            // Client errors (4xx) shouldn't be retried
            throw error;
          }
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.config.retries) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s, etc.
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  /**
   * Check rate limiting
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const key = 'default';
    const state = this.rateLimitState.get(key) || { count: 0, resetTime: now + this.rateLimit.windowMs };

    // Reset counter if window has passed
    if (now > state.resetTime) {
      state.count = 0;
      state.resetTime = now + this.rateLimit.windowMs;
    }

    // Check if limit exceeded
    if (state.count >= this.rateLimit.requests) {
      const waitTime = state.resetTime - now;
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    // Increment counter
    state.count++;
    this.rateLimitState.set(key, state);
  }

  /**
   * Generate cache key from request context
   */
  protected generateCacheKey(context: RequestContext): string {
    const { method, endpoint, params, body } = context;
    const keyParts = [method, endpoint];

    if (params) {
      keyParts.push(JSON.stringify(params));
    }

    if (body) {
      keyParts.push(JSON.stringify(body));
    }

    return keyParts.join('|');
  }

  /**
   * Get data from cache
   */
  protected getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set data in cache
   */
  protected setCache<T>(key: string, data: T, customTtl?: number): void {
    const ttl = customTtl || this.config.cacheTtl;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    this.cache.set(key, entry);
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; entries: Array<{ key: string; size: number; age: number }> } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      size: JSON.stringify(entry.data).length,
      age: now - entry.timestamp,
    }));

    return {
      size: this.cache.size,
      entries,
    };
  }

  /**
   * Start periodic cache cleanup
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.timestamp + entry.ttl) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Clean up every minute
  }

  /**
   * Health check for the service
   */
  public abstract healthCheck(): Promise<boolean>;

  /**
   * Get service information
   */
  public getServiceInfo(): { name: string; baseUrl: string; cacheSize: number } {
    return {
      name: this.constructor.name,
      baseUrl: this.config.baseUrl,
      cacheSize: this.cache.size,
    };
  }
}