// Campsite-Aware Route Optimization Service
// Phase 5.1: Integration of campsite stops with route optimization

import { routeOptimizationService } from './RouteOptimizationService';
import type { OptimizationCriteria, OptimizationResult } from './RouteOptimizationService';
import { campsiteService } from './CampsiteService';
import type { Campsite } from './CampsiteService';
import type { Waypoint, VehicleProfile } from '../types';

export interface CampsiteOptimizationRequest {
  waypoints: Waypoint[];
  criteria: OptimizationCriteria;
  campsiteRequirements?: {
    maxDistanceFromRoute: number; // km
    requiredAmenities?: string[];
    preferredTypes?: string[];
    vehicleCompatibleOnly: boolean;
    maxStopsPerDay: number;
    preferredStopDuration: number; // hours
  };
  suggestCampsites: boolean;
  replaceExistingCampsites: boolean;
}

export interface CampsiteOptimizationResult extends OptimizationResult {
  campsiteIntegration: {
    suggestedCampsites: Array<{
      campsite: Campsite;
      insertPosition: number;
      routeImpact: {
        distanceAdded: number;
        timeAdded: number;
        suitabilityScore: number;
      };
    }>;
    replacedWaypoints: Array<{
      originalWaypoint: Waypoint;
      newCampsite: Campsite;
      improvement: number;
    }>;
    totalCampsiteStops: number;
  };
}

export class CampsiteOptimizationService {
  /**
   * Optimize route with intelligent campsite integration
   */
  static async optimizeWithCampsites(
    request: CampsiteOptimizationRequest
  ): Promise<CampsiteOptimizationResult> {
    let workingWaypoints = [...request.waypoints];

    // Step 1: Replace poor campsite choices if requested
    if (request.replaceExistingCampsites) {
      workingWaypoints = await this.replacePoorCampsiteChoices(
        workingWaypoints,
        request.campsiteRequirements,
        request.criteria.vehicleProfile
      );
    }

    // Step 2: Suggest additional campsites if requested
    let suggestedCampsites: Array<{
      campsite: Campsite;
      insertPosition: number;
      routeImpact: { distanceAdded: number; timeAdded: number; suitabilityScore: number };
    }> = [];

    if (request.suggestCampsites && request.campsiteRequirements) {
      suggestedCampsites = await this.suggestOptimalCampsites(
        workingWaypoints,
        request.campsiteRequirements,
        request.criteria.vehicleProfile
      );
    }

    // Step 3: Perform standard route optimization
    const standardResult = await routeOptimizationService.optimizeRoute(
      workingWaypoints,
      request.criteria
    );

    // Step 4: Build extended result
    return {
      ...standardResult,
      campsiteIntegration: {
        suggestedCampsites,
        replacedWaypoints: [], // Would be populated in step 1
        totalCampsiteStops: workingWaypoints.filter(w => w.id.startsWith('campsite_')).length
      }
    };
  }

  /**
   * Suggest optimal campsites along the route
   */
  private static async suggestOptimalCampsites(
    waypoints: Waypoint[],
    requirements: NonNullable<CampsiteOptimizationRequest['campsiteRequirements']>,
    vehicleProfile?: VehicleProfile
  ): Promise<Array<{
    campsite: Campsite;
    insertPosition: number;
    routeImpact: { distanceAdded: number; timeAdded: number; suitabilityScore: number };
  }>> {
    if (waypoints.length < 2) return [];

    const suggestions: Array<{
      campsite: Campsite;
      insertPosition: number;
      routeImpact: { distanceAdded: number; timeAdded: number; suitabilityScore: number };
    }> = [];

    // Calculate segments that need campsite stops
    const segments = this.identifyLongSegments(waypoints, requirements.maxStopsPerDay);

    for (const segment of segments) {
      try {
        // Find campsites along this segment
        const segmentCampsites = await this.findCampsitesAlongSegment(
          waypoints[segment.startIndex],
          waypoints[segment.endIndex],
          requirements,
          vehicleProfile
        );

        if (segmentCampsites.length > 0) {
          // Find the best campsite for this segment
          const bestCampsite = segmentCampsites[0]; // Already sorted by suitability

          // Calculate optimal insertion position
          const insertionResult = await routeOptimizationService.findOptimalInsertion(
            waypoints,
            {
              id: `campsite_${bestCampsite.id}`,
              lat: bestCampsite.lat,
              lng: bestCampsite.lng,
              name: bestCampsite.name,
              type: 'waypoint'
            },
            { objective: 'balanced', vehicleProfile }
          );

          suggestions.push({
            campsite: bestCampsite,
            insertPosition: insertionResult.suggestedPosition,
            routeImpact: {
              distanceAdded: insertionResult.routeImpact.distanceAdded,
              timeAdded: insertionResult.routeImpact.timeAdded,
              suitabilityScore: this.calculateCampsiteSuitability(bestCampsite, requirements, vehicleProfile)
            }
          });
        }
      } catch (error) {
        console.warn(`Failed to find campsites for segment ${segment.startIndex}-${segment.endIndex}:`, error);
      }
    }

    return suggestions.sort((a, b) => b.routeImpact.suitabilityScore - a.routeImpact.suitabilityScore);
  }

