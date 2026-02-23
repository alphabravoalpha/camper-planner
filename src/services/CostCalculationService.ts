// Cost Calculation Service
// Phase 5.2: Comprehensive trip cost calculation and optimization

import { type Waypoint } from '../store';
import { type VehicleProfile } from '../store';

export interface FuelConsumptionSettings {
  consumptionType: 'l_per_100km' | 'mpg_imperial' | 'mpg_us';
  consumption: number;
  fuelType: 'petrol' | 'diesel' | 'lpg' | 'electricity';
  tankCapacity?: number; // liters
}

export interface FuelPriceSettings {
  priceType: 'manual' | 'default_european';
  manualPrices?: {
    petrol: number; // per liter
    diesel: number;
    lpg: number;
    electricity: number; // per kWh
  };
  currency: 'EUR' | 'GBP' | 'USD';
  lastUpdated?: Date;
}

export interface RouteSegment {
  startWaypoint: Waypoint;
  endWaypoint: Waypoint;
  distance: number; // km
  duration: number; // minutes
  fuelCost: number;
  tollCost?: number; // Framework for future implementation
  accommodationCost?: number;
  segmentType: 'driving' | 'overnight' | 'stop';
}

export interface CostBreakdown {
  totalCost: number;
  fuelCost: number;
  tollCost: number;
  accommodationCost: number;
  foodCost: number;
  ferryCost: number;
  otherCosts: number;
  currency: string;
  segments: RouteSegment[];
  dailyBreakdown: Array<{
    date: Date;
    distance: number;
    fuelCost: number;
    accommodationCost: number;
    foodCost: number;
    totalDailyCost: number;
  }>;
}

export interface CostOptimization {
  currentCost: number;
  optimizedCost: number;
  savings: number;
  suggestions: Array<{
    type: 'fuel_efficiency' | 'route_alternative' | 'fuel_stop' | 'accommodation';
    description: string;
    potentialSaving: number;
    actionRequired: string;
  }>;
}

// European fuel price averages (2024 estimates in EUR per liter)
const DEFAULT_EUROPEAN_FUEL_PRICES = {
  petrol: 1.65,
  diesel: 1.55,
  lpg: 0.85,
  electricity: 0.35 // per kWh
};

// Vehicle type default consumptions (L/100km for conventional, kWh/100km for electric)
const DEFAULT_VEHICLE_CONSUMPTIONS = {
  motorhome: {
    small: { petrol: 12, diesel: 10, lpg: 14 },
    medium: { petrol: 15, diesel: 12, lpg: 17 },
    large: { petrol: 18, diesel: 15, lpg: 20 }
  },
  caravan: {
    small: { petrol: 10, diesel: 8, lpg: 12 },
    medium: { petrol: 13, diesel: 10, lpg: 15 },
    large: { petrol: 16, diesel: 13, lpg: 18 }
  },
  campervan: {
    small: { petrol: 9, diesel: 7, lpg: 11 },
    medium: { petrol: 11, diesel: 9, lpg: 13 },
    large: { petrol: 14, diesel: 11, lpg: 16 }
  }
};

export class CostCalculationService {
  private static fuelConsumptionSettings: FuelConsumptionSettings | null = null;
  private static fuelPriceSettings: FuelPriceSettings | null = null;

  /**
   * Initialize cost calculation settings
   */
  static initializeSettings(
    consumptionSettings: FuelConsumptionSettings,
    priceSettings: FuelPriceSettings
  ): void {
    this.fuelConsumptionSettings = consumptionSettings;
    this.fuelPriceSettings = priceSettings;
  }

  /**
   * Get default consumption for vehicle profile
   */
  static getDefaultConsumption(vehicleProfile: VehicleProfile): FuelConsumptionSettings {
    const vehicleType = vehicleProfile.type as keyof typeof DEFAULT_VEHICLE_CONSUMPTIONS;
    const vehicleSize = this.determineVehicleSize(vehicleProfile);

    const defaults = DEFAULT_VEHICLE_CONSUMPTIONS[vehicleType]?.[vehicleSize];

    return {
      consumptionType: 'l_per_100km',
      consumption: defaults?.diesel || 12,
      fuelType: 'diesel',
      tankCapacity: 80 // Default fuel capacity
    };
  }

  /**
   * Get current fuel prices
   */
  static getCurrentFuelPrices(): FuelPriceSettings['manualPrices'] {
    if (this.fuelPriceSettings?.priceType === 'manual' && this.fuelPriceSettings.manualPrices) {
      return this.fuelPriceSettings.manualPrices;
    }

    return DEFAULT_EUROPEAN_FUEL_PRICES;
  }

