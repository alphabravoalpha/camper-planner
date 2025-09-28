// Campsite Filter Service
// Phase 4.3: Advanced filtering and search logic for campsites

import { Campsite, CampsiteRequest, CampsiteResponse } from './CampsiteService';
import { CampsiteFilterState } from '../components/campsite/CampsiteFilter';
import { RouteGeometry, filterCampsitesByRoute, calculateRouteRelevance, haversineDistance } from '../utils/routeDistance';

export interface EnhancedCampsiteRequest extends CampsiteRequest {
  filterState?: CampsiteFilterState;
  routeGeometry?: RouteGeometry;
  currentLocation?: [number, number]; // [lat, lng]
}

export interface FilteredCampsite extends Campsite {
  routeDistance?: number;
  relevanceScore?: number;
  searchScore?: number;
  distanceFromCenter?: number;
}

export class CampsiteFilterService {
  /**
   * Apply comprehensive filtering to campsites
   */
  static filterCampsites(
    campsites: Campsite[],
    filterState: CampsiteFilterState,
    routeGeometry?: RouteGeometry,
    currentLocation?: [number, number]
  ): FilteredCampsite[] {
    let filtered = campsites.map(campsite => ({ ...campsite } as FilteredCampsite));

    // 1. Type filtering
    filtered = this.filterByTypes(filtered, filterState.visibleTypes);

    // 2. Amenity filtering
    filtered = this.filterByAmenities(filtered, filterState.amenities);

    // 3. Vehicle compatibility filtering
    if (filterState.vehicleCompatibleOnly) {
      filtered = filtered.filter(campsite => campsite.vehicleCompatible);
    }

    // 4. Route-based filtering
    if (filterState.routeOnlyMode && routeGeometry) {
      filtered = filterCampsitesByRoute(
        filtered,
        routeGeometry,
        filterState.maxDistanceFromRoute
      );
    }

    // 5. Advanced filtering
    filtered = this.applyAdvancedFilters(filtered, filterState);

    // 6. Search filtering
    if (filterState.searchQuery.trim() || filterState.searchLocation.trim()) {
      filtered = this.applySearchFilters(filtered, filterState);
    }

    // 7. Calculate relevance scores
    filtered = this.calculateRelevanceScores(
      filtered,
      filterState,
      routeGeometry,
      currentLocation
    );

    // 8. Sort results
    filtered = this.sortCampsites(filtered, filterState.sortBy);

    // 9. Limit results
    return filtered.slice(0, filterState.maxResults);
  }

  /**
   * Filter by campsite types
   */
  private static filterByTypes(
    campsites: FilteredCampsite[],
    visibleTypes: string[]
  ): FilteredCampsite[] {
    if (visibleTypes.length === 0) return [];
    return campsites.filter(campsite => visibleTypes.includes(campsite.type));
  }

  /**
   * Filter by required amenities (AND logic)
   */
  private static filterByAmenities(
    campsites: FilteredCampsite[],
    requiredAmenities: CampsiteFilterState['amenities']
  ): FilteredCampsite[] {
    const activeAmenities = Object.entries(requiredAmenities)
      .filter(([_, required]) => required)
      .map(([amenity]) => amenity);

    if (activeAmenities.length === 0) return campsites;

    return campsites.filter(campsite => {
      if (!campsite.amenities) return false;

      return activeAmenities.every(amenity => {
        // Map filter amenity names to campsite amenity names
        const campsiteAmenityKey = this.mapAmenityKey(amenity);
        return campsite.amenities[campsiteAmenityKey] === true;
      });
    });
  }

  /**
   * Map filter amenity keys to campsite amenity keys
   */
  private static mapAmenityKey(filterKey: string): string {
    const mapping: Record<string, string> = {
      'electricity': 'electricity',
      'wifi': 'wifi',
      'shower': 'shower',
      'toilets': 'toilets',
      'drinking_water': 'drinking_water',
      'waste_disposal': 'waste_disposal',
      'laundry': 'laundry',
      'restaurant': 'restaurant',
      'shop': 'shop',
      'playground': 'playground',
      'swimming_pool': 'swimming_pool',
      'pet_allowed': 'pet_allowed'
    };

    return mapping[filterKey] || filterKey;
  }

