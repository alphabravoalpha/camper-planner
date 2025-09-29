// Campsite Recommendation Service
// Phase 4.4: Intelligent campsite recommendations based on route and vehicle profile

import { Campsite } from './CampsiteService';
import { VehicleProfile } from '../types';
import { RouteGeometry, calculateDistanceToRoute, haversineDistance } from '../utils/routeDistance';

export interface RecommendationCriteria {
  routeGeometry?: RouteGeometry;
  vehicleProfile?: VehicleProfile;
  preferredAmenities?: string[];
  maxDistanceFromRoute?: number; // km
  budgetPreference?: 'free' | 'budget' | 'any';
  campingStyle?: 'wild' | 'facilities' | 'luxury' | 'any';
  groupSize?: number;
  stayDuration?: number; // nights
  currentLocation?: [number, number]; // [lat, lng]
}

export interface CampsiteRecommendation extends Campsite {
  recommendationScore: number;
  reasons: string[];
  warnings: string[];
  routeDistance?: number;
  estimatedCost?: 'free' | 'low' | 'medium' | 'high';
  suitabilityScore: number;
}

export interface RecommendationResult {
  recommendations: CampsiteRecommendation[];
  metadata: {
    totalCampsites: number;
    criteriaUsed: string[];
    generatedAt: Date;
  };
}

export class CampsiteRecommendationService {
  /**
   * Generate campsite recommendations based on criteria
   */
  static generateRecommendations(
    campsites: Campsite[],
    criteria: RecommendationCriteria,
    maxRecommendations: number = 10
  ): RecommendationResult {
    const scoredCampsites = campsites
      .map(campsite => this.scoreCampsite(campsite, criteria))
      .filter(rec => rec.recommendationScore > 0)
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, maxRecommendations);