  /**
   * Calculate comprehensive route costs
   */
  static async calculateRouteCosts(
    waypoints: Waypoint[],
    vehicleProfile?: VehicleProfile,
    customConsumption?: FuelConsumptionSettings,
    customPrices?: FuelPriceSettings
  ): Promise<CostBreakdown> {
    if (waypoints.length < 2) {
      return this.createEmptyCostBreakdown();
    }

    // Use provided settings or defaults
    const consumptionSettings = customConsumption ||
      this.fuelConsumptionSettings ||
      (vehicleProfile ? this.getDefaultConsumption(vehicleProfile) : {
        consumptionType: 'l_per_100km',
        consumption: 12,
        fuelType: 'diesel'
      });

    const priceSettings = customPrices || this.fuelPriceSettings || {
      priceType: 'default_european',
      currency: 'EUR'
    };

    // Calculate route segments
    const segments = await this.calculateRouteSegments(waypoints, consumptionSettings, priceSettings);

    // Calculate daily breakdown
    const dailyBreakdown = this.calculateDailyBreakdown(segments);

    // Calculate totals
    const totalFuelCost = segments.reduce((sum, segment) => sum + segment.fuelCost, 0);
    const totalTollCost = segments.reduce((sum, segment) => sum + (segment.tollCost || 0), 0);
    const totalAccommodationCost = segments.reduce((sum, segment) => sum + (segment.accommodationCost || 0), 0);

    return {
      totalCost: totalFuelCost + totalTollCost + totalAccommodationCost,
      fuelCost: totalFuelCost,
      tollCost: totalTollCost,
      accommodationCost: totalAccommodationCost,
      foodCost: 0,
      ferryCost: 0,
      otherCosts: 0,
      currency: priceSettings.currency,
      segments,
      dailyBreakdown
    };
  }

  /**
   * Calculate cost optimization suggestions
   */
  static async calculateCostOptimizations(
    currentBreakdown: CostBreakdown,
    vehicleProfile?: VehicleProfile
  ): Promise<CostOptimization> {
    const suggestions: CostOptimization['suggestions'] = [];

    // Fuel efficiency suggestions
    if (vehicleProfile) {
      const currentConsumption = this.fuelConsumptionSettings?.consumption || 12;
      const optimalConsumption = this.getOptimalConsumption(vehicleProfile);

      if (currentConsumption > optimalConsumption * 1.1) {
        const potentialSaving = this.calculateFuelEfficiencySaving(
          currentBreakdown.fuelCost,
          currentConsumption,
          optimalConsumption
        );

        suggestions.push({
          type: 'fuel_efficiency',
          description: 'Improve fuel efficiency through eco-driving techniques',
          potentialSaving,
          actionRequired: 'Maintain steady speeds, avoid rapid acceleration, plan efficient routes'
        });
      }
    }

    // Route alternative suggestions
    const routeAlternativeSaving = currentBreakdown.fuelCost * 0.05; // Estimate 5% savings
    suggestions.push({
      type: 'route_alternative',
      description: 'Consider alternative routes to reduce fuel consumption',
      potentialSaving: routeAlternativeSaving,
      actionRequired: 'Use route optimization with fuel efficiency priority'
    });

    // Fuel stop optimization
    if (currentBreakdown.segments.length > 3) {
      suggestions.push({
        type: 'fuel_stop',
        description: 'Optimize fuel stops at cheaper stations',
        potentialSaving: currentBreakdown.fuelCost * 0.03,
        actionRequired: 'Plan fuel stops at hypermarkets or discount stations'
      });
    }

    const totalSavings = suggestions.reduce((sum, s) => sum + s.potentialSaving, 0);

    return {
      currentCost: currentBreakdown.totalCost,
      optimizedCost: currentBreakdown.totalCost - totalSavings,
      savings: totalSavings,
      suggestions: suggestions.sort((a, b) => b.potentialSaving - a.potentialSaving)
    };
  }

  /**
   * Convert consumption between different units
   */
  static convertConsumption(
    value: number,
    from: FuelConsumptionSettings['consumptionType'],
    to: FuelConsumptionSettings['consumptionType']
  ): number {
    // Convert to L/100km as base unit
    let lPer100km: number;

    switch (from) {
      case 'l_per_100km':
        lPer100km = value;
        break;
      case 'mpg_imperial':
        lPer100km = 282.481 / value; // Imperial MPG to L/100km
        break;
      case 'mpg_us':
        lPer100km = 235.215 / value; // US MPG to L/100km
        break;
    }

    // Convert from L/100km to target unit
    switch (to) {
      case 'l_per_100km':
        return lPer100km;
      case 'mpg_imperial':
        return 282.481 / lPer100km;
      case 'mpg_us':
        return 235.215 / lPer100km;
    }
  }