  /**
   * Apply advanced filters
   */
  private static applyAdvancedFilters(
    campsites: FilteredCampsite[],
    filterState: CampsiteFilterState
  ): FilteredCampsite[] {
    let filtered = campsites;

    // Filter by opening hours
    if (filterState.openNow) {
      filtered = filtered.filter(campsite => this.isOpenNow(campsite));
    }

    // Filter by fees
    if (filterState.freeOnly) {
      filtered = filtered.filter(campsite => this.isFree(campsite));
    }

    // Filter by reservations
    if (filterState.acceptsReservations) {
      filtered = filtered.filter(campsite => this.acceptsReservations(campsite));
    }

    return filtered;
  }

  /**
   * Check if campsite is currently open
   */
  private static isOpenNow(campsite: Campsite): boolean {
    if (!campsite.openingHours) return true; // Assume open if no hours specified

    // Basic opening hours parsing
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // This is a simplified implementation
    // In a real app, you'd want a more robust opening hours parser
    const openingHours = campsite.openingHours.toLowerCase();

    // Check for common patterns
    if (openingHours.includes('24/7') || openingHours.includes('always open')) {
      return true;
    }

    if (openingHours.includes('closed')) {
      return false;
    }

    // Default to open if we can't parse the hours
    return true;
  }

  /**
   * Check if campsite is free
   */
  private static isFree(campsite: Campsite): boolean {
    // Check various indicators that the campsite might be free
    const name = campsite.name?.toLowerCase() || '';
    const amenities = campsite.amenities || {};

    // Look for keywords indicating free camping
    if (name.includes('free') || name.includes('wild') || name.includes('aire')) {
      return true;
    }

    // Aires are often free or low cost
    if (campsite.type === 'aire') {
      return true;
    }

    // If no fee information is available, exclude from free-only filter
    return false;
  }

  /**
   * Check if campsite accepts reservations
   */
  private static acceptsReservations(campsite: Campsite): boolean {
    // Check if campsite has booking capabilities
    const website = campsite.website?.toLowerCase() || '';
    const phone = campsite.phone || '';

    // Has contact information for bookings
    if (website.includes('booking') || website.includes('reservation') || phone) {
      return true;
    }

    // Traditional campsites usually accept reservations
    if (campsite.type === 'campsite' || campsite.type === 'caravan_site') {
      return true;
    }

    return false;
  }

  /**
   * Apply search filters
   */
  private static applySearchFilters(
    campsites: FilteredCampsite[],
    filterState: CampsiteFilterState
  ): FilteredCampsite[] {
    const nameQuery = filterState.searchQuery.toLowerCase().trim();
    const locationQuery = filterState.searchLocation.toLowerCase().trim();

    if (!nameQuery && !locationQuery) return campsites;

    return campsites.filter(campsite => {
      let matches = true;

      // Name search
      if (nameQuery) {
        const name = campsite.name?.toLowerCase() || '';
        const type = campsite.type.toLowerCase();
        const amenityKeys = Object.keys(campsite.amenities || {}).join(' ').toLowerCase();

        matches = matches && (
          name.includes(nameQuery) ||
          type.includes(nameQuery) ||
          amenityKeys.includes(nameQuery)
        );
      }

      // Location search
      if (locationQuery && matches) {
        const address = campsite.address?.toLowerCase() || '';
        matches = matches && address.includes(locationQuery);
      }

      return matches;
    }).map(campsite => ({
      ...campsite,
      searchScore: this.calculateSearchScore(campsite, nameQuery, locationQuery)
    }));
  }

