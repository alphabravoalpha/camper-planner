// Trip Settings Store
// Persisted Zustand store — single source of truth for dates, driving style,
// crossing, budget, and fuel settings.

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  type TripSettings,
  type DrivingStyle,
  type Currency,
  type CrossingType,
  type FuelType,
  type ConsumptionUnit,
  DEFAULT_TRIP_SETTINGS,
  DEFAULT_FUEL_PRICES,
  getDrivingLimitsForStyle,
} from '../types/tripSettings';

// ============================================
// State Interface
// ============================================

interface TripSettingsState {
  settings: TripSettings;

  // Date setters
  setStartDate: (date: string | undefined) => void;
  setEndDate: (date: string | undefined) => void;
  setDuration: (days: number | undefined) => void;

  // Driving setters
  setDrivingStyle: (style: DrivingStyle) => void;
  setMaxDrivingHours: (hours: number) => void;
  setRestDayFrequency: (frequency: number) => void;

  // Crossing setters
  setCrossingType: (type: CrossingType) => void;
  setCrossingCost: (cost: number | undefined) => void;

  // Budget setters
  setCurrency: (currency: Currency) => void;
  setDailyBudget: (budget: Partial<TripSettings['dailyBudget']>) => void;

  // Fuel setters
  setFuelConsumption: (value: number) => void;
  setFuelConsumptionUnit: (unit: ConsumptionUnit) => void;
  setFuelType: (fuelType: FuelType) => void;
  setTankCapacity: (capacity: number) => void;
  setFuelPrice: (pricePerLitre: number) => void;

  // Bulk operations
  updateSettings: (partial: Partial<TripSettings>) => void;
  loadSettings: (settings: TripSettings) => void;
  resetSettings: () => void;
}

// ============================================
// Store
// ============================================

export const useTripSettingsStore = create<TripSettingsState>()(
  persist(
    devtools(
      set => ({
        settings: { ...DEFAULT_TRIP_SETTINGS },

        // ---- Date setters ----

        setStartDate: date =>
          set(
            state => ({ settings: { ...state.settings, startDate: date } }),
            false,
            'setStartDate'
          ),

        setEndDate: date =>
          set(state => ({ settings: { ...state.settings, endDate: date } }), false, 'setEndDate'),

        setDuration: days =>
          set(state => ({ settings: { ...state.settings, duration: days } }), false, 'setDuration'),

        // ---- Driving setters ----

        setDrivingStyle: style =>
          set(
            state => ({
              settings: {
                ...state.settings,
                drivingStyle: style,
                maxDrivingHoursPerDay: getDrivingLimitsForStyle(style).maxHours,
              },
            }),
            false,
            'setDrivingStyle'
          ),

        setMaxDrivingHours: hours =>
          set(
            state => ({
              settings: { ...state.settings, maxDrivingHoursPerDay: hours },
            }),
            false,
            'setMaxDrivingHours'
          ),

        setRestDayFrequency: frequency =>
          set(
            state => ({
              settings: { ...state.settings, restDayFrequency: frequency },
            }),
            false,
            'setRestDayFrequency'
          ),

        // ---- Crossing setters ----

        setCrossingType: type =>
          set(
            state => ({
              settings: {
                ...state.settings,
                crossing: { ...state.settings.crossing, type },
              },
            }),
            false,
            'setCrossingType'
          ),

        setCrossingCost: cost =>
          set(
            state => ({
              settings: {
                ...state.settings,
                crossing: { ...state.settings.crossing, estimatedCost: cost },
              },
            }),
            false,
            'setCrossingCost'
          ),

        // ---- Budget setters ----

        setCurrency: currency =>
          set(
            state => {
              const fuelType = state.settings.fuelConsumption.fuelType;
              return {
                settings: {
                  ...state.settings,
                  currency,
                  fuelPricePerLitre: DEFAULT_FUEL_PRICES[currency][fuelType],
                },
              };
            },
            false,
            'setCurrency'
          ),

        setDailyBudget: budget =>
          set(
            state => ({
              settings: {
                ...state.settings,
                dailyBudget: { ...state.settings.dailyBudget, ...budget },
              },
            }),
            false,
            'setDailyBudget'
          ),

        // ---- Fuel setters ----

        setFuelConsumption: value =>
          set(
            state => ({
              settings: {
                ...state.settings,
                fuelConsumption: { ...state.settings.fuelConsumption, value },
              },
            }),
            false,
            'setFuelConsumption'
          ),

        setFuelConsumptionUnit: unit =>
          set(
            state => ({
              settings: {
                ...state.settings,
                fuelConsumption: { ...state.settings.fuelConsumption, unit },
              },
            }),
            false,
            'setFuelConsumptionUnit'
          ),

        setFuelType: fuelType =>
          set(
            state => {
              const { currency } = state.settings;
              return {
                settings: {
                  ...state.settings,
                  fuelConsumption: { ...state.settings.fuelConsumption, fuelType },
                  fuelPricePerLitre: DEFAULT_FUEL_PRICES[currency][fuelType],
                },
              };
            },
            false,
            'setFuelType'
          ),

        setTankCapacity: capacity =>
          set(
            state => ({
              settings: {
                ...state.settings,
                fuelConsumption: {
                  ...state.settings.fuelConsumption,
                  tankCapacity: capacity,
                },
              },
            }),
            false,
            'setTankCapacity'
          ),

        setFuelPrice: pricePerLitre =>
          set(
            state => ({
              settings: { ...state.settings, fuelPricePerLitre: pricePerLitre },
            }),
            false,
            'setFuelPrice'
          ),

        // ---- Bulk operations ----

        updateSettings: partial =>
          set(
            state => ({
              settings: { ...state.settings, ...partial },
            }),
            false,
            'updateSettings'
          ),

        loadSettings: settings => set({ settings }, false, 'loadSettings'),

        resetSettings: () =>
          set({ settings: { ...DEFAULT_TRIP_SETTINGS } }, false, 'resetSettings'),
      }),
      { name: 'trip-settings-store' }
    ),
    {
      name: 'camper-planner-trip-settings',
      version: 1,
      partialize: state => ({ settings: state.settings }),
    }
  )
);
