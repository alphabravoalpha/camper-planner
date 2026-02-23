// Trip Settings Types
// Centralised types and helpers for the Trip Settings Hub — a single source of truth
// for dates, driving style, crossing, budget, and fuel settings.

// ============================================
// Enums / Union Types
// ============================================

export type DrivingStyle = 'relaxed' | 'moderate' | 'intensive';
export type Currency = 'EUR' | 'GBP' | 'USD';
export type CrossingType = 'ferry' | 'eurotunnel' | 'drive_around' | 'none';
export type FuelType = 'diesel' | 'petrol' | 'lpg' | 'electric';
export type ConsumptionUnit = 'l_per_100km' | 'mpg_imperial' | 'mpg_us';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

// ============================================
// Core Interface
// ============================================

export interface TripSettings {
  // When
  startDate?: string; // ISO date string (YYYY-MM-DD)
  endDate?: string;
  duration?: number; // days (alternative to endDate)

  // How to drive
  drivingStyle: DrivingStyle;
  maxDrivingHoursPerDay: number; // 4-10
  restDayFrequency: number; // 0 = none, 3 = every 3rd day, 5 = every 5th

  // Water crossing
  crossing: {
    type: CrossingType;
    estimatedCost?: number;
  };

  // Budget
  currency: Currency;
  dailyBudget: {
    campsite: number; // per night
    food: number; // per day
    activities: number; // per day
  };

  // Fuel
  fuelConsumption: {
    value: number;
    unit: ConsumptionUnit;
    fuelType: FuelType;
    tankCapacity: number; // litres
  };
  fuelPricePerLitre: number;
}

// ============================================
// Constants
// ============================================

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: '\u20AC',
  GBP: '\u00A3',
  USD: '$',
};

/** European average fuel prices by currency and fuel type (per litre). */
export const DEFAULT_FUEL_PRICES: Record<Currency, Record<FuelType, number>> = {
  EUR: {
    diesel: 1.55,
    petrol: 1.65,
    lpg: 0.85,
    electric: 0.35,
  },
  GBP: {
    diesel: 1.45,
    petrol: 1.50,
    lpg: 0.75,
    electric: 0.30,
  },
  USD: {
    diesel: 1.70,
    petrol: 1.80,
    lpg: 0.95,
    electric: 0.40,
  },
};

const DRIVING_LIMITS: Record<DrivingStyle, { maxHours: number; maxKmPerDay: number }> = {
  relaxed: { maxHours: 4, maxKmPerDay: 200 },
  moderate: { maxHours: 6, maxKmPerDay: 300 },
  intensive: { maxHours: 8, maxKmPerDay: 400 },
};

export const DEFAULT_TRIP_SETTINGS: TripSettings = {
  drivingStyle: 'moderate',
  maxDrivingHoursPerDay: 6,
  restDayFrequency: 0,

  crossing: {
    type: 'none',
  },

  currency: 'EUR',
  dailyBudget: {
    campsite: 25,
    food: 30,
    activities: 15,
  },

  fuelConsumption: {
    value: 12,
    unit: 'l_per_100km',
    fuelType: 'diesel',
    tankCapacity: 80,
  },
  fuelPricePerLitre: 1.55,
};

// ============================================
// Helper Functions
// ============================================

/** Derive the season from an ISO date string based on the month. */
export function getSeasonFromDate(dateStr?: string): Season {
  if (!dateStr) return 'summer';

  const month = new Date(dateStr).getMonth(); // 0-11

  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

/** Return the driving hour and distance limits for a given driving style. */
export function getDrivingLimitsForStyle(
  style: DrivingStyle
): { maxHours: number; maxKmPerDay: number } {
  return DRIVING_LIMITS[style];
}
