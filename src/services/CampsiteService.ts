// Campsite Service Implementation
// Phase 4.1: Overpass API integration with IndexedDB caching and OpenCampingMap fallback

import { DataService } from './DataService';
import type { DataServiceConfig, RequestContext } from './DataService';

export interface CampsiteRequest {
  bounds: BoundingBox;
  types?: CampsiteType[];
  amenities?: string[];
  maxResults?: number;
  vehicleFilter?: VehicleFilter;
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface VehicleFilter {
  height?: number;  // meters
  length?: number;  // meters
  weight?: number;  // tonnes
  motorhome?: boolean;
  caravan?: boolean;
}

export type CampsiteType = 'campsite' | 'aire' | 'parking' | 'caravan_site';

export interface CampsiteResponse {
  campsites: Campsite[];
  metadata: CampsiteMetadata;
  cached: boolean;
  boundingBox: BoundingBox;
}

export interface Campsite {
  id: number;           // OSM element ID
  type: CampsiteType;   // 'campsite', 'aire', 'parking', 'caravan_site'
  name: string;         // Display name
  lat: number;          // Latitude
  lng: number;          // Longitude

  // Amenities
  amenities: {
    toilets: boolean;
    showers: boolean;
    drinking_water: boolean;
    electricity: boolean;
    wifi: boolean;
    restaurant: boolean;
    shop: boolean;
    playground: boolean;
    laundry: boolean;
    swimming_pool: boolean;
  };

  // Vehicle access
  access: {
    motorhome: boolean;
    caravan: boolean;
    tent: boolean;
    max_height?: number;   // meters
    max_length?: number;   // meters
    max_weight?: number;   // tonnes
  };

  // Contact & info
  contact: {
    phone?: string;
    website?: string;
    email?: string;
  };

  // Operational
  opening_hours?: string;
  fee?: string;
  reservation?: string;
  capacity?: number;

  // Metadata
  source: 'openstreetmap' | 'opencampingmap';
  last_updated: number; // timestamp
  quality_score?: number; // 0-1 based on data completeness
}

export interface CampsiteMetadata {
  service: 'overpass' | 'opencampingmap';
  timestamp: number;
  query: CampsiteRequest;
  results_count: number;
  cache_hit: boolean;
  query_duration: number; // milliseconds
}

// Error types for campsite data
export class CampsiteError extends Error {
  constructor(
    message: string,
    public code: string,
    public service: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'CampsiteError';
  }
}

// IndexedDB Cache Manager
class CampsiteCacheManager {
  private dbName = 'CampsiteCache';
  private version = 1;
  private storeName = 'campsites';
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(new Error('Failed to open IndexedDB'));

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create campsite store with spatial indexing
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('lat', 'lat', { unique: false });
          store.createIndex('lng', 'lng', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('last_updated', 'last_updated', { unique: false });
          store.createIndex('bounds', ['lat', 'lng'], { unique: false });
        }

        // Create cache metadata store
        if (!db.objectStoreNames.contains('cache_metadata')) {
          const metaStore = db.createObjectStore('cache_metadata', { keyPath: 'key' });
          metaStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async getCampsitesInBounds(bounds: BoundingBox): Promise<Campsite[]> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const results: Campsite[] = [];

      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const campsite = cursor.value as Campsite;

          // Check if campsite is within bounds
          if (
            campsite.lat >= bounds.south &&
            campsite.lat <= bounds.north &&
            campsite.lng >= bounds.west &&
            campsite.lng <= bounds.east
          ) {
            results.push(campsite);
          }
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(new Error('Failed to query campsites from cache'));
    });
  }

  async storeCampsites(campsites: Campsite[]): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      let completed = 0;
      const total = campsites.length;

      if (total === 0) {
        resolve();
        return;
      }

      for (const campsite of campsites) {
        const request = store.put(campsite);

        request.onsuccess = () => {
          completed++;
          if (completed === total) resolve();
        };

        request.onerror = () => reject(new Error('Failed to store campsite in cache'));
      }
    });
  }

  async getCacheMetadata(key: string): Promise<any> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache_metadata'], 'readonly');
      const store = transaction.objectStore('cache_metadata');
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result?.data);
      request.onerror = () => reject(new Error('Failed to get cache metadata'));
    });
  }

  async setCacheMetadata(key: string, data: any): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache_metadata'], 'readwrite');
      const store = transaction.objectStore('cache_metadata');
      const request = store.put({
        key,
        data,
        timestamp: Date.now()
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to set cache metadata'));
    });
  }

  async clearExpiredCache(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    if (!this.db) await this.initialize();

    const cutoffTime = Date.now() - maxAge;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('last_updated');
      const range = IDBKeyRange.upperBound(cutoffTime);

      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(new Error('Failed to clear expired cache'));
    });
  }
}

