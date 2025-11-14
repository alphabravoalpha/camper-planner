// Routing Service Implementation
// Phase 3.2: OpenRouteService integration with fallback to OSRM

import { DataService } from './DataService';
import type { DataServiceConfig, RequestContext } from './DataService';
import type { VehicleProfile, Waypoint } from '../types';
import { APIConfig } from '../config/api';

export interface RouteRequest {
  waypoints: Waypoint[];
  vehicleProfile?: VehicleProfile;
  options?: RouteOptions;
}

export interface RouteOptions {
  profile?: 'driving-hgv' | 'driving-car';
  optimize?: boolean;
  avoidFeatures?: string[];
  units?: 'km' | 'mi';
  geometry?: boolean;
  instructions?: boolean;
  elevation?: boolean;
  alternative_routes?: boolean;
}

export interface RouteResponse {
  id: string;
  status: 'success' | 'error' | 'partial';
  routes: RouteData[];
  metadata: RouteMetadata;
  warnings?: string[];
  errors?: string[];
  restrictions?: RouteRestrictions;
  alternativeRoutes?: RouteData[];
}

export interface RouteRestrictions {
  violatedDimensions: string[];
  restrictedSegments: RestrictedSegment[];
  cannotAccommodate: boolean;
  suggestedActions: string[];
}

export interface RestrictedSegment {
  coordinates: [number, number][];
  restriction: 'height' | 'width' | 'weight' | 'length' | 'access';
  limit: number;
  vehicleValue: number;
  severity: 'warning' | 'error';
}

export interface RouteData {
  geometry: {
    coordinates: [number, number][];
    type: 'LineString';
  };
  summary: {
    distance: number; // meters
    duration: number; // seconds
  };
  segments: RouteSegment[];
  waypoints: number[]; // indices in geometry.coordinates
}

export interface RouteSegment {
  distance: number;
  duration: number;
  steps?: RouteStep[];
}

export interface RouteStep {
  distance: number;
  duration: number;
  instruction: string;
  name?: string;
  wayPoints: [number, number];
}

export interface RouteMetadata {
  service: 'openrouteservice' | 'osrm';
  profile: string;
  timestamp: number;
  query: RouteRequest;
  attribution: string;
}

// Error types for routing
export class RoutingError extends Error {
  constructor(
    message: string,
    public code: string,
    public service: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'RoutingError';
  }
}

export class RoutingService extends DataService {
  constructor() {
    // OpenRouteService configuration
    const config: DataServiceConfig = {
      baseUrl: APIConfig.routing.endpoints.openrouteservice,
      timeout: 15000, // 15 seconds for routing
      retries: 2,
      cacheEnabled: true,
      cacheTtl: 3600000, // 1 hour cache
      userAgent: 'EuropeanCamperPlanner/1.0',
      apiKey: process.env.REACT_APP_ORS_API_KEY,
    };

    // Rate limiting: 2000 requests per day (OpenRouteService free tier)
    const rateLimit = {
      requests: 2000,
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      enabled: true,
    };

    super(config, rateLimit);

    // Initialize OSRM fallback service if needed
    this.initializeFallbackService();
  }

  /**
   * Calculate route between waypoints
   */
  async calculateRoute(request: RouteRequest): Promise<RouteResponse> {
    try {
      // Validate request
      this.validateRouteRequest(request);

      // Check vehicle restrictions before attempting routing
      const vehicleRestrictions = request.vehicleProfile
        ? this.validateVehicleRestrictions(request.vehicleProfile)
        : null;

      // If vehicle cannot be accommodated at all, provide guidance
      if (vehicleRestrictions?.cannotAccommodate) {
        return {
          id: `restriction_blocked_${Date.now()}`,
          status: 'error',
          routes: [],
          metadata: {
            service: 'openrouteservice' as const,
            profile: this.determineProfile(request.vehicleProfile, request.options?.profile),
            timestamp: Date.now(),
            query: request,
            attribution: 'Vehicle restriction validation',
          },
          errors: ['Vehicle dimensions exceed EU road limits'],
          restrictions: vehicleRestrictions,
        };
      }

      // Try primary service (OpenRouteService) with alternative routes and elevation
      const enhancedRequest = {
        ...request,
        options: {
          ...request.options,
          alternative_routes: true,
          elevation: true, // Request elevation data for profile display
          geometry: true,
          instructions: true
        }
      };

      const result = await this.calculateRouteWithORS(enhancedRequest);

      // Add any pre-calculated restrictions to the result
      if (vehicleRestrictions) {
        result.restrictions = vehicleRestrictions;
        result.warnings = [
          ...(result.warnings || []),
          ...vehicleRestrictions.suggestedActions
        ];
      }

      return result;
    } catch (error) {
      console.warn('OpenRouteService failed, trying fallback:', error);

      // Try fallback service (OSRM) but warn about lack of vehicle restrictions
      try {
        const fallbackResult = await this.calculateRouteWithOSRM(request);
        const warnings = ['Primary routing service unavailable, using fallback'];

        if (request.vehicleProfile) {
          warnings.push('⚠️ Vehicle restrictions not supported by fallback service');
          warnings.push('Route may include roads unsuitable for your vehicle');
        }

        return {
          ...fallbackResult,
          warnings,
        };
      } catch (fallbackError) {
        console.error('Fallback routing service also failed:', fallbackError);

        // Both services failed
        throw new RoutingError(
          'All routing services are currently unavailable',
          'SERVICE_UNAVAILABLE',
          'all',
          false
        );
      }
    }
  }

