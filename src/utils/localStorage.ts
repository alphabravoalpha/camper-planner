// Local Storage Utilities
// Handles trip data persistence and schema migration

export const LocalStorageKeys = {
  TRIPS: 'camper-planner-trips',
  VEHICLE_PROFILE: 'camper-planner-vehicle',
  SETTINGS: 'camper-planner-settings',
  APP_VERSION: 'camper-planner-version'
} as const;

// Basic local storage utilities - Phase 1 foundation
export const localStorageUtils = {
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  },

  remove: (key: string): void => {
    localStorage.removeItem(key);
  },

  clear: (): void => {
    localStorage.clear();
  }
};