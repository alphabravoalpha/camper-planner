// Toll Calculation Service Framework
// Phase 5.2: Framework for future toll road cost integration

import { Waypoint } from '../store';
import { VehicleProfile } from '../store';

export interface TollRoute {
  id: string;
  name: string;
  country: string;
  startPoint: { lat: number; lng: number };
  endPoint: { lat: number; lng: number };
  tollType: 'distance_based' | 'flat_rate' | 'vignette' | 'time_based';
  vehicleCategories: {
    category1: number; // Cars, small campervans
    category2: number; // Large motorhomes
    category3: number; // Motorhomes with trailers
  };
  currency: string;
  isActive: boolean;
}

export interface VignetteRequirement {
  country: string;
  duration: '10_days' | '1_month' | '1_year';
  cost: number;
  currency: string;
  vehicleCategories: {
    category1: number;
    category2: number;
    category3: number;
  };
  applicableVehicles: string[];
}

export interface TollCalculationResult {
  totalTollCost: number;
  currency: string;
  breakdown: Array<{
    routeId: string;
    routeName: string;
    country: string;
    cost: number;
    tollType: string;
    vehicleCategory: number;
  }>;
  vignetteRequirements: Array<{
    country: string;
    vignetteType: string;
    cost: number;
    required: boolean;
  }>;
  recommendations: string[];
}

// European toll road data framework (extensible structure)
const TOLL_ROUTES: TollRoute[] = [
  // France - Major highways
  {
    id: 'fr_a1',
    name: 'A1 Paris-Lille',
    country: 'France',
    startPoint: { lat: 48.8566, lng: 2.3522 },
    endPoint: { lat: 50.6292, lng: 3.0573 },
    tollType: 'distance_based',
    vehicleCategories: { category1: 0.12, category2: 0.18, category3: 0.24 }, // EUR per km
    currency: 'EUR',
    isActive: true
  },

  // Austria - Vignette system
  {
    id: 'at_vignette',
    name: 'Austrian Highway Vignette',
    country: 'Austria',
    startPoint: { lat: 47.0, lng: 14.0 },
    endPoint: { lat: 47.0, lng: 14.0 },
    tollType: 'vignette',
    vehicleCategories: { category1: 9.6, category2: 19.2, category3: 28.8 }, // 10-day vignette
    currency: 'EUR',
    isActive: true
  },

  // Italy - Distance-based tolls
  {
    id: 'it_a1',
    name: 'A1 Milano-Roma',
    country: 'Italy',
    startPoint: { lat: 45.4642, lng: 9.1900 },
    endPoint: { lat: 41.9028, lng: 12.4964 },
    tollType: 'distance_based',
    vehicleCategories: { category1: 0.08, category2: 0.16, category3: 0.24 },
    currency: 'EUR',
    isActive: true
  },

  // Spain - Distance-based tolls
  {
    id: 'es_ap1',
    name: 'AP-1 Burgos-Armiñón',
    country: 'Spain',
    startPoint: { lat: 42.3601, lng: -3.6869 },
    endPoint: { lat: 42.8440, lng: -2.8925 },
    tollType: 'distance_based',
    vehicleCategories: { category1: 0.10, category2: 0.15, category3: 0.20 },
    currency: 'EUR',
    isActive: true
  }
];

// Vignette requirements by country
const VIGNETTE_REQUIREMENTS: VignetteRequirement[] = [
  {
    country: 'Austria',
    duration: '10_days',
    cost: 9.60,
    currency: 'EUR',
    vehicleCategories: { category1: 9.60, category2: 19.20, category3: 28.80 },
    applicableVehicles: ['motorhome', 'caravan', 'campervan']
  },
  {
    country: 'Switzerland',
    duration: '1_year',
    cost: 40.00,
    currency: 'CHF',
    vehicleCategories: { category1: 40.00, category2: 40.00, category3: 40.00 },
    applicableVehicles: ['motorhome', 'caravan', 'campervan']
  },
  {
    country: 'Slovenia',
    duration: '1_month',
    cost: 15.00,
    currency: 'EUR',
    vehicleCategories: { category1: 15.00, category2: 30.00, category3: 45.00 },
    applicableVehicles: ['motorhome', 'caravan', 'campervan']
  }
];