  /**
   * Calculate route using OpenRouteService
   */
  private async calculateRouteWithORS(request: RouteRequest): Promise<RouteResponse> {
    const { waypoints, vehicleProfile, options = {} } = request;

    // Build coordinates array for ORS
    const coordinates = waypoints.map(wp => [wp.lng, wp.lat]);

    // Determine profile based on vehicle
    const profile = this.determineProfile(vehicleProfile, options.profile);

    // Build request parameters
    const params: Record<string, any> = {
      coordinates: coordinates,
      format: 'geojson',
      geometry: options.geometry !== false,
      instructions: options.instructions !== false,
      elevation: options.elevation || false,
    };

    // Add vehicle restrictions if profile is available (following API spec format)
    if (vehicleProfile) {
      params.height = vehicleProfile.height;      // meters
      params.width = vehicleProfile.width;        // meters
      params.weight = vehicleProfile.weight;      // tonnes
      params.length = vehicleProfile.length;      // meters
      params.axleload = Math.round(vehicleProfile.weight / 2 * 10) / 10; // estimated axle load
      params.hazmat = false;                      // not carrying hazardous materials
      params.surface_type = 'any';                // road surface requirements
    }

    // Request alternative routes for better restriction handling
    if (options.alternative_routes !== false) {
      params.alternative_routes = {
        target_count: 2,
        weight_factor: 1.4,
        share_factor: 0.6
      };
    }

    // Add avoid features
    if (options.avoidFeatures && options.avoidFeatures.length > 0) {
      params.avoid_features = options.avoidFeatures;
    }

    // Make the request
    const context: RequestContext = {
      method: 'POST',
      endpoint: `/directions/${profile}/geojson`,
      body: params,
      headers: {
        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
      },
    };

    const response = await this.request<any>(context);

    // Transform ORS response to our format
    return this.transformORSResponse(response, request);
  }

  /**
   * Calculate route using OSRM (fallback)
   */
  private async calculateRouteWithOSRM(request: RouteRequest): Promise<RouteResponse> {
    const { waypoints } = request;

    // Build coordinates string for OSRM
    const coordinates = waypoints.map(wp => `${wp.lng},${wp.lat}`).join(';');

    // OSRM parameters
    const params = {
      overview: 'full',
      geometries: 'geojson',
      steps: 'true',
      annotations: 'true',
    };

    // Make the request to OSRM
    const context: RequestContext = {
      method: 'GET',
      endpoint: `/route/v1/driving/${coordinates}`,
      params,
    };

    // Use a separate config for OSRM
    const osrmConfig: DataServiceConfig = {
      baseUrl: APIConfig.routing.endpoints.osrm,
      timeout: 10000,
      retries: 1,
      cacheEnabled: true,
      cacheTtl: 1800000, // 30 minutes cache for fallback
      userAgent: 'EuropeanCamperPlanner/1.0',
    };

    // Temporarily override config for OSRM request
    const originalConfig = this.config;
    (this as any).config = osrmConfig;

    try {
      const response = await this.request<any>(context);
      return this.transformOSRMResponse(response, request);
    } finally {
      // Restore original config
      (this as any).config = originalConfig;
    }
  }