export class CampsiteService extends DataService {
  private cacheManager: CampsiteCacheManager;

  constructor() {
    // Overpass API configuration
    const config: DataServiceConfig = {
      baseUrl: 'https://overpass-api.de/api/interpreter',
      timeout: 30000, // 30 seconds for complex queries
      retries: 2,
      cacheEnabled: false, // Using IndexedDB instead
      cacheTtl: 0,
      userAgent: 'EuropeanCamperPlanner/1.0',
    };

    // Rate limiting: 2 queries per second (Overpass API fair use)
    const rateLimit = {
      requests: 2,
      windowMs: 1000, // 1 second window
      enabled: true,
    };

    super(config, rateLimit);

    this.cacheManager = new CampsiteCacheManager();
    this.initializeFallbackService();
    this.initializeCache();
  }

  /**
   * Search for campsites within bounding box
   */
  async searchCampsites(request: CampsiteRequest): Promise<CampsiteResponse> {
    const startTime = Date.now();

    try {
      // Check cache first
      const cached = await this.getCachedCampsites(request);
      if (cached) {
        return {
          ...cached,
          metadata: {
            ...cached.metadata,
            cache_hit: true,
            query_duration: Date.now() - startTime
          }
        };
      }

      // Try primary service (Overpass API)
      const result = await this.searchWithOverpass(request);

      // Cache the result
      await this.cacheManager.storeCampsites(result.campsites);
      await this.setCacheMetadata(request);

      return {
        ...result,
        metadata: {
          ...result.metadata,
          cache_hit: false,
          query_duration: Date.now() - startTime
        }
      };

    } catch (error) {
      console.warn('Overpass API failed, trying fallback:', error);

      // Try fallback service (OpenCampingMap)
      try {
        const fallbackResult = await this.searchWithOpenCampingMap(request);
        return {
          ...fallbackResult,
          metadata: {
            ...fallbackResult.metadata,
            cache_hit: false,
            query_duration: Date.now() - startTime
          }
        };
      } catch (fallbackError) {
        console.error('Fallback campsite service also failed:', fallbackError);

        // Return cached data even if expired as last resort
        const staleCache = await this.getCachedCampsites(request, true);
        if (staleCache) {
          return {
            ...staleCache,
            metadata: {
              ...staleCache.metadata,
              cache_hit: true,
              query_duration: Date.now() - startTime
            }
          };
        }
      }

      // All services failed
      throw new CampsiteError(
        'All campsite services are currently unavailable',
        'SERVICE_UNAVAILABLE',
        'all',
        false
      );
    }
  }

  /**
   * Search campsites using Overpass API
   */
  private async searchWithOverpass(request: CampsiteRequest): Promise<CampsiteResponse> {
    const { bounds, types = ['campsite', 'aire', 'caravan_site'], maxResults = 1000 } = request;

    // Build Overpass QL query
    const query = this.buildOverpassQuery(bounds, types);

    const context: RequestContext = {
      method: 'POST',
      endpoint: '',
      body: query,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    };

    const response = await this.request<any>(context);
    const campsites = this.parseOverpassResponse(response);

    // Filter and score results
    const filteredCampsites = this.filterAndScoreCampsites(campsites, request)
      .slice(0, maxResults);

    return {
      campsites: filteredCampsites,
      metadata: {
        service: 'overpass',
        timestamp: Date.now(),
        query: request,
        results_count: filteredCampsites.length,
        cache_hit: false,
        query_duration: 0 // Will be set by caller
      },
      cached: false,
      boundingBox: bounds
    };
  }

  /**
   * Search campsites using OpenCampingMap (fallback)
   */
  private async searchWithOpenCampingMap(request: CampsiteRequest): Promise<CampsiteResponse> {
    const { bounds, maxResults = 1000 } = request;

    // OpenCampingMap fallback configuration
    const fallbackConfig: DataServiceConfig = {
      baseUrl: 'https://opencampingmap.org/api',
      timeout: 15000,
      retries: 1,
      cacheEnabled: false,
      cacheTtl: 0,
      userAgent: 'EuropeanCamperPlanner/1.0',
    };

    // Temporarily override config
    const originalConfig = this.config;
    (this as any).config = fallbackConfig;

    try {
      const context: RequestContext = {
        method: 'GET',
        endpoint: `/campsites`,
        params: {
          bbox: `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`,
          limit: maxResults
        },
      };

      const response = await this.request<any>(context);
      const campsites = this.parseOpenCampingMapResponse(response);

      return {
        campsites,
        metadata: {
          service: 'opencampingmap',
          timestamp: Date.now(),
          query: request,
          results_count: campsites.length,
          cache_hit: false,
          query_duration: 0
        },
        cached: false,
        boundingBox: bounds
      };
    } finally {
      // Restore original config
      (this as any).config = originalConfig;
    }
  }

