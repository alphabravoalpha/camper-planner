// Trip Storage Service
// Phase 5.3: Comprehensive trip management with local storage persistence

import type { Waypoint } from '../store';
import type { VehicleProfile } from '../store';
import type { CostBreakdown, FuelConsumptionSettings, FuelPriceSettings } from './CostCalculationService';
import type { OptimizationResult } from './RouteOptimizationService';

export interface TripMetadata {
  id: string;
  name: string;
  description?: string;
  category: 'leisure' | 'business' | 'adventure' | 'family' | 'romantic' | 'custom';
  tags: string[];
  duration: number; // days
  difficulty: 'easy' | 'moderate' | 'challenging';
  season: 'spring' | 'summer' | 'autumn' | 'winter' | 'year_round';
  countries: string[];
  estimatedCost: number;
  currency: string;
  isTemplate: boolean;
  isPublic: boolean; // For future sharing functionality
}

export interface TripData {
  waypoints: Waypoint[];
  vehicleProfile?: VehicleProfile;
  routePreferences: {
    avoidTolls: boolean;
    avoidFerries: boolean;
    preferScenic: boolean;
    fuelEfficient: boolean;
  };
  campsiteSelections: Array<{
    waypointId: string;
    campsiteId: string;
    nights: number;
    cost: number;
  }>;
  costCalculations?: {
    breakdown: CostBreakdown;
    fuelSettings: FuelConsumptionSettings;
    priceSettings: FuelPriceSettings;
    lastCalculated: Date;
  };
  optimization?: {
    result: OptimizationResult;
    settings: any;
    appliedAt: Date;
  };
}

export interface Trip {
  metadata: TripMetadata;
  data: TripData;
  timestamps: {
    created: Date;
    modified: Date;
    lastOpened: Date;
    version: string;
  };
  sharing?: {
    exportId?: string;
    sharedBy?: string;
    sharedAt?: Date;
    originalTripId?: string;
  };
}

export interface TripTemplate extends Omit<Trip, 'timestamps'> {
  templateInfo: {
    templateId: string;
    title: string;
    description: string;
    highlights: string[];
    recommendedMonths: number[];
    estimatedDuration: number;
    difficultyReason: string;
    author: string;
    popularity: number;
  };
}

export interface TripSummary {
  id: string;
  name: string;
  category: string;
  tags: string[];
  duration: number;
  estimatedCost: number;
  currency: string;
  waypointCount: number;
  countries: string[];
  lastModified: Date;
  lastOpened: Date;
  isTemplate: boolean;
  thumbnail?: string; // Base64 encoded route preview
}

export interface TripComparison {
  trips: Trip[];
  comparison: {
    costs: {
      [tripId: string]: {
        total: number;
        fuel: number;
        accommodation: number;
        tolls: number;
      };
    };
    routes: {
      [tripId: string]: {
        distance: number;
        duration: number;
        waypointCount: number;
        countries: string[];
      };
    };
    analysis: {
      cheapest: string;
      shortest: string;
      fastest: string;
      mostScenic: string;
      recommendations: Array<{
        tripId: string;
        reason: string;
        advantage: string;
      }>;
    };
  };
}

const TRIP_STORAGE_KEY = 'camper-planner-trips';
const TRIP_TEMPLATES_KEY = 'camper-planner-trip-templates';
const TRIP_HISTORY_KEY = 'camper-planner-trip-history';
const CURRENT_VERSION = '1.0.0';
const MAX_HISTORY_ITEMS = 50;

export class TripStorageService {
  /**
   * Save a trip to local storage
   */
  static async saveTrip(trip: Omit<Trip, 'timestamps'>): Promise<Trip> {
    const now = new Date();
    const existingTrip = await this.loadTrip(trip.metadata.id);

    const fullTrip: Trip = {
      ...trip,
      timestamps: {
        created: existingTrip?.timestamps.created || now,
        modified: now,
        lastOpened: existingTrip?.timestamps.lastOpened || now,
        version: CURRENT_VERSION
      }
    };

    // Save to storage
    const allTrips = await this.getAllTrips();
    const existingIndex = allTrips.findIndex(t => t.metadata.id === trip.metadata.id);

    if (existingIndex >= 0) {
      allTrips[existingIndex] = fullTrip;
    } else {
      allTrips.push(fullTrip);
    }

    localStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify(allTrips));

