// Cost Settings Store
// Phase 5.2: Zustand store for cost calculation settings

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  type CostBreakdown,
  type FuelConsumptionSettings,
  type FuelPriceSettings,
} from '../services/CostCalculationService';

interface CostState {
  // Fuel consumption settings
  fuelConsumptionSettings: FuelConsumptionSettings;
  setFuelConsumptionSettings: (settings: FuelConsumptionSettings) => void;

  // Fuel price settings
  fuelPriceSettings: FuelPriceSettings;
  setFuelPriceSettings: (settings: FuelPriceSettings) => void;

  // Cost calculation preferences
  preferences: {
    showCostBreakdown: boolean;
    showDailyEstimates: boolean;
    showOptimizationSuggestions: boolean;
    currency: 'EUR' | 'GBP' | 'USD';
    includeAccommodationCosts: boolean;
    includeTollEstimates: boolean;
  };
  setPreferences: (preferences: Partial<CostState['preferences']>) => void;

  // Auto-update settings
  autoUpdatePrices: boolean;
  setAutoUpdatePrices: (enabled: boolean) => void;

  // Last calculation cache
  lastCalculation: {
    routeHash?: string;
    breakdown?: CostBreakdown;
    timestamp?: number;
  };
  setLastCalculation: (data: CostState['lastCalculation']) => void;
}

// Default fuel consumption settings
const defaultFuelConsumption: FuelConsumptionSettings = {
  consumptionType: 'l_per_100km',
  consumption: 12.0,
  fuelType: 'diesel',
  tankCapacity: 80,
};

// Default fuel price settings
const defaultFuelPrices: FuelPriceSettings = {
  priceType: 'default_european',
  currency: 'EUR',
  lastUpdated: new Date(),
};

// Default preferences
const defaultPreferences: CostState['preferences'] = {
  showCostBreakdown: true,
  showDailyEstimates: true,
  showOptimizationSuggestions: true,
  currency: 'EUR',
  includeAccommodationCosts: true,
  includeTollEstimates: false, // Framework only for now
};

export const useCostStore = create<CostState>()(
  persist(
    (set, get) => ({
      // Fuel consumption settings
      fuelConsumptionSettings: defaultFuelConsumption,
      setFuelConsumptionSettings: settings => {
        set({ fuelConsumptionSettings: settings });
        // Clear cache when settings change
        set({ lastCalculation: {} });
      },

      // Fuel price settings
      fuelPriceSettings: defaultFuelPrices,
      setFuelPriceSettings: settings => {
        set({ fuelPriceSettings: settings });
        // Clear cache when settings change
        set({ lastCalculation: {} });
      },

      // Preferences
      preferences: defaultPreferences,
      setPreferences: newPreferences => {
        set({
          preferences: { ...get().preferences, ...newPreferences },
        });
      },

      // Auto-update settings
      autoUpdatePrices: false,
      setAutoUpdatePrices: enabled => {
        set({ autoUpdatePrices: enabled });
      },

      // Last calculation cache
      lastCalculation: {},
      setLastCalculation: data => {
        set({ lastCalculation: data });
      },
    }),
    {
      name: 'camper-planner-cost-settings',
      // Only persist certain fields
      partialize: state => ({
        fuelConsumptionSettings: state.fuelConsumptionSettings,
        fuelPriceSettings: state.fuelPriceSettings,
        preferences: state.preferences,
        autoUpdatePrices: state.autoUpdatePrices,
      }),
    }
  )
);

// Helper function to create route hash for caching
export function createRouteHash(
  waypoints: Array<{ id: string }>,
  vehicleProfile?: { type?: string; length?: number; weight?: number }
): string {
  const waypointIds = waypoints.map(w => w.id).join('-');
  const vehicleHash = vehicleProfile
    ? `${vehicleProfile.type}-${vehicleProfile.length}-${vehicleProfile.weight}`
    : 'default';
  return `${waypointIds}_${vehicleHash}`;
}

// Helper function to check if cached calculation is still valid
export function isCacheValid(timestamp?: number, maxAgeMinutes: number = 30): boolean {
  if (!timestamp) return false;
  const now = Date.now();
  const maxAge = maxAgeMinutes * 60 * 1000; // Convert to milliseconds
  return now - timestamp < maxAge;
}