  /**
   * Calculate fuel cost for a specific distance
   */
  static calculateFuelCost(
    distanceKm: number,
    consumptionSettings: FuelConsumptionSettings,
    _priceSettings: FuelPriceSettings
  ): number {
    const consumptionLPer100km = this.convertConsumption(
      consumptionSettings.consumption,
      consumptionSettings.consumptionType,
      'l_per_100km'
    );

    const fuelUsed = (distanceKm / 100) * consumptionLPer100km;
    const prices = this.getCurrentFuelPrices();
    const fuelPrice = (prices as Record<string, number>)[consumptionSettings.fuelType];

    return fuelUsed * fuelPrice;
  }

  /**
   * Calculate route segments with costs
   */
  private static async calculateRouteSegments(
    waypoints: Waypoint[],
    consumptionSettings: FuelConsumptionSettings,
    priceSettings: FuelPriceSettings
  ): Promise<RouteSegment[]> {
    const segments: RouteSegment[] = [];

    for (let i = 0; i < waypoints.length - 1; i++) {
      const start = waypoints[i];
      const end = waypoints[i + 1];

      const distance = this.calculateDistance(start, end);
      const duration = this.estimateDrivingTime(distance);
      const fuelCost = this.calculateFuelCost(distance, consumptionSettings, priceSettings);

      // Determine segment type
      let segmentType: RouteSegment['segmentType'] = 'driving';
      let accommodationCost = 0;

      if (end.type === 'campsite' || end.type === 'accommodation') {
        segmentType = 'overnight';
        accommodationCost = this.estimateAccommodationCost(end);
      } else if (i > 0 && distance < 50) {
        segmentType = 'stop';
      }

      segments.push({
        startWaypoint: start,
        endWaypoint: end,
        distance,
        duration,
        fuelCost,
        accommodationCost,
        segmentType,
        tollCost: 0 // Framework for future toll integration
      });
    }

    return segments;
  }

  /**
   * Calculate daily cost breakdown
   */
  private static calculateDailyBreakdown(segments: RouteSegment[]): CostBreakdown['dailyBreakdown'] {
    const dailyBreakdown: CostBreakdown['dailyBreakdown'] = [];
    let currentDate = new Date();
    let dailyDistance = 0;
    let dailyFuelCost = 0;
    let dailyAccommodationCost = 0;

    segments.forEach((segment, index) => {
      dailyDistance += segment.distance;
      dailyFuelCost += segment.fuelCost;

      // If this is an overnight stop or the last segment, close the day
      if (segment.segmentType === 'overnight' || index === segments.length - 1) {
        dailyAccommodationCost += segment.accommodationCost || 0;

        dailyBreakdown.push({
          date: new Date(currentDate),
          distance: dailyDistance,
          fuelCost: dailyFuelCost,
          accommodationCost: dailyAccommodationCost,
          foodCost: 0,
          totalDailyCost: dailyFuelCost + dailyAccommodationCost
        });

        // Reset for next day
        currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
        dailyDistance = 0;
        dailyFuelCost = 0;
        dailyAccommodationCost = 0;
      }
    });

    return dailyBreakdown;
  }

  /**
   * Helper methods
   */
  private static createEmptyCostBreakdown(): CostBreakdown {
    return {
      totalCost: 0,
      fuelCost: 0,
      tollCost: 0,
      accommodationCost: 0,
      foodCost: 0,
      ferryCost: 0,
      otherCosts: 0,
      currency: 'EUR',
      segments: [],
      dailyBreakdown: []
    };
  }

  private static determineVehicleSize(vehicleProfile: VehicleProfile): 'small' | 'medium' | 'large' {
    const length = vehicleProfile.length || 6;
    if (length < 6) return 'small';
    if (length < 8) return 'medium';
    return 'large';
  }

  private static getOptimalConsumption(vehicleProfile: VehicleProfile): number {
    const vehicleType = vehicleProfile.type as keyof typeof DEFAULT_VEHICLE_CONSUMPTIONS;
    const vehicleSize = this.determineVehicleSize(vehicleProfile);
    return DEFAULT_VEHICLE_CONSUMPTIONS[vehicleType]?.[vehicleSize]?.diesel || 12;
  }

  private static calculateFuelEfficiencySaving(
    currentFuelCost: number,
    currentConsumption: number,
    optimalConsumption: number
  ): number {
    const improvementRatio = (currentConsumption - optimalConsumption) / currentConsumption;
    return currentFuelCost * improvementRatio;
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

  private static estimateDrivingTime(distanceKm: number): number {
    // Estimate based on average speeds (mix of highways and local roads)
    const averageSpeed = 70; // km/h
    return (distanceKm / averageSpeed) * 60; // minutes
  }

  private static estimateAccommodationCost(waypoint: Waypoint): number {
    // Rough estimates for European camping costs
    switch (waypoint.type) {
      case 'campsite':
        return 25; // EUR per night
      case 'accommodation':
        return 80; // EUR per night for hotels
      default:
        return 0;
    }
  }
}

// Export singleton instance
export const costCalculationService = new CostCalculationService();