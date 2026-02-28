// Campsite Service Implementation
// Phase 4.1: Overpass API integration with IndexedDB caching and OpenCampingMap fallback

import { DataService, type DataServiceConfig, type RequestContext } from './DataService';
import { APIConfig } from '../config/api';

export interface CampsiteRequest {
  bounds: BoundingBox;
  types?: CampsiteType[];
  amenities?: string[];
  maxResults?: number;
  vehicleFilter?: VehicleFilter;
  includeDetails?: boolean;
  locationQuery?: string; // For location-based search (e.g. "Barcelona", "Tuscany")
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface VehicleFilter {
  height?: number; // meters
  length?: number; // meters
  weight?: number; // tonnes
  motorhome?: boolean;
  caravan?: boolean;
}

export type CampsiteType = 'campsite' | 'aire' | 'parking' | 'caravan_site';

export interface CampsiteResponse {
  campsites: Campsite[];
  metadata: CampsiteMetadata;
  cached: boolean;
  boundingBox: BoundingBox;
  status?: 'success' | 'error' | 'loading';
  error?: string;
}

export interface Campsite {
  id: number; // OSM element ID
  osmId?: number; // Alternative OSM ID reference
  type: CampsiteType; // 'campsite', 'aire', 'parking', 'caravan_site'
  name: string; // Display name
  lat: number; // Latitude
  lng: number; // Longitude

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
    sanitary_dump_station: boolean;
    waste_disposal: boolean;
    hot_water: boolean;
    kitchen: boolean;
    picnic_table: boolean;
    bbq: boolean;
  };

  // Vehicle access
  access: {
    motorhome: boolean;
    caravan: boolean;
    tent: boolean;
    max_height?: number; // meters
    max_length?: number; // meters
    max_weight?: number; // tonnes
  };

  // Vehicle compatibility (computed field based on access and vehicle profile)
  vehicleCompatible?: boolean;

  // Contact & info
  contact: {
    phone?: string;
    website?: string;
    email?: string;
  };

  // Direct contact access (for backward compatibility)
  phone?: string;
  website?: string;

  // Address (optional, derived from coordinates or OSM data)
  address?: string;

  // Operational
  opening_hours?: string;
  fee?: string;
  reservation?: string;
  capacity?: number;

  // Additional restrictions or important information
  restrictions?: string;

  // Metadata
  source: 'openstreetmap' | 'opencampingmap';
  last_updated: number; // timestamp
  quality_score?: number; // 0-1 based on data completeness

  // Extended fields (Task 1 enrichment)
  stars?: number; // 1-5, from tourism board ratings
  description?: string; // Free text from OSM
  operator?: string; // Who runs the campsite
  imageUrl?: string; // Wikimedia Commons thumbnail or direct URL
  policies?: {
    dogs?: string; // 'yes' | 'no' | 'leashed'
    fires?: boolean;
    bbq?: boolean;
    nudism?: boolean;
  };
  capacityDetails?: {
    pitches?: number;
    tents?: number;
    caravans?: number;
  };
  powerSupply?: string; // e.g. "16A", "CEE 16A"
  structuredAddress?: {
    street?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
  dataCompleteness?: 'minimal' | 'basic' | 'detailed';
}

export interface CampsiteMetadata {
  service: 'overpass' | 'opencampingmap';
  timestamp: number;
  query: CampsiteRequest;
  results_count: number;
  cache_hit: boolean;
  query_duration: number; // milliseconds
  geocoded_location?: GeocodeResult; // If search was location-based
}

// Geocoding interfaces
export interface GeocodeResult {
  display_name: string;
  lat: number;
  lng: number;
  boundingbox: [string, string, string, string]; // [south, north, west, east]
  type: string; // city, region, etc
  importance: number; // 0-1 relevance score
  name?: string; // Short name (first part of display_name)
  subtitle?: string; // Clean "Region, Country" for display
}

// Error types for campsite data
export class CampsiteError extends Error {
  public code: string;
  public service: string;
  public recoverable: boolean;

  constructor(message: string, code: string, service: string, recoverable: boolean = true) {
    super(message);
    this.name = 'CampsiteError';
    this.code = code;
    this.service = service;
    this.recoverable = recoverable;
  }
}

// Overpass API response types
interface OverpassResponse {
  elements?: OverpassElement[];
}

interface OverpassElement {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

// OpenCampingMap response types
interface OpenCampingMapResponse {
  features?: OpenCampingMapFeature[];
}

interface OpenCampingMapFeature {
  geometry?: { coordinates: [number, number] };
  properties?: Record<string, string | number | boolean | undefined>;
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

      request.onupgradeneeded = event => {
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

      request.onsuccess = event => {
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

  async getCacheMetadata(key: string): Promise<Record<string, unknown> | undefined> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache_metadata'], 'readonly');
      const store = transaction.objectStore('cache_metadata');
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result?.data);
      request.onerror = () => reject(new Error('Failed to get cache metadata'));
    });
  }