  /**
   * Build Overpass QL query for campsites
   */
  private buildOverpassQuery(bounds: BoundingBox, types: CampsiteType[]): string {
    const { south, west, north, east } = bounds;
    const bbox = `${south},${west},${north},${east}`;

    let queries: string[] = [];

    if (types.includes('campsite')) {
      queries.push(`
        node["tourism"="camp_site"](${bbox});
        way["tourism"="camp_site"](${bbox});
      `);
    }

    if (types.includes('caravan_site')) {
      queries.push(`
        node["tourism"="caravan_site"](${bbox});
        way["tourism"="caravan_site"](${bbox});
      `);
    }

    if (types.includes('aire')) {
      queries.push(`
        node["amenity"="parking"]["motorhome"="yes"](${bbox});
        node["amenity"="parking"]["caravan"="yes"](${bbox});
        node["tourism"="wilderness_hut"](${bbox});
        node["highway"="services"]["motorhome"="yes"](${bbox});
      `);
    }

    return `
[out:json][timeout:25];
(
  ${queries.join('')}
);
out center meta;
    `.trim();
  }

  /**
   * Parse Overpass API response
   */
  private parseOverpassResponse(response: any): Campsite[] {
    if (!response || !response.elements) {
      return [];
    }

    return response.elements.map((element: any) => this.parseOSMElement(element)).filter(Boolean);
  }

  /**
   * Parse OpenCampingMap response
   */
  private parseOpenCampingMapResponse(response: any): Campsite[] {
    if (!response || !response.features) {
      return [];
    }

    return response.features.map((feature: any) => this.parseOpenCampingMapFeature(feature)).filter(Boolean);
  }

  /**
   * Parse OSM element into Campsite object
   */
  private parseOSMElement(element: any): Campsite | null {
    if (!element.lat || !element.lon || !element.tags) {
      return null;
    }

    const tags = element.tags;
    const type = this.determineCampsiteType(tags);

    return {
      id: element.id,
      type,
      name: tags.name || tags['name:en'] || `${type} ${element.id}`,
      lat: element.lat,
      lng: element.lon,

      amenities: {
        toilets: this.parseBoolean(tags.amenity === 'toilets' || tags.toilets),
        showers: this.parseBoolean(tags.shower),
        drinking_water: this.parseBoolean(tags.drinking_water),
        electricity: this.parseBoolean(tags.electricity),
        wifi: this.parseBoolean(tags.internet_access === 'wifi' || tags.wifi),
        restaurant: this.parseBoolean(tags.amenity === 'restaurant' || tags.restaurant),
        shop: this.parseBoolean(tags.shop),
        playground: this.parseBoolean(tags.playground),
        laundry: this.parseBoolean(tags.laundry),
        swimming_pool: this.parseBoolean(tags.swimming_pool),
      },

      access: {
        motorhome: this.parseBoolean(tags.motorhome),
        caravan: this.parseBoolean(tags.caravan),
        tent: this.parseBoolean(tags.tents !== 'no' && type === 'campsite'),
        max_height: this.parseNumber(tags.maxheight),
        max_length: this.parseNumber(tags.maxlength),
        max_weight: this.parseNumber(tags.maxweight),
      },

      contact: {
        phone: tags.phone,
        website: tags.website || tags.url,
        email: tags.email,
      },

      opening_hours: tags.opening_hours,
      fee: tags.fee,
      reservation: tags.reservation,
      capacity: this.parseNumber(tags.capacity),

      source: 'openstreetmap',
      last_updated: Date.now(),
      quality_score: this.calculateQualityScore(tags)
    };
  }