  /**
   * Replace poor campsite choices with better alternatives
   */
  private static async replacePoorCampsiteChoices(
    waypoints: Waypoint[],
    requirements?: CampsiteOptimizationRequest['campsiteRequirements'],
    vehicleProfile?: VehicleProfile
  ): Promise<Waypoint[]> {
    if (!requirements) return waypoints;

    const updatedWaypoints = [...waypoints];

    for (let i = 0; i < updatedWaypoints.length; i++) {
      const waypoint = updatedWaypoints[i];

      // Check if this waypoint represents a campsite (ID starts with 'campsite_')
      if (waypoint.id.startsWith('campsite_')) {
        // Find better alternatives near this campsite
        try {
          const alternatives = await this.findNearbyAlternatives(
            waypoint,
            requirements,
            vehicleProfile
          );

          if (alternatives.length > 0) {
            const betterOption = alternatives[0];
            const currentSuitability = 0.5; // Would need to calculate based on current campsite data

            if (betterOption.suitability > currentSuitability + 0.2) { // 20% improvement threshold
              updatedWaypoints[i] = {
                id: `campsite_${betterOption.campsite.id}`,
                lat: betterOption.campsite.lat,
                lng: betterOption.campsite.lng,
                name: betterOption.campsite.name,
                type: 'waypoint'
              };
            }
          }
        } catch (error) {
          console.warn(`Failed to find alternatives for waypoint ${waypoint.id}:`, error);
        }
      }
    }

    return updatedWaypoints;
  }

  /**
   * Identify route segments that need campsite stops
   */
  private static identifyLongSegments(
    waypoints: Waypoint[],
    maxStopsPerDay: number
  ): Array<{ startIndex: number; endIndex: number; needsCampsite: boolean }> {
    const segments: Array<{ startIndex: number; endIndex: number; needsCampsite: boolean }> = [];
    const maxDailyDistance = 400; // km - rough estimate for comfortable daily driving

    for (let i = 0; i < waypoints.length - 1; i++) {
      const start = waypoints[i];
      const end = waypoints[i + 1];

      const distance = this.calculateDistance(start, end);
      const needsCampsite = distance > maxDailyDistance ||
        (i > 0 && segments.length > 0 && segments.length % maxStopsPerDay === 0);

      segments.push({
        startIndex: i,
        endIndex: i + 1,
        needsCampsite
      });
    }

    return segments.filter(s => s.needsCampsite);
  }

  /**
   * Find campsites along a route segment
   */
  private static async findCampsitesAlongSegment(
    start: Waypoint,
    end: Waypoint,
    requirements: NonNullable<CampsiteOptimizationRequest['campsiteRequirements']>,
    vehicleProfile?: VehicleProfile
  ): Promise<Campsite[]> {
    // Calculate search area around the route segment
    const bounds = this.calculateSegmentBounds(start, end, requirements.maxDistanceFromRoute);

    try {
      const campsiteResponse = await campsiteService.searchCampsites({
        bounds,
        types: requirements.preferredTypes as any[] || ['campsite', 'caravan_site', 'aire'],
        amenities: requirements.requiredAmenities,
        maxResults: 50,
        vehicleFilter: vehicleProfile ? {
          height: vehicleProfile.height,
          length: vehicleProfile.length,
          weight: vehicleProfile.weight,
          motorhome: vehicleProfile.type === 'motorhome',
          caravan: vehicleProfile.type === 'caravan'
        } : undefined
      });

      let campsites = campsiteResponse.campsites;

      // Filter by vehicle compatibility if required
      if (requirements.vehicleCompatibleOnly && vehicleProfile) {
        campsites = campsites.filter(campsite => {
          return campsite.access?.motorhome || campsite.access?.caravan;
        });
      }

      // Sort by suitability
      return campsites
        .map(campsite => ({
          ...campsite,
          suitability: this.calculateCampsiteSuitability(campsite, requirements, vehicleProfile)
        }))
        .sort((a, b) => b.suitability - a.suitability)
        .slice(0, 10); // Top 10 candidates

    } catch (error) {
      console.warn('Failed to search campsites:', error);
      return [];
    }
  }