  /**
   * Validate vehicle profile restrictions
   */
  private validateVehicleRestrictions(vehicleProfile: VehicleProfile): RouteRestrictions | null {
    const restrictions: RouteRestrictions = {
      violatedDimensions: [],
      restrictedSegments: [],
      cannotAccommodate: false,
      suggestedActions: []
    };

    // EU standard limits for general roads
    const euLimits = {
      height: 4.0,    // meters
      width: 2.55,    // meters
      weight: 40,     // tonnes (articulated trucks)
      length: 18.75   // meters (articulated trucks)
    };

    // Check vehicle dimensions against EU limits
    if (vehicleProfile.height > euLimits.height) {
      restrictions.violatedDimensions.push('height');
      restrictions.suggestedActions.push(`Vehicle height ${vehicleProfile.height}m exceeds EU limit of ${euLimits.height}m`);
    }

    if (vehicleProfile.width > euLimits.width) {
      restrictions.violatedDimensions.push('width');
      restrictions.suggestedActions.push(`Vehicle width ${vehicleProfile.width}m exceeds EU limit of ${euLimits.width}m`);
    }

    if (vehicleProfile.weight > euLimits.weight) {
      restrictions.violatedDimensions.push('weight');
      restrictions.suggestedActions.push(`Vehicle weight ${vehicleProfile.weight}t exceeds EU limit of ${euLimits.weight}t`);
    }

    if (vehicleProfile.length > euLimits.length) {
      restrictions.violatedDimensions.push('length');
      restrictions.suggestedActions.push(`Vehicle length ${vehicleProfile.length}m exceeds EU limit of ${euLimits.length}m`);
    }

    // Determine if vehicle can be accommodated at all
    restrictions.cannotAccommodate = restrictions.violatedDimensions.length > 0;

    return restrictions.violatedDimensions.length > 0 ? restrictions : null;
  }

  /**
   * Validate route request
   */
  private validateRouteRequest(request: RouteRequest): void {
    const { waypoints, vehicleProfile } = request;

    if (!waypoints || waypoints.length < 2) {
      throw new RoutingError('At least 2 waypoints are required', 'INVALID_WAYPOINTS', 'validation', false);
    }

    if (waypoints.length > 50) {
      throw new RoutingError('Maximum 50 waypoints allowed', 'TOO_MANY_WAYPOINTS', 'validation', false);
    }

    // Validate coordinates
    for (const wp of waypoints) {
      if (wp.lat < -90 || wp.lat > 90 || wp.lng < -180 || wp.lng > 180) {
        throw new RoutingError(
          `Invalid coordinates: ${wp.lat}, ${wp.lng}`,
          'INVALID_COORDINATES',
          'validation',
          false
        );
      }
    }

    // Validate vehicle profile if provided
    if (vehicleProfile) {
      if (vehicleProfile.height <= 0 || vehicleProfile.height > 4.5) {
        throw new RoutingError('Vehicle height must be between 0 and 4.5 meters', 'INVALID_VEHICLE', 'validation', false);
      }
      if (vehicleProfile.width <= 0 || vehicleProfile.width > 3.0) {
        throw new RoutingError('Vehicle width must be between 0 and 3.0 meters', 'INVALID_VEHICLE', 'validation', false);
      }
      if (vehicleProfile.weight <= 0 || vehicleProfile.weight > 40) {
        throw new RoutingError('Vehicle weight must be between 0 and 40 tonnes', 'INVALID_VEHICLE', 'validation', false);
      }
      if (vehicleProfile.length <= 0 || vehicleProfile.length > 20) {
        throw new RoutingError('Vehicle length must be between 0 and 20 meters', 'INVALID_VEHICLE', 'validation', false);
      }
    }
  }

  /**
   * Determine routing profile based on vehicle and options
   */
  private determineProfile(vehicleProfile?: VehicleProfile, requestedProfile?: string): string {
    if (requestedProfile) {
      return requestedProfile;
    }

    if (!vehicleProfile) {
      return 'driving-car';
    }

    // Use HGV profile for larger vehicles
    if (
      vehicleProfile.height > 2.5 ||
      vehicleProfile.width > 2.2 ||
      vehicleProfile.weight > 3.5 ||
      vehicleProfile.length > 7.0
    ) {
      return 'driving-hgv';
    }

    return 'driving-car';
  }