  /**
   * Parse OpenCampingMap feature
   */
  private parseOpenCampingMapFeature(feature: any): Campsite | null {
    if (!feature.geometry || !feature.properties) {
      return null;
    }

    const props = feature.properties;
    const [lng, lat] = feature.geometry.coordinates;

    return {
      id: props.id || Math.random() * 1000000,
      type: 'campsite',
      name: props.name || 'Unnamed Campsite',
      lat,
      lng,

      amenities: {
        toilets: Boolean(props.toilets),
        showers: Boolean(props.showers),
        drinking_water: Boolean(props.drinking_water),
        electricity: Boolean(props.electricity),
        wifi: Boolean(props.wifi),
        restaurant: Boolean(props.restaurant),
        shop: Boolean(props.shop),
        playground: Boolean(props.playground),
        laundry: Boolean(props.laundry),
        swimming_pool: Boolean(props.swimming_pool),
      },

      access: {
        motorhome: Boolean(props.motorhome),
        caravan: Boolean(props.caravan),
        tent: Boolean(props.tent),
        max_height: props.max_height,
        max_length: props.max_length,
        max_weight: props.max_weight,
      },

      contact: {
        phone: props.phone,
        website: props.website,
        email: props.email,
      },

      opening_hours: props.opening_hours,
      fee: props.fee,
      reservation: props.reservation,
      capacity: props.capacity,

      source: 'opencampingmap',
      last_updated: Date.now(),
      quality_score: 0.8 // Assume good quality for curated data
    };
  }

  /**
   * Determine campsite type from OSM tags
   */
  private determineCampsiteType(tags: any): CampsiteType {
    if (tags.tourism === 'camp_site') return 'campsite';
    if (tags.tourism === 'caravan_site') return 'caravan_site';
    if (tags.amenity === 'parking' && (tags.motorhome === 'yes' || tags.caravan === 'yes')) return 'aire';
    if (tags.highway === 'services' && tags.motorhome === 'yes') return 'aire';
    return 'campsite'; // Default
  }