  /**
   * Calculate search relevance score
   */
  private static calculateSearchScore(
    campsite: Campsite,
    nameQuery: string,
    locationQuery: string
  ): number {
    let score = 0;

    if (nameQuery) {
      const name = campsite.name?.toLowerCase() || '';

      if (name === nameQuery) score += 100;
      else if (name.startsWith(nameQuery)) score += 80;
      else if (name.includes(nameQuery)) score += 60;

      // Type match
      if (campsite.type.toLowerCase().includes(nameQuery)) score += 40;
    }

    if (locationQuery) {
      const address = campsite.address?.toLowerCase() || '';

      if (address.includes(locationQuery)) score += 50;
    }

    return score;
  }

  /**
   * Calculate relevance scores for sorting
   */
  private static calculateRelevanceScores(
    campsites: FilteredCampsite[],
    filterState: CampsiteFilterState,
    routeGeometry?: RouteGeometry,
    currentLocation?: [number, number]
  ): FilteredCampsite[] {
    return campsites.map(campsite => {
      let relevanceScore = 0;

      // Route proximity score
      if (routeGeometry) {
        relevanceScore += calculateRouteRelevance(campsite, routeGeometry, true);
      }

      // Search score
      if (campsite.searchScore) {
        relevanceScore += campsite.searchScore;
      }

      // Vehicle compatibility bonus
      if (campsite.vehicleCompatible) {
        relevanceScore += 20;
      }

      // Amenity richness score
      const amenityCount = Object.values(campsite.amenities || {}).filter(Boolean).length;
      relevanceScore += Math.min(amenityCount * 5, 50);

      // Calculate distance from center (map center or current location)
      if (currentLocation) {
        const distance = haversineDistance(
          currentLocation[0], currentLocation[1],
          campsite.location.lat, campsite.location.lng
        );
        campsite.distanceFromCenter = distance;
      }

      return {
        ...campsite,
        relevanceScore
      };
    });
  }

  /**
   * Sort campsites by specified criteria
   */
  private static sortCampsites(
    campsites: FilteredCampsite[],
    sortBy: CampsiteFilterState['sortBy']
  ): FilteredCampsite[] {
    return [...campsites].sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          const aDistance = a.routeDistance ?? a.distanceFromCenter ?? 0;
          const bDistance = b.routeDistance ?? b.distanceFromCenter ?? 0;
          return aDistance - bDistance;

        case 'name':
          const aName = a.name || a.type;
          const bName = b.name || b.type;
          return aName.localeCompare(bName);

        case 'rating':
          // Placeholder for future rating system
          return (b.relevanceScore || 0) - (a.relevanceScore || 0);

        case 'relevance':
        default:
          return (b.relevanceScore || 0) - (a.relevanceScore || 0);
      }
    });
  }

  /**
   * Generate search suggestions based on input
   */
  static generateSearchSuggestions(
    query: string,
    campsites: Campsite[],
    maxSuggestions: number = 10
  ): string[] {
    const queryLower = query.toLowerCase().trim();
    if (!queryLower || queryLower.length < 2) return [];

    const suggestions = new Set<string>();

    campsites.forEach(campsite => {
      // Name suggestions
      if (campsite.name && campsite.name.toLowerCase().includes(queryLower)) {
        suggestions.add(campsite.name);
      }

      // Location suggestions
      if (campsite.address && campsite.address.toLowerCase().includes(queryLower)) {
        // Extract city/region from address
        const addressParts = campsite.address.split(',').map(part => part.trim());
        addressParts.forEach(part => {
          if (part.toLowerCase().includes(queryLower)) {
            suggestions.add(part);
          }
        });
      }

      // Type suggestions
      const typeLabel = campsite.type.replace('_', ' ');
      if (typeLabel.toLowerCase().includes(queryLower)) {
        suggestions.add(typeLabel);
      }
    });

    return Array.from(suggestions)
      .filter(suggestion => suggestion.toLowerCase().startsWith(queryLower))
      .slice(0, maxSuggestions)
      .sort();
  }
}