    return {
      recommendations: scoredCampsites,
      metadata: {
        totalCampsites: campsites.length,
        criteriaUsed: this.extractCriteriaUsed(criteria),
        generatedAt: new Date()
      }
    };
  }

  /**
   * Score individual campsite based on recommendation criteria
   */
  private static scoreCampsite(
    campsite: Campsite,
    criteria: RecommendationCriteria
  ): CampsiteRecommendation {
    let score = 0;
    const reasons: string[] = [];
    const warnings: string[] = [];
    let routeDistance: number | undefined;

    // Base score for each campsite
    score += 10;

    // 1. Vehicle compatibility (critical factor)
    if (criteria.vehicleProfile) {
      if (campsite.access?.motorhome) {
        score += 30;
        reasons.push('Compatible with your vehicle size');
      } else {
        score -= 50;
        warnings.push('Vehicle size restrictions may apply');
      }
    }

    // 2. Route proximity scoring
    if (criteria.routeGeometry) {
      const distanceResult = calculateDistanceToRoute(campsite, criteria.routeGeometry);
      if (distanceResult) {
        routeDistance = distanceResult.distance;
        const maxDistance = criteria.maxDistanceFromRoute || 20;

        if (routeDistance <= maxDistance) {
          // Score decreases linearly with distance
          const proximityScore = Math.max(0, 25 - (routeDistance / maxDistance) * 25);
          score += proximityScore;

          if (routeDistance <= 5) {
            reasons.push('Very close to your route');
          } else if (routeDistance <= 15) {
            reasons.push('Convenient detour from route');
          } else {
            reasons.push('Accessible from your route');
          }
        } else {
          score -= 10;
          warnings.push(`${routeDistance.toFixed(1)}km detour from route`);
        }
      }
    }

    // 3. Distance from current location
    if (criteria.currentLocation) {
      const distance = haversineDistance(
        criteria.currentLocation[0], criteria.currentLocation[1],
        campsite.lat, campsite.lng
      );

      if (distance <= 50) {
        score += 10;
        reasons.push('Close to your current location');
      }
    }

    // 4. Amenity matching
    if (criteria.preferredAmenities && criteria.preferredAmenities.length > 0) {
      const availableAmenities = Object.entries(campsite.amenities || {})
        .filter(([_, available]) => available)
        .map(([amenity]) => amenity);

      const matchingAmenities = criteria.preferredAmenities.filter(amenity =>
        availableAmenities.includes(amenity)
      );

      const amenityScore = (matchingAmenities.length / criteria.preferredAmenities.length) * 20;
      score += amenityScore;

      if (matchingAmenities.length > 0) {
        reasons.push(`Has ${matchingAmenities.length}/${criteria.preferredAmenities.length} preferred amenities`);
      }
    }

    // 5. Camping style preferences
    if (criteria.campingStyle && criteria.campingStyle !== 'any') {
      const styleScore = this.evaluateCampingStyle(campsite, criteria.campingStyle);
      score += styleScore.score;
      if (styleScore.reason) reasons.push(styleScore.reason);
      if (styleScore.warning) warnings.push(styleScore.warning);
    }

    // 6. Budget preferences
    if (criteria.budgetPreference && criteria.budgetPreference !== 'any') {
      const budgetScore = this.evaluateBudgetFit(campsite, criteria.budgetPreference);
      score += budgetScore.score;
      if (budgetScore.reason) reasons.push(budgetScore.reason);
    }

    // 7. Group size considerations
    if (criteria.groupSize && criteria.groupSize > 2) {
      if (this.isSuitableForGroups(campsite)) {
        score += 10;
        reasons.push('Good facilities for groups');
      }
    }

    // 8. Campsite type bonus
    const typeScore = this.getTypeScore(campsite.type);
    score += typeScore.score;
    if (typeScore.reason) reasons.push(typeScore.reason);

    // 9. Quality indicators
    const qualityScore = this.assessQuality(campsite);
    score += qualityScore.score;
    if (qualityScore.reason) reasons.push(qualityScore.reason);

    // 10. Availability heuristics (basic)
    if (this.hasGoodAvailabilityIndicators(campsite)) {
      score += 5;
      reasons.push('Good booking availability indicators');
    }

    const suitabilityScore = this.calculateSuitabilityScore(campsite, criteria);

    return {
      ...campsite,
      recommendationScore: Math.max(0, Math.round(score)),
      reasons,
      warnings,
      routeDistance,
      estimatedCost: this.estimateCost(campsite),
      suitabilityScore
    };
  }

  /**
   * Evaluate camping style fit
   */
  private static evaluateCampingStyle(
    campsite: Campsite,
    style: 'wild' | 'facilities' | 'luxury'
  ): { score: number; reason?: string; warning?: string } {
    const amenityCount = Object.values(campsite.amenities || {}).filter(Boolean).length;

    switch (style) {
      case 'wild':
        if (campsite.type === 'aire' || amenityCount <= 2) {
          return { score: 15, reason: 'Perfect for wild camping style' };
        }
        return { score: -5, warning: 'May be too developed for wild camping' };

      case 'facilities':
        if (amenityCount >= 4 && amenityCount <= 8) {
          return { score: 15, reason: 'Good balance of facilities' };
        }
        if (amenityCount < 4) {
          return { score: -5, warning: 'Limited facilities available' };
        }
        return { score: 5, reason: 'Well-equipped campsite' };

      case 'luxury':
        if (amenityCount >= 8) {
          return { score: 20, reason: 'Luxury amenities available' };
        }
        return { score: -10, warning: 'Limited luxury amenities' };

      default:
        return { score: 0 };
    }
  }

  /**
   * Evaluate budget fit
   */
  private static evaluateBudgetFit(
    campsite: Campsite,
    budget: 'free' | 'budget'
  ): { score: number; reason?: string } {
    const isFree = this.isFreeOrLowCost(campsite);

    switch (budget) {
      case 'free':
        return isFree
          ? { score: 15, reason: 'Free or very low cost' }
          : { score: -15 };

      case 'budget':
        return isFree || campsite.type === 'aire'
          ? { score: 10, reason: 'Budget-friendly option' }
          : { score: 0 };

      default:
        return { score: 0 };
    }
  }

  /**
   * Check if campsite is suitable for groups
   */
  private static isSuitableForGroups(campsite: Campsite): boolean {
    const amenities = campsite.amenities || {};
    return Boolean(
      amenities.toilets &&
      amenities.drinking_water &&
      (amenities.restaurant || amenities.shop)
    );
  }

  /**
   * Get score bonus for campsite type
   */
  private static getTypeScore(type: string): { score: number; reason?: string } {
    switch (type) {
      case 'campsite':
        return { score: 5, reason: 'Traditional campsite with facilities' };
      case 'caravan_site':
        return { score: 8, reason: 'Specialized for motorhomes' };
      case 'aire':
        return { score: 6, reason: 'Convenient motorhome service point' };
      default:
        return { score: 0 };
    }
  }

  /**
   * Assess overall campsite quality
   */
  private static assessQuality(campsite: Campsite): { score: number; reason?: string } {
    let score = 0;
    const reasons: string[] = [];

    // Has comprehensive information
    if (campsite.phone && campsite.website) {
      score += 5;
      reasons.push('Complete contact information');
    }

    // Good amenity coverage
    const amenityCount = Object.values(campsite.amenities || {}).filter(Boolean).length;
    if (amenityCount >= 6) {
      score += 5;
      reasons.push('Well-equipped with amenities');
    }

    // Has address (better data quality)
    if (campsite.address) {
      score += 3;
      reasons.push('Detailed location information');
    }

    return {
      score,
      reason: reasons.length > 0 ? reasons.join(', ') : undefined
    };
  }

  /**
   * Check for good availability indicators
   */
  private static hasGoodAvailabilityIndicators(campsite: Campsite): boolean {
    return Boolean(
      campsite.website ||
      campsite.phone ||
      campsite.type === 'aire' // Aires typically don't require booking
    );
  }

  /**
   * Check if campsite is free or low cost
   */
  private static isFreeOrLowCost(campsite: Campsite): boolean {
    const name = campsite.name?.toLowerCase() || '';
    return (
      campsite.type === 'aire' ||
      name.includes('free') ||
      name.includes('wild') ||
      name.includes('municipal')
    );
  }

  /**
   * Estimate campsite cost category
   */
  private static estimateCost(campsite: Campsite): 'free' | 'low' | 'medium' | 'high' {
    if (this.isFreeOrLowCost(campsite)) {
      return 'free';
    }

    const amenityCount = Object.values(campsite.amenities || {}).filter(Boolean).length;

    if (amenityCount <= 3) return 'low';
    if (amenityCount <= 7) return 'medium';
    return 'high';
  }

  /**
   * Calculate overall suitability score
   */
  private static calculateSuitabilityScore(
    campsite: Campsite,
    criteria: RecommendationCriteria
  ): number {
    let score = 50; // Base suitability

    // Vehicle compatibility is critical
    if (criteria.vehicleProfile) {
      score += campsite.access?.motorhome ? 30 : -40;
    }

    // Route proximity
    if (criteria.routeGeometry && criteria.maxDistanceFromRoute) {
      const distanceResult = calculateDistanceToRoute(campsite, criteria.routeGeometry);
      if (distanceResult) {
        const withinRange = distanceResult.distance <= criteria.maxDistanceFromRoute;
        score += withinRange ? 20 : -20;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Extract criteria used for metadata
   */
  private static extractCriteriaUsed(criteria: RecommendationCriteria): string[] {
    const used: string[] = [];

    if (criteria.routeGeometry) used.push('route proximity');
    if (criteria.vehicleProfile) used.push('vehicle compatibility');
    if (criteria.preferredAmenities?.length) used.push('amenity preferences');
    if (criteria.budgetPreference && criteria.budgetPreference !== 'any') used.push('budget preference');
    if (criteria.campingStyle && criteria.campingStyle !== 'any') used.push('camping style');
    if (criteria.groupSize) used.push('group size');
    if (criteria.currentLocation) used.push('current location');

    return used;
  }

  /**
   * Get recommendations for different scenarios
   */
  static getQuickRecommendations(
    campsites: Campsite[],
    scenario: 'tonight' | 'route-planning' | 'weekend-trip',
    criteria: Partial<RecommendationCriteria> = {}
  ): RecommendationResult {
    let scenarioCriteria: RecommendationCriteria;

    switch (scenario) {
      case 'tonight':
        scenarioCriteria = {
          ...criteria,
          maxDistanceFromRoute: 10,
          budgetPreference: 'any',
          campingStyle: 'any'
        };
        break;

      case 'route-planning':
        scenarioCriteria = {
          ...criteria,
          maxDistanceFromRoute: 20,
          preferredAmenities: ['toilets', 'drinking_water', 'electricity'],
          campingStyle: 'facilities'
        };
        break;

      case 'weekend-trip':
        scenarioCriteria = {
          ...criteria,
          maxDistanceFromRoute: 50,
          preferredAmenities: ['toilets', 'shower', 'electricity', 'wifi'],
          campingStyle: 'facilities',
          stayDuration: 2
        };
        break;

      default:
        scenarioCriteria = criteria;
    }

    return this.generateRecommendations(campsites, scenarioCriteria);
  }
}