  /**
   * Parse boolean values from OSM tags
   */
  private parseBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      return lower === 'yes' || lower === 'true' || lower === '1';
    }
    return false;
  }

  /**
   * Parse numeric values from OSM tags
   */
  private parseNumber(value: any): number | undefined {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseFloat(value.replace(/[^\d.]/g, ''));
      return isNaN(num) ? undefined : num;
    }
    return undefined;
  }

  /**
   * Calculate quality score based on data completeness
   */
  private calculateQualityScore(tags: any): number {
    let score = 0;
    const checks = [
      tags.name,
      tags.phone || tags.website,
      tags.opening_hours,
      tags.drinking_water,
      tags.electricity,
      tags.toilets || tags.amenity === 'toilets',
      tags.motorhome || tags.caravan
    ];

    score = checks.filter(Boolean).length / checks.length;
    return Math.round(score * 100) / 100;
  }

  /**
   * Filter and score campsites based on request criteria
   */
  private filterAndScoreCampsites(campsites: Campsite[], request: CampsiteRequest): Campsite[] {
    let filtered = campsites;

    // Filter by vehicle compatibility
    if (request.vehicleFilter) {
      filtered = filtered.filter(campsite => this.isVehicleCompatible(campsite, request.vehicleFilter!));
    }

    // Filter by amenities
    if (request.amenities && request.amenities.length > 0) {
      filtered = filtered.filter(campsite => {
        return request.amenities!.some(amenity =>
          (campsite.amenities as any)[amenity] === true
        );
      });
    }

    // Sort by quality score and distance from center
    const centerLat = (request.bounds.north + request.bounds.south) / 2;
    const centerLng = (request.bounds.east + request.bounds.west) / 2;

    return filtered.sort((a, b) => {
      const distanceA = this.calculateDistance(centerLat, centerLng, a.lat, a.lng);
      const distanceB = this.calculateDistance(centerLat, centerLng, b.lat, b.lng);

      // Combine quality score and proximity
      const scoreA = (a.quality_score || 0.5) - (distanceA / 100); // Normalize distance
      const scoreB = (b.quality_score || 0.5) - (distanceB / 100);

      return scoreB - scoreA;
    });
  }

  /**
   * Check if campsite is compatible with vehicle
   */
  private isVehicleCompatible(campsite: Campsite, vehicle: VehicleFilter): boolean {
    // Check vehicle type access
    if (vehicle.motorhome && !campsite.access.motorhome) return false;
    if (vehicle.caravan && !campsite.access.caravan) return false;

    // Check dimensional restrictions
    if (vehicle.height && campsite.access.max_height && vehicle.height > campsite.access.max_height) return false;
    if (vehicle.length && campsite.access.max_length && vehicle.length > campsite.access.max_length) return false;
    if (vehicle.weight && campsite.access.max_weight && vehicle.weight > campsite.access.max_weight) return false;

    return true;
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Get cached campsites
   */
  private async getCachedCampsites(request: CampsiteRequest, allowStale = false): Promise<CampsiteResponse | null> {
    try {
      const cacheKey = this.generateCampsiteCacheKey(request);
      const metadata = await this.cacheManager.getCacheMetadata(cacheKey);

      if (metadata) {
        const age = Date.now() - metadata.timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (allowStale || age < maxAge) {
          const campsites = await this.cacheManager.getCampsitesInBounds(request.bounds);

          if (campsites.length > 0) {
            return {
              campsites: this.filterAndScoreCampsites(campsites, request),
              metadata: {
                service: metadata.service || 'overpass',
                timestamp: metadata.timestamp,
                query: request,
                results_count: campsites.length,
                cache_hit: true,
                query_duration: 0
              },
              cached: true,
              boundingBox: request.bounds
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.warn('Cache lookup failed:', error);
      return null;
    }
  }

  /**
   * Set cache metadata
   */
  private async setCacheMetadata(request: CampsiteRequest): Promise<void> {
    try {
      const cacheKey = this.generateCampsiteCacheKey(request);
      await this.cacheManager.setCacheMetadata(cacheKey, {
        timestamp: Date.now(),
        service: 'overpass',
        bounds: request.bounds
      });
    } catch (error) {
      console.warn('Failed to set cache metadata:', error);
    }
  }

  /**
   * Override base class generateCacheKey to handle RequestContext
   * (CampsiteService uses IndexedDB instead of base class cache)
   */
  protected override generateCacheKey(context: any): string {
    // CampsiteService has cacheEnabled: false, so this shouldn't be called,
    // but we need to implement it to avoid errors in base class
    if (typeof context === 'object' && context.endpoint !== undefined) {
      // This is a RequestContext from base class
      return super.generateCacheKey(context);
    }
    // Fallback for any other case
    return 'campsite_' + JSON.stringify(context);
  }

  /**
   * Generate cache key for campsite request (IndexedDB)
   */
  private generateCampsiteCacheKey(request: CampsiteRequest): string {
    const { bounds, types = [], amenities = [] } = request;
    return `campsites_${bounds.south}_${bounds.west}_${bounds.north}_${bounds.east}_${types.join(',')}_${amenities.join(',')}`;
  }

  /**
   * Initialize cache system
   */
  private async initializeCache(): Promise<void> {
    try {
      await this.cacheManager.initialize();
      // Clean expired cache on startup
      await this.cacheManager.clearExpiredCache();
    } catch (error) {
      console.warn('Failed to initialize campsite cache:', error);
    }
  }

  /**
   * Initialize fallback service
   */
  private initializeFallbackService(): void {
    // Fallback handled internally to avoid circular dependencies
    this.fallbackService = null;
  }

  /**
   * Health check for Overpass API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const testQuery = '[out:json][timeout:5]; out count;';

      const context: RequestContext = {
        method: 'POST',
        endpoint: '',
        body: testQuery,
        headers: { 'Content-Type': 'text/plain' },
        customTimeout: 5000,
      };

      await this.request(context);
      return true;
    } catch (error) {
      console.warn('Overpass API health check failed:', error);
      return false;
    }
  }

  /**
   * Get service status and statistics
   */
  getServiceStatus(): {
    primary: { name: string; healthy: boolean; cacheSize: string };
    fallback: { name: string; available: boolean };
    rateLimitInfo: { remaining: number; resetTime: number };
  } {
    const rateLimitState = this.rateLimitState.get('default') || { count: 0, resetTime: Date.now() };

    return {
      primary: {
        name: 'Overpass API',
        healthy: true, // Would need actual health check
        cacheSize: 'IndexedDB',
      },
      fallback: {
        name: 'OpenCampingMap',
        available: true,
      },
      rateLimitInfo: {
        remaining: Math.max(0, this.rateLimit.requests - rateLimitState.count),
        resetTime: rateLimitState.resetTime,
      },
    };
  }

  /**
   * Manual cache refresh
   */
  async refreshCache(bounds: BoundingBox): Promise<void> {
    const request: CampsiteRequest = { bounds };

    // Clear existing cache for this area
    // Note: This is a simplified implementation
    // A full implementation would need spatial cache invalidation

    // Fetch fresh data
    await this.searchWithOverpass(request);
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{ size: number; lastUpdated: number }> {
    // This would require additional IndexedDB queries
    // Simplified implementation for now
    return {
      size: 0, // Would count campsites in cache
      lastUpdated: Date.now()
    };
  }
}

// Export singleton instance
export const campsiteService = new CampsiteService();