  /**
   * Find nearby alternatives to a campsite
   */
  private static async findNearbyAlternatives(
    currentWaypoint: Waypoint,
    requirements: NonNullable<CampsiteOptimizationRequest['campsiteRequirements']>,
    vehicleProfile?: VehicleProfile
  ): Promise<Array<{ campsite: Campsite; suitability: number }>> {
    const searchRadius = 10; // km
    const bounds = {
      north: currentWaypoint.lat + (searchRadius / 111), // Rough conversion km to degrees
      south: currentWaypoint.lat - (searchRadius / 111),
      east: currentWaypoint.lng + (searchRadius / (111 * Math.cos(currentWaypoint.lat * Math.PI / 180))),
      west: currentWaypoint.lng - (searchRadius / (111 * Math.cos(currentWaypoint.lat * Math.PI / 180)))
    };

    try {
      const campsiteResponse = await campsiteService.searchCampsites({
        bounds,
        types: requirements.preferredTypes as any[] || ['campsite', 'caravan_site', 'aire'],
        amenities: requirements.requiredAmenities,
        maxResults: 20
      });

      return campsiteResponse.campsites
        .filter(campsite => campsite.id !== parseInt(currentWaypoint.id.replace('campsite_', '')))
        .map(campsite => ({
          campsite,
          suitability: this.calculateCampsiteSuitability(campsite, requirements, vehicleProfile)
        }))
        .sort((a, b) => b.suitability - a.suitability)
        .slice(0, 5);

    } catch (error) {
      console.warn('Failed to find alternatives:', error);
      return [];
    }
  }

  /**
   * Calculate campsite suitability score
   */
  private static calculateCampsiteSuitability(
    campsite: Campsite,
    requirements: NonNullable<CampsiteOptimizationRequest['campsiteRequirements']>,
    vehicleProfile?: VehicleProfile
  ): number {
    let score = 0.5; // Base score

    // Vehicle compatibility
    if (vehicleProfile && requirements.vehicleCompatibleOnly) {
      if (campsite.access?.motorhome || campsite.access?.caravan) {
        score += 0.3;
      } else {
        score -= 0.4;
      }
    }

    // Required amenities
    if (requirements.requiredAmenities) {
      const availableAmenities = Object.entries(campsite.amenities || {})
        .filter(([_, available]) => available)
        .map(([amenity]) => amenity);

      const matchingAmenities = requirements.requiredAmenities.filter(amenity =>
        availableAmenities.includes(amenity)
      );

      score += (matchingAmenities.length / requirements.requiredAmenities.length) * 0.2;
    }

    // Preferred types
    if (requirements.preferredTypes && requirements.preferredTypes.includes(campsite.type)) {
      score += 0.1;
    }

    // Quality indicators
    if (campsite.contact?.website || campsite.contact?.phone) {
      score += 0.05;
    }

    if (campsite.opening_hours) {
      score += 0.05;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate bounds for a route segment
   */
  private static calculateSegmentBounds(
    start: Waypoint,
    end: Waypoint,
    bufferKm: number
  ) {
    const bufferDegrees = bufferKm / 111; // Rough conversion

    return {
      north: Math.max(start.lat, end.lat) + bufferDegrees,
      south: Math.min(start.lat, end.lat) - bufferDegrees,
      east: Math.max(start.lng, end.lng) + bufferDegrees,
      west: Math.min(start.lng, end.lng) - bufferDegrees
    };
  }

  /**
   * Calculate distance between two waypoints
   */
  private static calculateDistance(waypoint1: Waypoint, waypoint2: Waypoint): number {
    const R = 6371; // Earth's radius in km
    const dLat = (waypoint2.lat - waypoint1.lat) * Math.PI / 180;
    const dLng = (waypoint2.lng - waypoint1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(waypoint1.lat * Math.PI / 180) * Math.cos(waypoint2.lat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

// Export singleton instance
export const campsiteOptimizationService = new CampsiteOptimizationService();