export class TollCalculationService {
  /**
   * Calculate toll costs for a route (framework implementation)
   * This is a basic framework - real implementation would require:
   * - Detailed route mapping to toll roads
   * - Real-time toll price APIs
   * - Accurate vehicle classification
   * - Route optimization considering toll costs
   */
  static async calculateTollCosts(
    waypoints: Waypoint[],
    vehicleProfile?: VehicleProfile
  ): Promise<TollCalculationResult> {

    // Framework implementation - basic estimation
    const tollBreakdown: TollCalculationResult['breakdown'] = [];
    const vignetteRequirements: TollCalculationResult['vignetteRequirements'] = [];
    const recommendations: string[] = [];

    // Determine vehicle category based on profile
    const vehicleCategory = this.determineVehicleCategory(vehicleProfile);

    // Basic country detection from waypoints (simplified)
    const countries = this.detectCountriesInRoute(waypoints);

    // Check for vignette requirements
    countries.forEach(country => {
      const vignetteReq = VIGNETTE_REQUIREMENTS.find(v => v.country === country);
      if (vignetteReq && vehicleProfile) {
        vignetteRequirements.push({
          country,
          vignetteType: `${vignetteReq.duration} vignette`,
          cost: vignetteReq.vehicleCategories[`category${vehicleCategory}` as keyof typeof vignetteReq.vehicleCategories],
          required: vignetteReq.applicableVehicles.includes(vehicleProfile.type)
        });
      }
    });

    // Estimate toll costs for major routes (simplified)
    const totalDistance = this.calculateTotalDistance(waypoints);
    let estimatedTollCost = 0;

    // Basic estimation: €0.10 per km for tolled highways (roughly 30% of route)
    const tollDistanceRatio = 0.3;
    const avgTollRate = 0.10 * vehicleCategory;
    estimatedTollCost = totalDistance * tollDistanceRatio * avgTollRate;

    // Add vignette costs
    const vignetteTotal = vignetteRequirements.reduce((sum, v) => sum + v.cost, 0);

    // Generate recommendations
    if (vignetteRequirements.length > 0) {
      recommendations.push('Consider purchasing vignettes online in advance for better prices');
    }

    if (totalDistance > 500) {
      recommendations.push('For long trips, consider toll-free alternative routes to save costs');
    }

    if (vehicleProfile?.type === 'motorhome' && (vehicleProfile.length || 0) > 7) {
      recommendations.push('Large motorhomes may be classified in higher toll categories');
    }

    return {
      totalTollCost: estimatedTollCost + vignetteTotal,
      currency: 'EUR',
      breakdown: tollBreakdown,
      vignetteRequirements,
      recommendations
    };
  }

  /**
   * Get toll-free alternative routes (framework)
   */
  static async getTollFreeAlternatives(
    waypoints: Waypoint[]
  ): Promise<{
    alternativeRoute: Waypoint[];
    tollSavings: number;
    additionalDistance: number;
    additionalTime: number;
  }> {
    // Framework implementation
    // Real implementation would use routing services with toll avoidance

    return {
      alternativeRoute: waypoints, // Placeholder
      tollSavings: 0,
      additionalDistance: 0,
      additionalTime: 0
    };
  }

  /**
   * Check if route passes through toll roads
   */
  static async checkTollRoadsOnRoute(waypoints: Waypoint[]): Promise<{
    hasTollRoads: boolean;
    estimatedTollCost: number;
    tollFreeAlternativeAvailable: boolean;
  }> {
    const countries = this.detectCountriesInRoute(waypoints);
    const hasTollRoads = countries.some(country =>
      ['France', 'Italy', 'Spain', 'Portugal'].includes(country)
    );

    const totalDistance = this.calculateTotalDistance(waypoints);
    const estimatedTollCost = hasTollRoads ? totalDistance * 0.3 * 0.10 : 0;

    return {
      hasTollRoads,
      estimatedTollCost,
      tollFreeAlternativeAvailable: hasTollRoads
    };
  }

  /**
   * Get vignette requirements for countries
   */
  static getVignetteRequirements(countries: string[]): VignetteRequirement[] {
    return VIGNETTE_REQUIREMENTS.filter(req => countries.includes(req.country));
  }

  /**
   * Helper methods
   */
  private static determineVehicleCategory(vehicleProfile?: VehicleProfile): 1 | 2 | 3 {
    if (!vehicleProfile) return 1;

    const length = vehicleProfile.length || 0;
    const weight = vehicleProfile.weight || 0;
    const hasTrailer = vehicleProfile.type === 'caravan';

    if (hasTrailer || weight > 3500 || length > 7) return 3;
    if (weight > 2500 || length > 6) return 2;
    return 1;
  }

  private static detectCountriesInRoute(waypoints: Waypoint[]): string[] {
    // Simplified country detection based on coordinates
    // Real implementation would use reverse geocoding

    const countries = new Set<string>();

    waypoints.forEach(waypoint => {
      // Basic coordinate-based country detection (simplified)
      if (waypoint.lat >= 42 && waypoint.lat <= 51 && waypoint.lng >= -5 && waypoint.lng <= 10) {
        countries.add('France');
      }
      if (waypoint.lat >= 36 && waypoint.lat <= 47 && waypoint.lng >= 6 && waypoint.lng <= 19) {
        countries.add('Italy');
      }
      if (waypoint.lat >= 36 && waypoint.lat <= 44 && waypoint.lng >= -10 && waypoint.lng <= 5) {
        countries.add('Spain');
      }
      if (waypoint.lat >= 46 && waypoint.lat <= 49 && waypoint.lng >= 9 && waypoint.lng <= 17) {
        countries.add('Austria');
      }
      if (waypoint.lat >= 45 && waypoint.lat <= 47 && waypoint.lng >= 5 && waypoint.lng <= 11) {
        countries.add('Switzerland');
      }
    });

    return Array.from(countries);
  }

  private static calculateTotalDistance(waypoints: Waypoint[]): number {
    if (waypoints.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      totalDistance += this.calculateDistance(waypoints[i], waypoints[i + 1]);
    }
    return totalDistance;
  }

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
export const tollCalculationService = new TollCalculationService();