  /**
   * Transform OpenRouteService response to our format
   */
  private transformORSResponse(orsResponse: any, request: RouteRequest): RouteResponse {
    const features = orsResponse.features || [];
    if (features.length === 0) {
      throw new RoutingError('No route found', 'NO_ROUTE', 'openrouteservice', true);
    }

    // Process main route
    const mainFeature = features[0];
    const routeData: RouteData = {
      geometry: mainFeature.geometry,
      summary: {
        distance: mainFeature.properties.summary.distance,
        duration: mainFeature.properties.summary.duration,
      },
      segments: mainFeature.properties.segments || [],
      waypoints: mainFeature.properties.way_points || [],
    };

    // Process alternative routes if available
    const alternativeRoutes: RouteData[] = features.slice(1).map((feature: any) => ({
      geometry: feature.geometry,
      summary: {
        distance: feature.properties.summary.distance,
        duration: feature.properties.summary.duration,
      },
      segments: feature.properties.segments || [],
      waypoints: feature.properties.way_points || [],
    }));

    // Analyze response for potential restrictions
    const warnings: string[] = [];
    if (request.vehicleProfile && routeData.summary.distance === 0) {
      warnings.push('Route calculation returned empty result - vehicle may not fit on available roads');
    }

    // Check if alternative routes were significantly different (indicating restrictions)
    if (alternativeRoutes.length > 0) {
      const mainDistance = routeData.summary.distance;
      const shortestAlt = Math.min(...alternativeRoutes.map(r => r.summary.distance));

      if (shortestAlt > mainDistance * 1.5) {
        warnings.push('Alternative routes are significantly longer - possible vehicle restrictions on main route');
      }
    }

    return {
      id: `ors_${Date.now()}`,
      status: 'success',
      routes: [routeData],
      alternativeRoutes,
      metadata: {
        service: 'openrouteservice',
        profile: this.determineProfile(request.vehicleProfile, request.options?.profile),
        timestamp: Date.now(),
        query: request,
        attribution: 'openrouteservice.org | OpenStreetMap contributors',
      },
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Transform OSRM response to our format
   */
  private transformOSRMResponse(osrmResponse: any, request: RouteRequest): RouteResponse {
    const route = osrmResponse.routes[0];
    if (!route) {
      throw new RoutingError('No route found', 'NO_ROUTE', 'osrm', true);
    }

    const routeData: RouteData = {
      geometry: route.geometry,
      summary: {
        distance: route.distance,
        duration: route.duration,
      },
      segments: route.legs || [],
      waypoints: osrmResponse.waypoints?.map((_: any, index: number) => index) || [],
    };

    return {
      id: `osrm_${Date.now()}`,
      status: 'success',
      routes: [routeData],
      metadata: {
        service: 'osrm',
        profile: 'driving',
        timestamp: Date.now(),
        query: request,
        attribution: 'OpenStreetMap contributors | OSRM',
      },
      warnings: ['Using fallback routing service (vehicle restrictions not supported)'],
    };
  }

  /**
   * Initialize fallback routing service
   */
  private initializeFallbackService(): void {
    // Note: For simplicity, we'll handle OSRM within this service
    // In a more complex setup, we could create a separate OSRMService
    this.fallbackService = null; // Handled internally
  }

  /**
   * Health check for OpenRouteService
   */
  async healthCheck(): Promise<boolean> {
    try {
      const context: RequestContext = {
        method: 'GET',
        endpoint: '/health',
        skipCache: true,
        customTimeout: 5000,
      };

      await this.request(context);
      return true;
    } catch (error) {
      console.warn('OpenRouteService health check failed:', error);
      return false;
    }
  }

  /**
   * Get service status and statistics
   */
  getServiceStatus(): {
    primary: { name: string; healthy: boolean; cacheSize: number };
    fallback: { name: string; available: boolean };
    rateLimitInfo: { remaining: number; resetTime: number };
  } {
    const rateLimitState = this.rateLimitState.get('default') || { count: 0, resetTime: Date.now() };

    return {
      primary: {
        name: 'OpenRouteService',
        healthy: true, // Would need actual health check
        cacheSize: this.cache.size,
      },
      fallback: {
        name: 'OSRM',
        available: true,
      },
      rateLimitInfo: {
        remaining: Math.max(0, this.rateLimit.requests - rateLimitState.count),
        resetTime: rateLimitState.resetTime,
      },
    };
  }
}

// Export singleton instance
export const routingService = new RoutingService();