    // Update history
    await this.addToHistory(fullTrip);

    return fullTrip;
  }

  /**
   * Load a specific trip by ID
   */
  static async loadTrip(tripId: string): Promise<Trip | null> {
    const allTrips = await this.getAllTrips();
    const trip = allTrips.find(t => t.metadata.id === tripId);

    if (trip) {
      // Update last opened timestamp
      trip.timestamps.lastOpened = new Date();
      await this.saveTrip(trip);
    }

    return trip || null;
  }

  /**
   * Get all trips with optional filtering
   */
  static async getAllTrips(): Promise<Trip[]> {
    try {
      const stored = localStorage.getItem(TRIP_STORAGE_KEY);
      if (!stored) return [];

      const trips = JSON.parse(stored) as Trip[];

      // Convert date strings back to Date objects
      return trips.map(trip => ({
        ...trip,
        timestamps: {
          ...trip.timestamps,
          created: new Date(trip.timestamps.created),
          modified: new Date(trip.timestamps.modified),
          lastOpened: new Date(trip.timestamps.lastOpened)
        },
        data: {
          ...trip.data,
          costCalculations: trip.data.costCalculations ? {
            ...trip.data.costCalculations,
            lastCalculated: new Date(trip.data.costCalculations.lastCalculated)
          } : undefined,
          optimization: trip.data.optimization ? {
            ...trip.data.optimization,
            appliedAt: new Date(trip.data.optimization.appliedAt)
          } : undefined
        }
      }));
    } catch (error) {
      console.error('Failed to load trips:', error);
      return [];
    }
  }

  /**
   * Get trip summaries for quick access
   */
  static async getTripSummaries(filters?: {
    category?: string;
    tags?: string[];
    excludeTemplates?: boolean;
  }): Promise<TripSummary[]> {
    const allTrips = await this.getAllTrips();

    let filteredTrips = allTrips;

    if (filters?.excludeTemplates) {
      filteredTrips = filteredTrips.filter(t => !t.metadata.isTemplate);
    }

    if (filters?.category) {
      filteredTrips = filteredTrips.filter(t => t.metadata.category === filters.category);
    }

    if (filters?.tags && filters.tags.length > 0) {
      filteredTrips = filteredTrips.filter(t =>
        filters.tags!.some(tag => t.metadata.tags.includes(tag))
      );
    }

    return filteredTrips.map(trip => ({
      id: trip.metadata.id,
      name: trip.metadata.name,
      category: trip.metadata.category,
      tags: trip.metadata.tags,
      duration: trip.metadata.duration,
      estimatedCost: trip.metadata.estimatedCost,
      currency: trip.metadata.currency,
      waypointCount: trip.data.waypoints.length,
      countries: trip.metadata.countries,
      lastModified: trip.timestamps.modified,
      lastOpened: trip.timestamps.lastOpened,
      isTemplate: trip.metadata.isTemplate
    })).sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  }

  /**
   * Delete a trip
   */
  static async deleteTrip(tripId: string): Promise<boolean> {
    try {
      const allTrips = await this.getAllTrips();
      const filteredTrips = allTrips.filter(t => t.metadata.id !== tripId);

      localStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify(filteredTrips));
      return true;
    } catch (error) {
      console.error('Failed to delete trip:', error);
      return false;
    }
  }

  /**
   * Duplicate a trip with new ID
   */
  static async duplicateTrip(tripId: string, newName?: string): Promise<Trip | null> {
    const originalTrip = await this.loadTrip(tripId);
    if (!originalTrip) return null;

    const newTripId = `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const duplicatedTrip: Trip = {
      ...originalTrip,
      metadata: {
        ...originalTrip.metadata,
        id: newTripId,
        name: newName || `${originalTrip.metadata.name} (Copy)`,
        isTemplate: false, // Copies are never templates
        isPublic: false
      }
    };

    return await this.saveTrip(duplicatedTrip);
  }

  /**
   * Export trip data for sharing
   */
  static async exportTrip(tripId: string): Promise<string | null> {
    const trip = await this.loadTrip(tripId);
    if (!trip) return null;

    const exportData = {
      ...trip,
      exportInfo: {
        exportedAt: new Date(),
        exportedBy: 'camper-planner',
        version: CURRENT_VERSION,
        exportId: `export_${Date.now()}`
      }
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import trip from JSON data
   */
  static async importTrip(jsonData: string, customName?: string): Promise<Trip | null> {
    try {
      const importedData = JSON.parse(jsonData);

      // Validate imported data structure
      if (!importedData.metadata || !importedData.data) {
        throw new Error('Invalid trip data structure');
      }

      const newTripId = `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const importedTrip: Trip = {
        metadata: {
          ...importedData.metadata,
          id: newTripId,
          name: customName || `${importedData.metadata.name} (Imported)`,
          isTemplate: false,
          isPublic: false
        },
        data: importedData.data,
        timestamps: {
          created: new Date(),
          modified: new Date(),
          lastOpened: new Date(),
          version: CURRENT_VERSION
        },
        sharing: {
          originalTripId: importedData.metadata.id,
          sharedBy: importedData.exportInfo?.exportedBy || 'unknown',
          sharedAt: importedData.exportInfo?.exportedAt ? new Date(importedData.exportInfo.exportedAt) : new Date(),
          exportId: importedData.exportInfo?.exportId
        }
      };

      return await this.saveTrip(importedTrip);
    } catch (error) {
      console.error('Failed to import trip:', error);
      return null;
    }
  }

  /**
   * Get recent trips for quick access
   */
  static async getRecentTrips(limit: number = 10): Promise<TripSummary[]> {
    const summaries = await this.getTripSummaries({ excludeTemplates: true });
    return summaries
      .sort((a, b) => b.lastOpened.getTime() - a.lastOpened.getTime())
      .slice(0, limit);
  }

  /**
   * Add trip to history
   */
  static async addToHistory(trip: Trip): Promise<void> {
    try {
      const stored = localStorage.getItem(TRIP_HISTORY_KEY);
      let history: Array<{ tripId: string; accessedAt: Date; tripName: string }> = [];

      if (stored) {
        history = JSON.parse(stored).map((item: any) => ({
          ...item,
          accessedAt: new Date(item.accessedAt)
        }));
      }

      // Remove existing entry for this trip
      history = history.filter(item => item.tripId !== trip.metadata.id);

      // Add new entry at the beginning
      history.unshift({
        tripId: trip.metadata.id,
        accessedAt: new Date(),
        tripName: trip.metadata.name
      });

      // Keep only the most recent items
      history = history.slice(0, MAX_HISTORY_ITEMS);

      localStorage.setItem(TRIP_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to update trip history:', error);
    }
  }

  /**
   * Get trip history
   */
  static async getTripHistory(): Promise<Array<{ tripId: string; accessedAt: Date; tripName: string }>> {
    try {
      const stored = localStorage.getItem(TRIP_HISTORY_KEY);
      if (!stored) return [];

      return JSON.parse(stored).map((item: any) => ({
        ...item,
        accessedAt: new Date(item.accessedAt)
      }));
    } catch (error) {
      console.error('Failed to load trip history:', error);
      return [];
    }
  }

  /**
   * Compare multiple trips
   */
  static async compareTrips(tripIds: string[]): Promise<TripComparison | null> {
    try {
      const trips = await Promise.all(tripIds.map(id => this.loadTrip(id)));
      const validTrips = trips.filter(t => t !== null) as Trip[];

      if (validTrips.length < 2) return null;

      const comparison: TripComparison = {
        trips: validTrips,
        comparison: {
          costs: {},
          routes: {},
          analysis: {
            cheapest: '',
            shortest: '',
            fastest: '',
            mostScenic: '',
            recommendations: []
          }
        }
      };

      // Calculate comparisons
      let cheapestCost = Infinity;
      let shortestDistance = Infinity;
      let fastestDuration = Infinity;

      validTrips.forEach(trip => {
        const tripId = trip.metadata.id;

        // Cost analysis
        const costBreakdown = trip.data.costCalculations?.breakdown;
        if (costBreakdown) {
          comparison.comparison.costs[tripId] = {
            total: costBreakdown.totalCost,
            fuel: costBreakdown.fuelCost,
            accommodation: costBreakdown.accommodationCost,
            tolls: costBreakdown.tollCost
          };

          if (costBreakdown.totalCost < cheapestCost) {
            cheapestCost = costBreakdown.totalCost;
            comparison.comparison.analysis.cheapest = tripId;
          }
        }

        // Route analysis
        const totalDistance = this.calculateTotalDistance(trip.data.waypoints);
        const estimatedDuration = totalDistance / 70; // Rough estimate

        comparison.comparison.routes[tripId] = {
          distance: totalDistance,
          duration: estimatedDuration,
          waypointCount: trip.data.waypoints.length,
          countries: trip.metadata.countries
        };

        if (totalDistance < shortestDistance) {
          shortestDistance = totalDistance;
          comparison.comparison.analysis.shortest = tripId;
        }

        if (estimatedDuration < fastestDuration) {
          fastestDuration = estimatedDuration;
          comparison.comparison.analysis.fastest = tripId;
        }
      });

      // Generate recommendations
      validTrips.forEach(trip => {
        const tripId = trip.metadata.id;
        const recommendations = [];

        if (tripId === comparison.comparison.analysis.cheapest) {
          recommendations.push({
            tripId,
            reason: 'Most cost-effective option',
            advantage: `Lowest total cost: €${comparison.comparison.costs[tripId]?.total.toFixed(2) || 'N/A'}`
          });
        }

        if (tripId === comparison.comparison.analysis.shortest) {
          recommendations.push({
            tripId,
            reason: 'Shortest distance',
            advantage: `Least driving: ${shortestDistance.toFixed(0)}km`
          });
        }

        if (trip.metadata.tags.includes('scenic') || trip.metadata.tags.includes('nature')) {
          comparison.comparison.analysis.mostScenic = tripId;
          recommendations.push({
            tripId,
            reason: 'Most scenic route',
            advantage: 'Best for sightseeing and photography'
          });
        }

        comparison.comparison.analysis.recommendations.push(...recommendations);
      });

      return comparison;
    } catch (error) {
      console.error('Failed to compare trips:', error);
      return null;
    }
  }

  /**
   * Get trip categories and their counts
   */
  static async getTripCategories(): Promise<Array<{ category: string; count: number }>> {
    const trips = await this.getAllTrips();
    const categories = new Map<string, number>();

    trips.forEach(trip => {
      if (!trip.metadata.isTemplate) {
        const count = categories.get(trip.metadata.category) || 0;
        categories.set(trip.metadata.category, count + 1);
      }
    });

    return Array.from(categories.entries()).map(([category, count]) => ({
      category,
      count
    })).sort((a, b) => b.count - a.count);
  }

  /**
   * Get all unique tags across trips
   */
  static async getAllTags(): Promise<Array<{ tag: string; count: number }>> {
    const trips = await this.getAllTrips();
    const tags = new Map<string, number>();

    trips.forEach(trip => {
      if (!trip.metadata.isTemplate) {
        trip.metadata.tags.forEach(tag => {
          const count = tags.get(tag) || 0;
          tags.set(tag, count + 1);
        });
      }
    });

    return Array.from(tags.entries()).map(([tag, count]) => ({
      tag,
      count
    })).sort((a, b) => b.count - a.count);
  }

  /**
   * Search trips by name, description, or tags
   */
  static async searchTrips(query: string): Promise<TripSummary[]> {
    const allSummaries = await this.getTripSummaries();
    const searchTerm = query.toLowerCase();

    return allSummaries.filter(trip =>
      trip.name.toLowerCase().includes(searchTerm) ||
      trip.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      trip.countries.some(country => country.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Helper methods
   */
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
export const tripStorageService = new TripStorageService();