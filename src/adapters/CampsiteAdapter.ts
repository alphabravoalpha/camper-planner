/**
 * Campsite Data Adapter
 * Transforms CampsiteService data format to UI component format
 * Phase 4.2: Bridge between service layer and presentation layer
 */

import type { Campsite as ServiceCampsite, CampsiteResponse as ServiceResponse } from '../services/CampsiteService';
import type { VehicleProfile } from '../types';

/**
 * UI-friendly campsite format for components
 */
export interface UICampsite extends Omit<ServiceCampsite, 'lat' | 'lng' | 'opening_hours' | 'contact' | 'access'> {
  // Location as nested object for easier component access
  location: {
    lat: number;
    lng: number;
  };

  // Flatten contact info
  phone?: string;
  website?: string;
  email?: string;

  // Rename for consistency
  openingHours?: string;
  address?: string; // Derived from reverse geocoding or left empty

  // Vehicle compatibility (calculated based on vehicle profile)
  vehicleCompatible: boolean;

  // Flattened restrictions for easier UI access
  restrictions?: {
    maxHeight?: number;
    maxLength?: number;
    maxWeight?: number;
  };

  // Keep access info
  access: {
    motorhome: boolean;
    caravan: boolean;
    tent: boolean;
    max_height?: number;
    max_length?: number;
    max_weight?: number;
  };

  // OSM ID for reference
  osmId?: number;
}

/**
 * UI-friendly response format
 */
export interface UICampsiteResponse {
  campsites: UICampsite[];
  metadata: {
    service: 'overpass' | 'opencampingmap';
    timestamp: number;
    results_count: number;
    cache_hit: boolean;
    query_duration: number;
  };
  status: 'success' | 'error';
  error?: string;
  cached: boolean;
  boundingBox?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

/**
 * Campsite Adapter Class
 */
export class CampsiteAdapter {
  /**
   * Transform service campsite to UI campsite
   */
  static toUICampsite(
    serviceCampsite: ServiceCampsite,
    vehicleProfile?: VehicleProfile | null
  ): UICampsite {
    // Calculate vehicle compatibility
    const vehicleCompatible = vehicleProfile
      ? this.checkVehicleCompatibility(serviceCampsite, vehicleProfile)
      : true; // Default to compatible if no profile set

    // Extract restrictions if any
    const restrictions = (serviceCampsite.access.max_height ||
      serviceCampsite.access.max_length ||
      serviceCampsite.access.max_weight)
      ? {
          maxHeight: serviceCampsite.access.max_height,
          maxLength: serviceCampsite.access.max_length,
          maxWeight: serviceCampsite.access.max_weight,
        }
      : undefined;

    return {
      ...serviceCampsite,
      location: {
        lat: serviceCampsite.lat,
        lng: serviceCampsite.lng,
      },
      phone: serviceCampsite.contact.phone,
      website: serviceCampsite.contact.website,
      email: serviceCampsite.contact.email,
      openingHours: serviceCampsite.opening_hours,
      address: undefined, // Could be populated via reverse geocoding
      vehicleCompatible,
      restrictions,
      osmId: serviceCampsite.id,
    };
  }

  /**
   * Transform service response to UI response
   */
  static toUIResponse(
    serviceResponse: ServiceResponse,
    vehicleProfile?: VehicleProfile | null
  ): UICampsiteResponse {
    return {
      campsites: serviceResponse.campsites.map(campsite =>
        this.toUICampsite(campsite, vehicleProfile)
      ),
      metadata: {
        service: serviceResponse.metadata.service,
        timestamp: serviceResponse.metadata.timestamp,
        results_count: serviceResponse.metadata.results_count,
        cache_hit: serviceResponse.metadata.cache_hit,
        query_duration: serviceResponse.metadata.query_duration,
      },
      status: 'success',
      cached: serviceResponse.cached,
      boundingBox: serviceResponse.boundingBox,
    };
  }

  /**
   * Check if campsite is compatible with vehicle profile
   */
  private static checkVehicleCompatibility(
    campsite: ServiceCampsite,
    profile: VehicleProfile
  ): boolean {
    // If campsite has no restrictions, it's compatible
    if (!campsite.access.max_height &&
        !campsite.access.max_length &&
        !campsite.access.max_weight) {
      // But check if vehicle type is allowed
      if (profile.type === 'motorhome' && !campsite.access.motorhome) return false;
      if (profile.type === 'caravan' && !campsite.access.caravan) return false;
      return true;
    }

    // Check vehicle type access
    if (profile.type === 'motorhome' && !campsite.access.motorhome) return false;
    if (profile.type === 'caravan' && !campsite.access.caravan) return false;

    // Check dimensional restrictions
    if (campsite.access.max_height && profile.height > campsite.access.max_height) return false;
    if (campsite.access.max_length && profile.length > campsite.access.max_length) return false;
    if (campsite.access.max_weight && profile.weight > campsite.access.max_weight) return false;

    return true;
  }

  /**
   * Create error response
   */
  static createErrorResponse(error: string): UICampsiteResponse {
    return {
      campsites: [],
      metadata: {
        service: 'overpass',
        timestamp: Date.now(),
        results_count: 0,
        cache_hit: false,
        query_duration: 0,
      },
      status: 'error',
      error,
      cached: false,
    };
  }

  /**
   * Filter campsites by various criteria (for UI layer)
   */
  static filterCampsites(
    campsites: UICampsite[],
    filters: {
      types?: string[];
      vehicleCompatibleOnly?: boolean;
      amenities?: string[];
      searchQuery?: string;
    }
  ): UICampsite[] {
    let filtered = campsites;

    // Filter by type
    if (filters.types && filters.types.length > 0) {
      filtered = filtered.filter(c => filters.types!.includes(c.type));
    }

    // Filter by vehicle compatibility
    if (filters.vehicleCompatibleOnly) {
      filtered = filtered.filter(c => c.vehicleCompatible);
    }

    // Filter by amenities (campsite must have at least one)
    if (filters.amenities && filters.amenities.length > 0) {
      filtered = filtered.filter(c =>
        filters.amenities!.some(amenity =>
          (c.amenities as any)[amenity] === true
        )
      );
    }

    // Filter by search query
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.name?.toLowerCase().includes(query) ||
        c.address?.toLowerCase().includes(query) ||
        c.type.toLowerCase().includes(query)
      );
    }

    return filtered;
  }
}

/**
 * Export singleton adapter instance
 */
export const campsiteAdapter = CampsiteAdapter;
