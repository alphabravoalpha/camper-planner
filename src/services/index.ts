// Data Service Abstractions
// Abstract service classes for external API integration

import { APIConfig } from '../config';

// Rate limiting interface
interface RateLimit {
  requests: number;
  period: number; // milliseconds
}

// Cache interface
interface CacheOptions {
  ttl: number; // Time to live in milliseconds
  maxSize: number;
}

// Base DataService class - Foundation for all API services
export abstract class DataService {
  protected config: any;
  protected cache: Map<string, { data: any; timestamp: number }>;
  protected rateLimiter: Map<string, { count: number; resetTime: number }>;
  protected readonly rateLimit: RateLimit;
  protected readonly cacheOptions: CacheOptions;

  constructor(config: any, rateLimit: RateLimit, cacheOptions: CacheOptions) {
    this.config = config;
    this.cache = new Map();
    this.rateLimiter = new Map();
    this.rateLimit = rateLimit;
    this.cacheOptions = cacheOptions;
  }

  // Rate limiting check
  protected async checkRateLimit(service: string): Promise<boolean> {
    const usage = this.rateLimiter.get(service) || { count: 0, resetTime: Date.now() + this.rateLimit.period };

    if (Date.now() > usage.resetTime) {
      usage.count = 0;
      usage.resetTime = Date.now() + this.rateLimit.period;
    }

    if (usage.count >= this.rateLimit.requests) {
      throw new Error(`Rate limit exceeded for ${service}`);
    }

    usage.count++;
    this.rateLimiter.set(service, usage);
    return true;
  }

  // Cache management
  protected getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheOptions.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  protected setCached<T>(key: string, data: T): void {
    // Clean up old entries if cache is full
    if (this.cache.size >= this.cacheOptions.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Abstract methods to be implemented by concrete services
  abstract get<T>(params: any): Promise<T>;

  // V2: Enhanced methods (will be implemented later)
  protected async getWithCache<T>(_params: any): Promise<T> {
    // Implementation for V2
    throw new Error('getWithCache not implemented - V2 feature');
  }

  protected async getOffline<T>(_params: any): Promise<T> {
    // Implementation for V2
    throw new Error('getOffline not implemented - V2 feature');
  }

  // Error handling
  protected handleError(error: any, context: string): never {
    console.error(`${context} error:`, error);

    if (error.name === 'NetworkError') {
      throw new Error('Network connection failed. Please check your internet connection.');
    }

    if (error.status === 401) {
      throw new Error('API key invalid or missing.');
    }

    if (error.status === 403) {
      throw new Error('API rate limit exceeded. Please try again later.');
    }

    if (error.status === 404) {
      throw new Error('Requested data not found.');
    }

    throw new Error(`Service error: ${error.message || 'Unknown error'}`);
  }
}

// Routing Service class (Phase 3 implementation)
export class RoutingService extends DataService {
  constructor() {
    super(
      APIConfig.routing,
      { requests: 2000, period: 86400000 }, // 2000 requests per day
      { ttl: 3600000, maxSize: 100 } // 1 hour cache, 100 routes
    );
  }

  async get<T>(_params: any): Promise<T> {
    // Phase 3: Implement OpenRouteService integration
    throw new Error('RoutingService.get not implemented - Phase 3 feature');
  }

  // V1: Basic route calculation
  async calculateRoute(_waypoints: Array<[number, number]>, _vehicleProfile: any): Promise<any> {
    // Phase 3: Implementation
    throw new Error('calculateRoute not implemented - Phase 3 feature');
  }

  // V2: Multiple provider support
  async calculateRouteWithFallback(_waypoints: Array<[number, number]>, _vehicleProfile: any): Promise<any> {
    // V2: Implementation with OSRM fallback
    throw new Error('calculateRouteWithFallback not implemented - V2 feature');
  }
}

// Campsite Service class (Phase 4 implementation)
export class CampsiteService extends DataService {
  constructor() {
    super(
      APIConfig.campsites,
      { requests: 2, period: 1000 }, // 2 requests per second
      { ttl: 86400000, maxSize: 10000 } // 24 hour cache, 10k campsites
    );
  }

  async get<T>(_params: any): Promise<T> {
    // Phase 4: Implement Overpass API integration
    throw new Error('CampsiteService.get not implemented - Phase 4 feature');
  }

  // V1: Basic campsite data
  async getCampsites(_bbox: [number, number, number, number]): Promise<any[]> {
    // Phase 4: Implementation
    throw new Error('getCampsites not implemented - Phase 4 feature');
  }

  // V2: Multiple data sources
  async getCampsitesWithFallback(_bbox: [number, number, number, number]): Promise<any[]> {
    // V2: Implementation with multiple sources
    throw new Error('getCampsitesWithFallback not implemented - V2 feature');
  }
}

// Export Service class (Phase 6 implementation)
export class ExportService extends DataService {
  constructor() {
    super(
      {},
      { requests: 1000, period: 3600000 }, // 1000 exports per hour
      { ttl: 0, maxSize: 0 } // No caching for exports
    );
  }

  async get<T>(_params: any): Promise<T> {
    // Phase 6: Implement export functionality
    throw new Error('ExportService.get not implemented - Phase 6 feature');
  }

  // V1: GPX export
  async exportToGPX(_waypoints: any[], _route: any): Promise<string> {
    // Phase 6: Implementation
    throw new Error('exportToGPX not implemented - Phase 6 feature');
  }

  // V1: JSON export
  async exportToJSON(_tripData: any): Promise<string> {
    // Phase 6: Implementation
    throw new Error('exportToJSON not implemented - Phase 6 feature');
  }
}

// Service instances (will be initialized when needed)
export const routingService = new RoutingService();
export const campsiteService = new CampsiteService();
export const exportService = new ExportService();