  async setCacheMetadata(key: string, data: Record<string, unknown>): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache_metadata'], 'readwrite');
      const store = transaction.objectStore('cache_metadata');
      const request = store.put({
        key,
        data,
        timestamp: Date.now(),
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

      request.onsuccess = event => {
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

/**
 * Normalize search queries for geocoding.
 * Uppercases queries that match European postcode patterns for better Nominatim matching.
 * UK postcodes (e.g., "sw1a 1aa") and Dutch postcodes (e.g., "1012 ab") are indexed
 * in uppercase in OSM data, so lowercase input can return incorrect results.
 */
function normalizeSearchQuery(query: string): string {
  const trimmed = query.trim();

  // UK postcode: A9 9AA, A99 9AA, A9A 9AA, AA9 9AA, AA99 9AA, AA9A 9AA
  const ukPostcode = /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}$/;

  // Dutch postcode: 1234 AB
  const dutchPostcode = /^\d{4}\s*[A-Za-z]{2}$/;

  // Irish Eircode: D02 AF30
  const irishEircode = /^[A-Za-z]\d{2}\s*[A-Za-z\d]{4}$/;

  // Canadian-style alphanumeric: K1A 0B1
  const alphanumericPostcode = /^[A-Za-z]\d[A-Za-z]\s*\d[A-Za-z]\d$/;

  if (
    ukPostcode.test(trimmed) ||
    dutchPostcode.test(trimmed) ||
    irishEircode.test(trimmed) ||
    alphanumericPostcode.test(trimmed)
  ) {
    return trimmed.toUpperCase();
  }

  return trimmed;
}

export class CampsiteService extends DataService {
  private cacheManager: CampsiteCacheManager;
  private _fallbackService?: CampsiteService;

  // Request deduplication protection only
  private activeRequests = new Map<string, Promise<CampsiteResponse>>();

  // Nominatim rate limiting (1 request per second policy)
  private lastNominatimRequest = 0;

  // Track last successfully loaded bounds for overlap-aware cache
  private lastLoadedBounds: BoundingBox | null = null;
  private lastLoadedCampsites: Campsite[] = [];

  constructor() {
    // Overpass API configuration
    const config: DataServiceConfig = {
      baseUrl: APIConfig.campsites.sources.overpass,
      timeout: 30000, // 30 seconds for complex queries
      retries: 1, // Reduce retries to prevent spam
      cacheEnabled: false, // Using IndexedDB instead
      cacheTtl: 0,
      userAgent: 'EuropeanCamperPlanner/1.0',
    };

    // Rate limiting: 2 requests per second to avoid Overpass API 429 errors
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
   * Geocode location query to coordinates using Nominatim
   * Returns multiple results to allow user disambiguation
   * Supports: city names, addresses, postcodes, landmarks
   */
  async geocodeLocationMultiple(
    query: string,
    limit: number = 5,
    viewbox?: [number, number, number, number] // [west, south, east, north] — biases results toward this viewport
  ): Promise<GeocodeResult[]> {
    try {
      // Enforce Nominatim's 1 request/second policy
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastNominatimRequest;
      if (timeSinceLastRequest < 1100) {
        await new Promise(resolve => setTimeout(resolve, 1100 - timeSinceLastRequest));
      }
      this.lastNominatimRequest = Date.now();

      // Normalize postcode-like queries to uppercase for better Nominatim matching
      const normalizedQuery = normalizeSearchQuery(query);

      // Use direct fetch for geocoding to bypass DataService complexity
      const params = new URLSearchParams({
        q: normalizedQuery,
        format: 'json',
        limit: String(limit),
        addressdetails: '1',
        extratags: '1',
        namedetails: '1',
        // European country codes for better results
        countrycodes:
          'gb,ie,fr,de,es,pt,it,nl,be,at,ch,dk,no,se,fi,pl,cz,hr,si,gr,hu,sk,ro,bg,ee,lv,lt,lu,mt,cy',
      });

      // Bias results toward current map viewport (does not restrict, just ranks higher)
      if (viewbox) {
        const [west, south, east, north] = viewbox;
        params.set('viewbox', `${west},${north},${east},${south}`);
        params.set('bounded', '0');
      }

      // Use proxy in development, direct Nominatim URL in production
      const isDevelopment = import.meta.env.DEV;
      const geocodeUrl = isDevelopment
        ? `/api/geocode?${params.toString()}`
        : `https://nominatim.openstreetmap.org/search?${params.toString()}`;

      const response = await fetch(geocodeUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'EuropeanCamperPlanner/1.0 (https://github.com/user/camper-planner)',
        },
      });

      if (!response.ok) {
        throw new Error(`Geocoding HTTP error: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.length > 0) {
        return data
          .map(
            (result: {
              display_name: string;
              lat: string;
              lon: string;
              boundingbox: [string, string, string, string];
              type?: string;
              class?: string;
              importance?: string;
              address?: {
                house_number?: string;
                road?: string;
                postcode?: string;
                city?: string;
                town?: string;
                village?: string;
                county?: string;
                state?: string;
                country?: string;
              };
            }) => {
              // Build a better short name for addresses
              let shortName = result.display_name.split(',')[0].trim();

              // For addresses with house numbers, show street address
              if (result.address) {
                const addr = result.address;
                if (addr.house_number && addr.road) {
                  shortName = `${addr.house_number} ${addr.road}`;
                } else if (addr.road) {
                  shortName = addr.road;
                } else if (addr.postcode) {
                  const place = addr.city || addr.town || addr.village || '';
                  shortName = place ? `${addr.postcode}, ${place}` : addr.postcode;
                }
              }

              // Build a clean subtitle: "Region, Country" for disambiguation
              let subtitle = '';
              if (result.address) {
                const addr = result.address;
                const region = addr.state || addr.county || '';
                const country = addr.country || '';
                if (region && country) {
                  subtitle = `${region}, ${country}`;
                } else if (country) {
                  subtitle = country;
                }
              }
              // Fallback: extract last 2 parts of display_name (typically region, country)
              if (!subtitle) {
                const parts = result.display_name.split(',').map((s: string) => s.trim());
                subtitle =
                  parts.length >= 2 ? parts.slice(-2).join(', ') : parts[parts.length - 1] || '';
              }

              return {
                display_name: result.display_name,
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon),
                boundingbox: result.boundingbox,
                type: result.type || result.class || 'place',
                importance: parseFloat(result.importance || '0.5'),
                name: shortName,
                subtitle,
              };
            }
          )
          .sort((a: GeocodeResult, b: GeocodeResult) => {
            // Sort: exact name matches first, then startsWith, then by importance
            const queryLower = normalizedQuery.toLowerCase();
            const aName = (a.name || '').toLowerCase();
            const bName = (b.name || '').toLowerCase();

            const aExact = aName === queryLower ? 1 : 0;
            const bExact = bName === queryLower ? 1 : 0;
            if (aExact !== bExact) return bExact - aExact;

            const aStarts = aName.startsWith(queryLower) ? 1 : 0;
            const bStarts = bName.startsWith(queryLower) ? 1 : 0;
            if (aStarts !== bStarts) return bStarts - aStarts;

            return (b.importance || 0) - (a.importance || 0);
          });
      }

      return [];
    } catch (error) {
      console.error('Geocoding failed:', error);
      return [];
    }
  }

  /**
   * Geocode location query to coordinates using Nominatim
   * Returns first result (for backward compatibility)
   */
  async geocodeLocation(query: string): Promise<GeocodeResult | null> {
    const results = await this.geocodeLocationMultiple(query, 1);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Reverse geocode coordinates to get a human-readable location name.
   * Returns "near {town}, {region}" format.
   * Respects Nominatim 1 req/sec rate limit.
   */
  async reverseGeocode(
    lat: number,
    lng: number
  ): Promise<{ displayName: string; city?: string; region?: string; country?: string } | null> {
    try {
      // Enforce Nominatim rate limit
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastNominatimRequest;
      if (timeSinceLastRequest < 1100) {
        await new Promise(resolve => setTimeout(resolve, 1100 - timeSinceLastRequest));
      }
      this.lastNominatimRequest = Date.now();

      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'EuropeanCamperPlanner/1.0 (camperplanning.com)',
        },
      });

      if (!response.ok) return null;

      const data = await response.json();
      const addr = data.address || {};

      const city = addr.city || addr.town || addr.village || addr.hamlet;
      const region = addr.state || addr.county;
      const country = addr.country;

      // Build "near {city}, {region}" format
      const parts: string[] = [];
      if (city) parts.push(city);
      if (region) parts.push(region);
      if (!city && !region && country) parts.push(country);

      return {
        displayName: parts.length > 0 ? parts.join(', ') : data.display_name?.split(',')[0] || '',
        city,
        region,
        country,
      };
    } catch {
      return null;
    }
  }

  /**
   * Enrich a campsite with reverse geocoded address if it has no name or address.
   * Call this on-demand when user clicks a campsite marker.
   */
  async enrichCampsiteWithLocation(campsite: Campsite): Promise<Campsite> {
    const isUnnamed =
      !campsite.name || /^(campsite|caravan_site|aire|parking)\s+\d+$/i.test(campsite.name);
    const noAddress = !campsite.address && !campsite.structuredAddress?.city;

    if (!isUnnamed && !noAddress) return campsite;

    const location = await this.reverseGeocode(campsite.lat, campsite.lng);
    if (!location) return campsite;

    const enriched = { ...campsite };

    if (isUnnamed && location.displayName) {
      const typeLabel =
        campsite.type === 'aire'
          ? 'Aire'
          : campsite.type === 'caravan_site'
            ? 'Caravan site'
            : 'Campsite';
      enriched.name = `${typeLabel} near ${location.displayName}`;
    }

    if (noAddress && location.displayName) {
      enriched.address = location.displayName;
      if (!enriched.structuredAddress?.city) {
        enriched.structuredAddress = {
          ...enriched.structuredAddress,
          city: location.city,
          country: location.country,
        };
      }
    }

    return enriched;
  }

  /**
   * Search for campsites within bounding box or by location
   */
  async searchCampsites(request: CampsiteRequest): Promise<CampsiteResponse> {
    const startTime = Date.now();

    // Handle location-based search
    if (request.locationQuery) {
      return this.searchCampsitesByLocation(request, startTime);
    }

    // Generate request key for deduplication
    const requestKey = this.generateCampsiteCacheKey(request);

    // Check if identical request is already in progress
    if (this.activeRequests.has(requestKey)) {
      return this.activeRequests.get(requestKey)!;
    }

    // Validate bounds to prevent undefined access errors
    if (
      !request.bounds ||
      typeof request.bounds.south === 'undefined' ||
      typeof request.bounds.west === 'undefined' ||
      typeof request.bounds.north === 'undefined' ||
      typeof request.bounds.east === 'undefined'
    ) {
      return {
        status: 'error',
        error: 'Invalid bounds provided',
        campsites: [],
        metadata: {
          service: 'overpass' as const,
          timestamp: Date.now(),
          query: request,
          results_count: 0,
          query_duration: Date.now() - startTime,
          cache_hit: false,
        },
        cached: false,
        boundingBox: request.bounds,
      };
    }

    // Track this request to prevent duplicates
    const requestPromise = this.executeSearchRequest(request, requestKey, startTime);
    this.activeRequests.set(requestKey, requestPromise);

    try {
      return await requestPromise;
    } finally {
      // Clean up tracking
      this.activeRequests.delete(requestKey);
    }
  }

  /**
   * Search for campsites by location query (geocoded search)
   */
  private async searchCampsitesByLocation(
    request: CampsiteRequest,
    startTime: number
  ): Promise<CampsiteResponse> {
    try {
      // Geocode the location query
      const geocodeResult = await this.geocodeLocation(request.locationQuery!);

      if (!geocodeResult) {
        return {
          status: 'error',
          error: `Could not find location: ${request.locationQuery}`,
          campsites: [],
          metadata: {
            service: 'overpass' as const,
            timestamp: Date.now(),
            query: request,
            results_count: 0,
            query_duration: Date.now() - startTime,
            cache_hit: false,
          },
          cached: false,
          boundingBox: request.bounds,
        };
      }

      // Create search bounds around the geocoded location
      const radiusKm = 50; // 50km radius search
      const radiusLat = radiusKm / 111; // Approximate degrees latitude per km
      const radiusLng = radiusKm / (111 * Math.cos((geocodeResult.lat * Math.PI) / 180)); // Adjust for longitude

      const locationBasedRequest: CampsiteRequest = {
        ...request,
        bounds: {
          north: geocodeResult.lat + radiusLat,
          south: geocodeResult.lat - radiusLat,
          east: geocodeResult.lng + radiusLng,
          west: geocodeResult.lng - radiusLng,
        },
        locationQuery: undefined, // Remove to prevent infinite recursion
      };

      // Search campsites in the geocoded area
      const result = await this.searchCampsites(locationBasedRequest);

      // Add geocoding information to metadata
      return {
        ...result,
        metadata: {
          ...result.metadata,
          geocoded_location: geocodeResult,
          query: request, // Keep original query with locationQuery
        },
      };
    } catch (error) {
      console.error('Location-based search failed:', error);
      return {
        status: 'error',
        error: `Location search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        campsites: [],
        metadata: {
          service: 'overpass' as const,
          timestamp: Date.now(),
          query: request,
          results_count: 0,
          query_duration: Date.now() - startTime,
          cache_hit: false,
        },
        cached: false,
        boundingBox: request.bounds,
      };
    }
  }

  private async executeSearchRequest(
    request: CampsiteRequest,
    _requestKey: string,
    startTime: number
  ): Promise<CampsiteResponse> {
    try {
      // Check IndexedDB cache first
      const cached = await this.getCachedCampsites(request);
      if (cached) {
        this.lastLoadedBounds = request.bounds;
        this.lastLoadedCampsites = cached.campsites;
        return {
          ...cached,
          metadata: {
            ...cached.metadata,
            cache_hit: true,
            query_duration: Date.now() - startTime,
          },
        };
      }

      // Overlap-aware loading: if we have recent in-memory data that mostly covers
      // the new request, reuse it and only fetch the gap regions
      if (this.lastLoadedBounds && this.lastLoadedCampsites.length > 0) {
        const overlapRatio = this.getOverlapRatio(request.bounds, this.lastLoadedBounds);
        if (overlapRatio >= 0.7) {
          // 70%+ overlap — reuse existing data, fetch only gap strips
          const gaps = this.computeGapRegions(request.bounds, this.lastLoadedBounds);
          const gapCampsites: Campsite[] = [];

          if (gaps.length > 0) {
            const gapResults = await Promise.allSettled(
              gaps.map(gapBounds => this.searchWithOverpass({ ...request, bounds: gapBounds }))
            );
            for (const result of gapResults) {
              if (result.status === 'fulfilled' && result.value.status === 'success') {
                gapCampsites.push(...result.value.campsites);
                // Cache gap results in IndexedDB
                this.cacheManager.storeCampsites(result.value.campsites).catch(() => {});
              }
            }
          }

          // Combine: campsites from previous load that are within new bounds + gap data
          const reusable = this.lastLoadedCampsites.filter(c =>
            this.isCampsiteInBounds(c, request.bounds)
          );
          const allCampsites = this.deduplicateCampsites([...reusable, ...gapCampsites]);
          const filteredCampsites = this.filterAndScoreCampsites(allCampsites, request);

          // Update tracking
          this.lastLoadedBounds = request.bounds;
          this.lastLoadedCampsites = filteredCampsites;

          return {
            status: 'success',
            campsites: filteredCampsites,
            metadata: {
              service: 'overpass' as const,
              timestamp: Date.now(),
              query: request,
              results_count: filteredCampsites.length,
              cache_hit: false,
              query_duration: Date.now() - startTime,
            },
            cached: false,
            boundingBox: request.bounds,
          };
        }
      }

      // Full fetch from Overpass API
      const result = await this.searchWithOverpass(request);

      // Cache the result
      await this.cacheManager.storeCampsites(result.campsites);
      await this.setCacheMetadata(request);

      // Update tracking
      this.lastLoadedBounds = request.bounds;
      this.lastLoadedCampsites = result.campsites;

      return {
        ...result,
        metadata: {
          ...result.metadata,
          cache_hit: false,
          query_duration: Date.now() - startTime,
        },
      };
    } catch (_error) {
      // Return cached data even if expired as fallback
      const staleCache = await this.getCachedCampsites(request, true);
      if (staleCache) {
        return {
          ...staleCache,
          metadata: {
            ...staleCache.metadata,
            cache_hit: true,
            query_duration: Date.now() - startTime,
          },
        };
      }

      // Return error status so the UI can show a retry option
      return {
        status: 'error',
        error: 'Unable to load campsites. The server may be busy — try again in a moment.',
        campsites: [],
        metadata: {
          service: 'overpass' as const,
          timestamp: Date.now(),
          query: request,
          results_count: 0,
          query_duration: Date.now() - startTime,
          cache_hit: false,
        },
        cached: false,
        boundingBox: request.bounds,
      };
    }
  }

  /**
   * Search campsites using Overpass API
   */
  private async searchWithOverpass(request: CampsiteRequest): Promise<CampsiteResponse> {
    const { bounds, types = ['campsite', 'aire', 'caravan_site'], maxResults = 1000 } = request;

    // Build primary Overpass QL query (core types only for speed)
    const query = this.buildOverpassQuery(bounds, types, 'primary');

    const context: RequestContext = {
      method: 'POST',
      endpoint: '',
      body: query,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    };

    let response = await this.request<Record<string, unknown> | string>(context);

    // Overpass may return non-JSON (HTML error pages, rate limit responses)
    // DataService returns raw text when content-type isn't application/json
    if (typeof response === 'string') {
      try {
        response = JSON.parse(response) as Record<string, unknown>;
      } catch {
        throw new Error(
          'Overpass API returned an invalid response (non-JSON). The server may be overloaded.'
        );
      }
    }

    const campsites = this.parseOverpassResponse(response as OverpassResponse);

    // Filter and score results
    const filteredCampsites = this.filterAndScoreCampsites(campsites, request).slice(0, maxResults);

    // Fire secondary/niche types in background after a delay to respect Overpass 2 req/s rate limit
    setTimeout(() => {
      this.fetchSecondaryTypes(bounds, types, request).catch(() => {});
    }, 2000);

    return {
      status: 'success',
      campsites: filteredCampsites,
      metadata: {
        service: 'overpass',
        timestamp: Date.now(),
        query: request,
        results_count: filteredCampsites.length,
        cache_hit: false,
        query_duration: 0, // Will be set by caller
      },
      cached: false,
      boundingBox: bounds,
    };
  }

  /**
   * Search campsites using OpenCampingMap (fallback)
   */
  private async _searchWithOpenCampingMap(request: CampsiteRequest): Promise<CampsiteResponse> {
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
    (this as unknown as { config: DataServiceConfig }).config = fallbackConfig;

    try {
      const context: RequestContext = {
        method: 'GET',
        endpoint: `/campsites`,
        params: {
          bbox: `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`,
          limit: maxResults,
        },
      };

      const response = await this.request<OpenCampingMapResponse>(context);
      const campsites = this.parseOpenCampingMapResponse(response);

      return {
        campsites,
        metadata: {
          service: 'opencampingmap',
          timestamp: Date.now(),
          query: request,
          results_count: campsites.length,
          cache_hit: false,
          query_duration: 0,
        },
        cached: false,
        boundingBox: bounds,
      };
    } finally {
      // Restore original config
      (this as unknown as { config: DataServiceConfig }).config = originalConfig;
    }
  }

  /**
   * Validate coordinate values
   */
  private isValidCoordinate(value: number, type: 'latitude' | 'longitude'): boolean {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      return false;
    }

    if (type === 'latitude') {
      return value >= -90 && value <= 90;
    } else {
      return value >= -180 && value <= 180;
    }
  }

  /**
   * Build Overpass QL query for campsites.
   * 'primary' fetches core types (campsite, caravan_site nodes+ways) for fast initial load.
   * 'secondary' fetches niche types (aires, relations) and loads lazily in background.
   */
  private buildOverpassQuery(
    bounds: BoundingBox,
    types: CampsiteType[],
    priority: 'primary' | 'secondary' = 'primary'
  ): string {
    const { south, west, north, east } = bounds;

    // Validate coordinates
    if (
      !this.isValidCoordinate(south, 'latitude') ||
      !this.isValidCoordinate(north, 'latitude') ||
      !this.isValidCoordinate(west, 'longitude') ||
      !this.isValidCoordinate(east, 'longitude')
    ) {
      throw new Error(`Invalid coordinates: lat=${south}-${north}, lng=${west}-${east}`);
    }

    // Validate bounding box size (prevent overly large queries)
    const latSpan = north - south;
    const lngSpan = east - west;
    if (latSpan > 5 || lngSpan > 5) {
      throw new Error(`Bounding box too large: ${latSpan}° lat x ${lngSpan}° lng (max 5° each)`);
    }

    // Round coordinates to 6 decimal places to avoid precision issues
    const bbox = `${south.toFixed(6)},${west.toFixed(6)},${north.toFixed(6)},${east.toFixed(6)}`;
    const statements: string[] = [];

    if (priority === 'primary') {
      // Core types — nodes + ways only (fast, covers 90%+ of campsites)
      if (types.includes('campsite')) {
        statements.push(`node["tourism"="camp_site"](${bbox});`);
        statements.push(`way["tourism"="camp_site"](${bbox});`);
      }
      if (types.includes('caravan_site')) {
        statements.push(`node["tourism"="caravan_site"](${bbox});`);
        statements.push(`way["tourism"="caravan_site"](${bbox});`);
      }
      // Include main aire types in primary for user expectation
      if (types.includes('aire')) {
        statements.push(`node["amenity"="parking"]["motorhome"="yes"](${bbox});`);
        statements.push(`way["amenity"="parking"]["motorhome"="yes"](${bbox});`);
      }
    } else {
      // Niche types — relations, secondary tags (loaded lazily)
      if (types.includes('campsite')) {
        statements.push(`relation["tourism"="camp_site"](${bbox});`);
      }
      if (types.includes('caravan_site')) {
        statements.push(`relation["tourism"="caravan_site"](${bbox});`);
      }
      if (types.includes('aire')) {
        statements.push(`node["amenity"="parking"]["caravan"="yes"](${bbox});`);
        statements.push(`way["amenity"="parking"]["caravan"="yes"](${bbox});`);
        statements.push(`node["tourism"="wilderness_hut"](${bbox});`);
        statements.push(`node["highway"="services"]["motorhome"="yes"](${bbox});`);
        statements.push(`way["highway"="services"]["motorhome"="yes"](${bbox});`);
      }
    }

    if (statements.length === 0) {
      // Fallback: query everything (shouldn't happen normally)
      statements.push(`node["tourism"="camp_site"](${bbox});`);
    }

    // Limit to 1000 results to prevent timeouts
    return `[out:json][timeout:30];(${statements.join('')});out center meta 1000;`;
  }

  /**
   * Fetch secondary/niche campsite types in the background.
   * Results are stored in IndexedDB cache for future use.
   */
  private async fetchSecondaryTypes(
    bounds: BoundingBox,
    types: CampsiteType[],
    request: CampsiteRequest
  ): Promise<void> {
    try {
      const secondaryQuery = this.buildOverpassQuery(bounds, types, 'secondary');
      const context: RequestContext = {
        method: 'POST',
        endpoint: '',
        body: secondaryQuery,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      };

      let response = await this.request<Record<string, unknown> | string>(context);
      if (typeof response === 'string') {
        response = JSON.parse(response) as Record<string, unknown>;
      }

      const campsites = this.parseOverpassResponse(response as OverpassResponse);
      const filtered = this.filterAndScoreCampsites(campsites, request);

      // Store in IndexedDB for future requests
      await this.cacheManager.storeCampsites(filtered);

      // Merge into last loaded data so next overlap check picks them up
      if (this.lastLoadedCampsites.length > 0) {
        this.lastLoadedCampsites = this.deduplicateCampsites([
          ...this.lastLoadedCampsites,
          ...filtered,
        ]);
      }
    } catch {
      // Secondary types are non-critical — silently ignore failures
    }
  }

  /**
   * Parse Overpass API response
   */
  private parseOverpassResponse(response: OverpassResponse): Campsite[] {
    if (!response || !response.elements) {
      return [];
    }

    return response.elements
      .map((element: OverpassElement) => this.parseOSMElement(element))
      .filter(Boolean) as Campsite[];
  }

  /**
   * Parse OpenCampingMap response
   */
  private parseOpenCampingMapResponse(response: OpenCampingMapResponse): Campsite[] {
    if (!response || !response.features) {
      return [];
    }

    return response.features
      .map((feature: OpenCampingMapFeature) => this.parseOpenCampingMapFeature(feature))
      .filter(Boolean) as Campsite[];
  }

  /**
   * Parse OSM element into Campsite object
   */
  private parseOSMElement(element: OverpassElement): Campsite | null {
    // Handle both node elements (lat/lon directly) and way/relation elements (center.lat/center.lon)
    const lat = element.lat ?? element.center?.lat;
    const lon = element.lon ?? element.center?.lon;

    if (!lat || !lon || !element.tags) {
      return null;
    }

    const tags = element.tags;

    // Filter out disused, abandoned, or closed campsites
    if (
      tags.disused === 'yes' ||
      tags.abandoned === 'yes' ||
      tags.demolished === 'yes' ||
      tags['tourism:disused'] === 'yes' ||
      tags.lifecycle_status === 'abandoned' ||
      tags.lifecycle_status === 'disused' ||
      tags.lifecycle_status === 'demolished'
    ) {
      return null;
    }

    const type = this.determineCampsiteType(tags);

    return {
      id: element.id,
      type,
      name: tags.name || tags['name:en'] || `${type} ${element.id}`,
      lat,
      lng: lon,

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
        sanitary_dump_station: this.parseBoolean(tags.sanitary_dump_station),
        waste_disposal: this.parseBoolean(tags.waste_disposal),
        hot_water: this.parseBoolean(tags.hot_water),
        kitchen: this.parseBoolean(tags.kitchen),
        picnic_table: this.parseBoolean(tags.picnic_table),
        bbq: this.parseBoolean(tags.bbq),
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

      // Extended fields
      stars: this.parseNumber(tags.stars),
      description: tags.description || tags['description:en'],
      operator: tags.operator,
      imageUrl: this.resolveImageUrl(tags),
      policies: {
        dogs: tags.dog,
        fires: this.parseBoolean(tags.openfire),
        bbq: this.parseBoolean(tags.bbq),
        nudism: this.parseBoolean(tags.nudism),
      },
      capacityDetails: {
        pitches: this.parseNumber(tags['capacity:pitches']),
        tents: this.parseNumber(tags['capacity:tents']),
        caravans: this.parseNumber(tags['capacity:caravans']),
      },
      powerSupply: tags.power_supply,
      structuredAddress: {
        street: tags['addr:street'],
        city: tags['addr:city'],
        postcode: tags['addr:postcode'],
        country: tags['addr:country'],
      },
      dataCompleteness: this.calculateDataCompleteness(tags),

      source: 'openstreetmap',
      last_updated: Date.now(),
      quality_score: this.calculateQualityScore(tags),
    };
  }

  /**
   * Parse OpenCampingMap feature
   */
  private parseOpenCampingMapFeature(feature: OpenCampingMapFeature): Campsite | null {
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
        sanitary_dump_station: Boolean(props.sanitary_dump_station),
        waste_disposal: Boolean(props.waste_disposal),
        hot_water: Boolean(props.hot_water),
        kitchen: Boolean(props.kitchen),
        picnic_table: Boolean(props.picnic_table),
        bbq: Boolean(props.bbq),
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
      quality_score: 0.8, // Assume good quality for curated data
    };
  }

  /**
   * Determine campsite type from OSM tags
   */
  private determineCampsiteType(tags: Record<string, string>): CampsiteType {
    if (tags.tourism === 'camp_site') return 'campsite';
    if (tags.tourism === 'caravan_site') return 'caravan_site';
    if (tags.amenity === 'parking' && (tags.motorhome === 'yes' || tags.caravan === 'yes'))
      return 'aire';
    if (tags.highway === 'services' && tags.motorhome === 'yes') return 'aire';
    return 'campsite'; // Default
  }

  /**
   * Parse boolean values from OSM tags
   */
  private parseBoolean(value: string | boolean | undefined): boolean {
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
  private parseNumber(value: string | number | undefined): number | undefined {
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
  private calculateQualityScore(tags: Record<string, string>): number {
    let score = 0;
    const checks = [
      tags.name,
      tags.phone || tags.website,
      tags.opening_hours,
      tags.drinking_water,
      tags.electricity,
      tags.toilets || tags.amenity === 'toilets',
      tags.motorhome || tags.caravan,
    ];

    score = checks.filter(Boolean).length / checks.length;
    return Math.round(score * 100) / 100;
  }

  /**
   * Resolve image URL from OSM tags (Wikimedia Commons or direct URL)
   */
  private resolveImageUrl(tags: Record<string, string>): string | undefined {
    const wikiFile = tags.wikimedia_commons || tags['image:wikimedia'];
    if (wikiFile) {
      const filename = wikiFile.replace(/^File:/, '');
      return `https://commons.wikimedia.org/w/thumb.php?f=${encodeURIComponent(filename)}&w=400`;
    }
    if (tags.image && tags.image.startsWith('http')) {
      return tags.image;
    }
    return undefined;
  }

  /**
   * Calculate data completeness tier based on available tags
   */
  private calculateDataCompleteness(
    tags: Record<string, string>
  ): 'minimal' | 'basic' | 'detailed' {
    const hasName = !!tags.name;
    const amenityTags = [
      tags.drinking_water,
      tags.electricity,
      tags.shower,
      tags.toilets,
      tags.wifi,
      tags.internet_access,
      tags.swimming_pool,
      tags.shop,
      tags.restaurant,
      tags.playground,
      tags.laundry,
      tags.sanitary_dump_station,
    ];
    const amenityCount = amenityTags.filter(v => v === 'yes').length;
    const hasContact = !!(tags.phone || tags.website || tags.email);
    const hasHours = !!tags.opening_hours;

    if (hasName && amenityCount >= 3 && hasContact && hasHours) return 'detailed';
    if (hasName && (amenityCount >= 1 || hasContact)) return 'basic';
    return 'minimal';
  }

  /**
   * Filter and score campsites based on request criteria
   */
  private filterAndScoreCampsites(campsites: Campsite[], request: CampsiteRequest): Campsite[] {
    let filtered = campsites;

    // Filter by vehicle compatibility
    if (request.vehicleFilter) {
      filtered = filtered.filter(campsite =>
        this.isVehicleCompatible(campsite, request.vehicleFilter!)
      );
    }

    // Filter by amenities
    if (request.amenities && request.amenities.length > 0) {
      filtered = filtered.filter(campsite => {
        return request.amenities!.some(
          amenity => (campsite.amenities as Record<string, boolean>)[amenity] === true
        );
      });
    }

    // Sort by data completeness tier, then proximity to center
    const centerLat = (request.bounds.north + request.bounds.south) / 2;
    const centerLng = (request.bounds.east + request.bounds.west) / 2;
    const tierOrder: Record<string, number> = { detailed: 0, basic: 1, minimal: 2 };

    return filtered.sort((a, b) => {
      // Primary: data completeness tier
      const tierA = tierOrder[a.dataCompleteness || 'minimal'];
      const tierB = tierOrder[b.dataCompleteness || 'minimal'];
      if (tierA !== tierB) return tierA - tierB;

      // Secondary: proximity to center
      const distanceA = this.calculateDistance(centerLat, centerLng, a.lat, a.lng);
      const distanceB = this.calculateDistance(centerLat, centerLng, b.lat, b.lng);
      return distanceA - distanceB;
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
    if (vehicle.height && campsite.access.max_height && vehicle.height > campsite.access.max_height)
      return false;
    if (vehicle.length && campsite.access.max_length && vehicle.length > campsite.access.max_length)
      return false;
    if (vehicle.weight && campsite.access.max_weight && vehicle.weight > campsite.access.max_weight)
      return false;

    return true;
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Get cached campsites
   */
  private async getCachedCampsites(
    request: CampsiteRequest,
    allowStale = false
  ): Promise<CampsiteResponse | null> {
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
              status: 'success',
              campsites: this.filterAndScoreCampsites(campsites, request),
              metadata: {
                service: metadata.service || 'overpass',
                timestamp: metadata.timestamp,
                query: request,
                results_count: campsites.length,
                cache_hit: true,
                query_duration: 0,
              },
              cached: true,
              boundingBox: request.bounds,
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Cache lookup failed:', error);
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
        bounds: request.bounds,
      });
    } catch (error) {
      console.error('Failed to set cache metadata:', error);
    }
  }

  /**
   * Calculate what fraction of requestBounds is covered by cachedBounds (0 to 1)
   */
  private getOverlapRatio(requestBounds: BoundingBox, cachedBounds: BoundingBox): number {
    const overlapSouth = Math.max(requestBounds.south, cachedBounds.south);
    const overlapNorth = Math.min(requestBounds.north, cachedBounds.north);
    const overlapWest = Math.max(requestBounds.west, cachedBounds.west);
    const overlapEast = Math.min(requestBounds.east, cachedBounds.east);

    if (overlapNorth <= overlapSouth || overlapEast <= overlapWest) return 0;

    const overlapArea = (overlapNorth - overlapSouth) * (overlapEast - overlapWest);
    const requestArea =
      (requestBounds.north - requestBounds.south) * (requestBounds.east - requestBounds.west);

    return requestArea > 0 ? overlapArea / requestArea : 0;
  }

  /**
   * Check if a campsite falls within the given bounds
   */
  private isCampsiteInBounds(campsite: Campsite, bounds: BoundingBox): boolean {
    return (
      campsite.lat >= bounds.south &&
      campsite.lat <= bounds.north &&
      campsite.lng >= bounds.west &&
      campsite.lng <= bounds.east
    );
  }

  /**
   * Compute the gap regions between a request and cached bounds
   */
  private computeGapRegions(requestBounds: BoundingBox, cachedBounds: BoundingBox): BoundingBox[] {
    const gaps: BoundingBox[] = [];
    // North strip
    if (requestBounds.north > cachedBounds.north) {
      gaps.push({
        south: cachedBounds.north,
        north: requestBounds.north,
        west: requestBounds.west,
        east: requestBounds.east,
      });
    }
    // South strip
    if (requestBounds.south < cachedBounds.south) {
      gaps.push({
        south: requestBounds.south,
        north: cachedBounds.south,
        west: requestBounds.west,
        east: requestBounds.east,
      });
    }
    // East strip (within overlapping lat range only)
    if (requestBounds.east > cachedBounds.east) {
      gaps.push({
        south: Math.max(requestBounds.south, cachedBounds.south),
        north: Math.min(requestBounds.north, cachedBounds.north),
        west: cachedBounds.east,
        east: requestBounds.east,
      });
    }
    // West strip (within overlapping lat range only)
    if (requestBounds.west < cachedBounds.west) {
      gaps.push({
        south: Math.max(requestBounds.south, cachedBounds.south),
        north: Math.min(requestBounds.north, cachedBounds.north),
        west: requestBounds.west,
        east: cachedBounds.west,
      });
    }
    // Filter out degenerate regions
    return gaps.filter(g => g.north - g.south > 0.01 && g.east - g.west > 0.01);
  }

  /**
   * Deduplicate campsites by ID
   */
  private deduplicateCampsites(campsites: Campsite[]): Campsite[] {
    const seen = new Set<number>();
    return campsites.filter(c => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }

  /**
   * Prefetch campsites along a route corridor (fire-and-forget).
   * Called during route calculation so data is cached before the campsite layer needs it.
   */
  async prefetchForRoute(geometry: { coordinates: [number, number][] }): Promise<void> {
    let minLat = Infinity,
      maxLat = -Infinity;
    let minLng = Infinity,
      maxLng = -Infinity;

    for (const [lng, lat] of geometry.coordinates) {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    }

    const buffer = 0.1;
    const bounds: BoundingBox = {
      south: minLat - buffer,
      north: maxLat + buffer,
      west: minLng - buffer,
      east: maxLng + buffer,
    };

    const maxSpan = 4.5;
    const tiles: BoundingBox[] = [];
    for (let latStart = bounds.south; latStart < bounds.north; latStart += maxSpan) {
      for (let lngStart = bounds.west; lngStart < bounds.east; lngStart += maxSpan) {
        tiles.push({
          south: latStart,
          north: Math.min(latStart + maxSpan, bounds.north),
          west: lngStart,
          east: Math.min(lngStart + maxSpan, bounds.east),
        });
      }
    }

    await Promise.allSettled(
      tiles.map(tileBounds =>
        this.searchCampsites({
          bounds: tileBounds,
          types: ['campsite', 'caravan_site'],
          maxResults: 1000,
          includeDetails: true,
        })
      )
    );
  }

  /**
   * Generate cache key for campsite request
   */
  private generateCampsiteCacheKey(request: CampsiteRequest): string {
    const { bounds, types = [], amenities = [] } = request;

    // Validate bounds object to prevent undefined access errors
    if (
      !bounds ||
      typeof bounds.south === 'undefined' ||
      typeof bounds.west === 'undefined' ||
      typeof bounds.north === 'undefined' ||
      typeof bounds.east === 'undefined'
    ) {
      return `campsites_invalid_bounds_${Date.now()}_${types.join(',')}_${amenities.join(',')}`;
    }

    // Round to 1 decimal place (~11km grid) so nearby viewports share cache keys
    const round = (v: number) => Math.round(v * 10) / 10;
    return `campsites_${round(bounds.south)}_${round(bounds.west)}_${round(bounds.north)}_${round(bounds.east)}_${types.join(',')}_${amenities.join(',')}`;
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
      console.error('Failed to initialize campsite cache:', error);
    }
  }

  /**
   * Initialize fallback service
   */
  private initializeFallbackService(): void {
    // Fallback handled internally to avoid circular dependencies
    this._fallbackService = undefined;
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
      console.error('Overpass API health check failed:', error);
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
    const rateLimitState = this.rateLimitState.get('default') || {
      count: 0,
      resetTime: Date.now(),
    };

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
  public getCacheStats(): {
    size: number;
    entries: Array<{ key: string; size: number; age: number }>;
  } {
    // This would require additional IndexedDB queries
    // Simplified implementation for now
    return {
      size: 0, // Would count campsites in cache
      entries: [], // Would return cache entries
    };
  }
}

// Export singleton instance
export const campsiteService = new CampsiteService();
