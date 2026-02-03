// Local Storage Utilities
// Handles trip data persistence and schema migration

import { type TripData, type VehicleProfile } from '../types';

export const LocalStorageKeys = {
  TRIPS: 'camper-planner-trips',
  VEHICLE_PROFILE: 'camper-planner-vehicle',
  SETTINGS: 'camper-planner-settings',
  APP_VERSION: 'camper-planner-version'
} as const;

// Current schema version
export const CURRENT_SCHEMA_VERSION = '1.0';

// Data migration functions
export class DataMigration {
  static migrate(data: any, fromVersion: string, toVersion: string): any {
    if (fromVersion === toVersion) {
      return data;
    }

    console.log(`Migrating data from ${fromVersion} to ${toVersion}`);

    // V1.0 to V2.0 migration (future implementation)
    if (fromVersion === '1.0' && toVersion === '2.0') {
      return this.migrateV1toV2(data);
    }

    // Return data as-is if no migration path found
    return data;
  }

  private static migrateV1toV2(v1Data: any): any {
    // V2 migration implementation (future)
    return {
      ...v1Data,
      version: '2.0',
      // Add V2 structures while preserving V1 data
      preferences: v1Data.preferences || {},
      community: v1Data.community || {}
    };
  }
}

// Trip data utilities following the technical architecture schema
export const tripDataUtils = {
  // Create a new trip with default structure
  createTrip: (name: string): TripData => ({
    id: `trip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    version: CURRENT_SCHEMA_VERSION,
    metadata: {
      name,
      created: Date.now(),
      modified: Date.now()
    },
    vehicle: {
      height: 0,
      width: 0,
      weight: 0,
      length: 0
    },
    route: {
      waypoints: [],
      optimized: false,
      totalDistance: 0,
      estimatedTime: 0
    }
  }),

  // Save trip to localStorage with version tracking
  saveTrip: (trip: TripData): void => {
    try {
      const trips = tripDataUtils.getAllTrips();
      const updatedTrips = trips.filter(t => t.id !== trip.id);
      updatedTrips.push({
        ...trip,
        metadata: {
          ...trip.metadata,
          modified: Date.now()
        }
      });

      localStorage.setItem(LocalStorageKeys.TRIPS, JSON.stringify(updatedTrips));
      localStorage.setItem(LocalStorageKeys.APP_VERSION, CURRENT_SCHEMA_VERSION);
    } catch (error) {
      console.error('Failed to save trip:', error);
      throw new Error('Failed to save trip to local storage');
    }
  },

  // Load a specific trip
  loadTrip: (id: string): TripData | null => {
    try {
      const trips = tripDataUtils.getAllTrips();
      return trips.find(trip => trip.id === id) || null;
    } catch (error) {
      console.error('Failed to load trip:', error);
      return null;
    }
  },

  // Get all trips with migration if needed
  getAllTrips: (): TripData[] => {
    try {
      const tripsData = localStorage.getItem(LocalStorageKeys.TRIPS);
      if (!tripsData) return [];

      const trips = JSON.parse(tripsData);
      const storedVersion = localStorage.getItem(LocalStorageKeys.APP_VERSION) || '1.0';

      // Migrate if necessary
      if (storedVersion !== CURRENT_SCHEMA_VERSION) {
        const migratedTrips = trips.map((trip: any) =>
          DataMigration.migrate(trip, storedVersion, CURRENT_SCHEMA_VERSION)
        );

        // Save migrated data
        localStorage.setItem(LocalStorageKeys.TRIPS, JSON.stringify(migratedTrips));
        localStorage.setItem(LocalStorageKeys.APP_VERSION, CURRENT_SCHEMA_VERSION);

        return migratedTrips;
      }

      return trips;
    } catch (error) {
      console.error('Failed to load trips:', error);
      return [];
    }
  },

  // Delete a trip
  deleteTrip: (id: string): void => {
    try {
      const trips = tripDataUtils.getAllTrips();
      const updatedTrips = trips.filter(trip => trip.id !== id);
      localStorage.setItem(LocalStorageKeys.TRIPS, JSON.stringify(updatedTrips));
    } catch (error) {
      console.error('Failed to delete trip:', error);
      throw new Error('Failed to delete trip from local storage');
    }
  },

  // Export trip data
  exportTrip: (trip: TripData): string => {
    return JSON.stringify(trip, null, 2);
  },

  // Import trip data
  importTrip: (jsonData: string): TripData => {
    try {
      const tripData = JSON.parse(jsonData);

      // Validate basic structure
      if (!tripData.id || !tripData.version) {
        throw new Error('Invalid trip data format');
      }

      // Migrate if from older version
      if (tripData.version !== CURRENT_SCHEMA_VERSION) {
        return DataMigration.migrate(tripData, tripData.version, CURRENT_SCHEMA_VERSION);
      }

      return tripData;
    } catch (error) {
      console.error('Failed to import trip:', error);
      throw new Error('Invalid trip data format');
    }
  }
};

// Vehicle profile utilities
export const vehicleProfileUtils = {
  // Save vehicle profile
  saveProfile: (profile: VehicleProfile): void => {
    try {
      localStorage.setItem(LocalStorageKeys.VEHICLE_PROFILE, JSON.stringify(profile));
    } catch (error) {
      console.error('Failed to save vehicle profile:', error);
      throw new Error('Failed to save vehicle profile');
    }
  },

  // Load vehicle profile
  loadProfile: (): VehicleProfile | null => {
    try {
      const profileData = localStorage.getItem(LocalStorageKeys.VEHICLE_PROFILE);
      return profileData ? JSON.parse(profileData) : null;
    } catch (error) {
      console.error('Failed to load vehicle profile:', error);
      return null;
    }
  },

  // Clear vehicle profile
  clearProfile: (): void => {
    localStorage.removeItem(LocalStorageKeys.VEHICLE_PROFILE);
  }
};

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
  },

  // Get storage usage info
  getStorageInfo: () => {
    let totalSize = 0;
    let itemCount = 0;

    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const itemSize = localStorage.getItem(key)?.length || 0;
        totalSize += itemSize;
        itemCount++;
      }
    }

    return {
      itemCount,
      totalSize,
      totalSizeKB: Math.round(totalSize / 1024),
      availableSpace: 5 * 1024 * 1024 - totalSize // Assume 5MB limit
    };
  }
};