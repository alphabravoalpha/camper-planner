import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  TripStorageService,
  type Trip,
  type TripMetadata,
  type TripData,
} from '../TripStorageService';
import { type Waypoint, type VehicleProfile } from '../../store';

describe('TripStorageService', () => {
  let testTrip: Omit<Trip, 'timestamps'>;
  let testWaypoints: Waypoint[];
  let testVehicleProfile: VehicleProfile;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();

    // Create test waypoints
    testWaypoints = [
      { id: '1', name: 'Paris', lat: 48.8566, lng: 2.3522, type: 'start' },
      { id: '2', name: 'Lyon', lat: 45.764, lng: 4.8357, type: 'waypoint' },
      { id: '3', name: 'Marseille', lat: 43.2965, lng: 5.3698, type: 'end' },
    ];

    testVehicleProfile = {
      id: 'test-vehicle',
      name: 'Test Motorhome',
      type: 'motorhome',
      height: 3.2,
      width: 2.3,
      weight: 3.5,
      length: 7.0,
      fuelType: 'diesel',
    };

    // Create test trip
    const metadata: TripMetadata = {
      id: 'test-trip-1',
      name: 'French Riviera Tour',
      description: 'A scenic tour of the French coast',
      category: 'leisure',
      tags: ['beach', 'coastal', 'france'],
      duration: 7,
      difficulty: 'easy',
      season: 'summer',
      countries: ['France'],
      estimatedCost: 500,
      currency: 'EUR',
      isTemplate: false,
      isPublic: false,
    };

    const data: TripData = {
      waypoints: testWaypoints,
      vehicleProfile: testVehicleProfile,
      routePreferences: {
        avoidTolls: false,
        avoidFerries: false,
        preferScenic: true,
        fuelEfficient: false,
      },
      campsiteSelections: [
        {
          waypointId: '2',
          campsiteId: 'campsite-lyon-1',
          nights: 2,
          cost: 50,
        },
      ],
    };

    testTrip = { metadata, data };
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Basic Trip Operations', () => {
    it('should save a new trip', async () => {
      const saved = await TripStorageService.saveTrip(testTrip);

      expect(saved).toBeDefined();
      expect(saved.metadata.id).toBe('test-trip-1');
      expect(saved.metadata.name).toBe('French Riviera Tour');
      expect(saved.timestamps).toBeDefined();
      expect(saved.timestamps.created).toBeInstanceOf(Date);
      expect(saved.timestamps.modified).toBeInstanceOf(Date);
      expect(saved.timestamps.version).toBe('1.0.0');
    });

    it('should load an existing trip', async () => {
      await TripStorageService.saveTrip(testTrip);
      const loaded = await TripStorageService.loadTrip('test-trip-1');

      expect(loaded).toBeDefined();
      expect(loaded?.metadata.id).toBe('test-trip-1');
      expect(loaded?.metadata.name).toBe('French Riviera Tour');
      expect(loaded?.data.waypoints).toHaveLength(3);
    });

    it('should return null for non-existent trip', async () => {
      const loaded = await TripStorageService.loadTrip('non-existent-id');
      expect(loaded).toBeNull();
    });

    it('should update existing trip when saving with same ID', async () => {
      const saved1 = await TripStorageService.saveTrip(testTrip);

      // Modify and save again
      const modified = {
        ...testTrip,
        metadata: { ...testTrip.metadata, name: 'Updated Tour' },
      };
      const saved2 = await TripStorageService.saveTrip(modified);

      expect(saved2.metadata.name).toBe('Updated Tour');
      expect(saved2.timestamps.created).toEqual(saved1.timestamps.created);
      expect(saved2.timestamps.modified.getTime()).toBeGreaterThanOrEqual(
        saved1.timestamps.modified.getTime()
      );
    });

    it('should delete a trip', async () => {
      await TripStorageService.saveTrip(testTrip);
      const deleted = await TripStorageService.deleteTrip('test-trip-1');

      expect(deleted).toBe(true);

      const loaded = await TripStorageService.loadTrip('test-trip-1');
      expect(loaded).toBeNull();
    });

    it('should return false when deleting non-existent trip', async () => {
      const deleted = await TripStorageService.deleteTrip('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('Multiple Trip Management', () => {
    it('should get all trips', async () => {
      await TripStorageService.saveTrip(testTrip);

      const trip2 = {
        ...testTrip,
        metadata: { ...testTrip.metadata, id: 'test-trip-2', name: 'Trip 2' },
      };
      await TripStorageService.saveTrip(trip2);

      const allTrips = await TripStorageService.getAllTrips();
      expect(allTrips).toHaveLength(2);
    });

    it('should get trip summaries', async () => {
      await TripStorageService.saveTrip(testTrip);

      const summaries = await TripStorageService.getTripSummaries();

      expect(summaries).toHaveLength(1);
      expect(summaries[0]).toHaveProperty('id');
      expect(summaries[0]).toHaveProperty('name');
      expect(summaries[0]).toHaveProperty('waypointCount');
      expect(summaries[0].waypointCount).toBe(3);
    });

    it('should filter trip summaries by category', async () => {
      await TripStorageService.saveTrip(testTrip);

      const trip2 = {
        ...testTrip,
        metadata: {
          ...testTrip.metadata,
          id: 'test-trip-2',
          name: 'Business Trip',
          category: 'business' as const,
        },
      };
      await TripStorageService.saveTrip(trip2);

      const leisureTrips = await TripStorageService.getTripSummaries({
        category: 'leisure',
      });

      expect(leisureTrips).toHaveLength(1);
      expect(leisureTrips[0].category).toBe('leisure');
    });

    it('should filter trip summaries by tags', async () => {
      await TripStorageService.saveTrip(testTrip);

      const trip2 = {
        ...testTrip,
        metadata: {
          ...testTrip.metadata,
          id: 'test-trip-2',
          tags: ['mountain', 'hiking'],
        },
      };
      await TripStorageService.saveTrip(trip2);

      const beachTrips = await TripStorageService.getTripSummaries({
        tags: ['beach'],
      });

      expect(beachTrips).toHaveLength(1);
      expect(beachTrips[0].tags).toContain('beach');
    });
  });

  describe('Trip Duplication', () => {
    it('should duplicate a trip', async () => {
      await TripStorageService.saveTrip(testTrip);

      const duplicated = await TripStorageService.duplicateTrip('test-trip-1');

      expect(duplicated).toBeDefined();
      expect(duplicated?.metadata.id).not.toBe('test-trip-1');
      expect(duplicated?.metadata.name).toContain('Copy');
      expect(duplicated?.data.waypoints).toHaveLength(3);
    });

    it('should duplicate with custom name', async () => {
      await TripStorageService.saveTrip(testTrip);

      const duplicated = await TripStorageService.duplicateTrip('test-trip-1', 'My Custom Copy');

      expect(duplicated?.metadata.name).toBe('My Custom Copy');
    });

    it('should return null when duplicating non-existent trip', async () => {
      const duplicated = await TripStorageService.duplicateTrip('non-existent-id');
      expect(duplicated).toBeNull();
    });
  });

  describe('Import/Export', () => {
    it('should export a trip as JSON', async () => {
      await TripStorageService.saveTrip(testTrip);

      const exported = await TripStorageService.exportTrip('test-trip-1');

      expect(exported).toBeDefined();
      expect(typeof exported).toBe('string');

      const parsed = JSON.parse(exported!);
      expect(parsed.metadata.id).toBe('test-trip-1');
      expect(parsed.data.waypoints).toHaveLength(3);
    });

    it('should return null when exporting non-existent trip', async () => {
      const exported = await TripStorageService.exportTrip('non-existent-id');
      expect(exported).toBeNull();
    });

    it('should import a trip from JSON', async () => {
      await TripStorageService.saveTrip(testTrip);
      const exported = await TripStorageService.exportTrip('test-trip-1');

      localStorage.clear();

      const imported = await TripStorageService.importTrip(exported!);

      expect(imported).toBeDefined();
      expect(imported?.metadata.name).toBe('French Riviera Tour (Imported)');
      expect(imported?.data.waypoints).toHaveLength(3);
    });

    it('should import with custom name', async () => {
      await TripStorageService.saveTrip(testTrip);
      const exported = await TripStorageService.exportTrip('test-trip-1');

      const imported = await TripStorageService.importTrip(exported!, 'Imported Tour');

      expect(imported?.metadata.name).toBe('Imported Tour');
    });

    it('should return null for invalid JSON', async () => {
      const imported = await TripStorageService.importTrip('invalid json');
      expect(imported).toBeNull();
    });
  });

  describe('Trip History', () => {
    it('should track recently accessed trips', async () => {
      await TripStorageService.saveTrip(testTrip);
      await TripStorageService.loadTrip('test-trip-1');

      const recent = await TripStorageService.getRecentTrips(10);

      expect(recent).toBeDefined();
      expect(Array.isArray(recent)).toBe(true);
      expect(recent.length).toBeGreaterThan(0);
    });

    it('should get trip history', async () => {
      await TripStorageService.saveTrip(testTrip);
      await TripStorageService.loadTrip('test-trip-1');

      const history = await TripStorageService.getTripHistory();

      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);

      if (history.length > 0) {
        expect(history[0]).toHaveProperty('tripId');
        expect(history[0]).toHaveProperty('accessedAt');
        expect(history[0]).toHaveProperty('tripName');
      }
    });

    it('should limit history items to MAX_HISTORY_ITEMS', async () => {
      // Save and load many trips to test limit
      for (let i = 0; i < 60; i++) {
        const trip = {
          ...testTrip,
          metadata: { ...testTrip.metadata, id: `trip-${i}`, name: `Trip ${i}` },
        };
        await TripStorageService.saveTrip(trip);
      }

      const history = await TripStorageService.getTripHistory();
      expect(history.length).toBeLessThanOrEqual(50); // MAX_HISTORY_ITEMS = 50
    });
  });

  describe('Trip Comparison', () => {
    it('should compare multiple trips', async () => {
      await TripStorageService.saveTrip(testTrip);

      const trip2 = {
        ...testTrip,
        metadata: {
          ...testTrip.metadata,
          id: 'test-trip-2',
          name: 'Trip 2',
          estimatedCost: 300,
        },
      };
      await TripStorageService.saveTrip(trip2);

      const comparison = await TripStorageService.compareTrips(['test-trip-1', 'test-trip-2']);

      expect(comparison).toBeDefined();
      expect(comparison?.trips).toHaveLength(2);
      expect(comparison?.comparison).toHaveProperty('costs');
      expect(comparison?.comparison).toHaveProperty('routes');
      expect(comparison?.comparison).toHaveProperty('analysis');
    });

    it('should return null when comparing less than 2 trips', async () => {
      await TripStorageService.saveTrip(testTrip);

      const comparison = await TripStorageService.compareTrips(['test-trip-1']);
      expect(comparison).toBeNull();
    });

    it('should identify cheapest trip when cost calculations exist', async () => {
      const trip1 = {
        ...testTrip,
        data: {
          ...testTrip.data,
          costCalculations: {
            breakdown: {
              totalCost: 500,
              fuelCost: 400,
              accommodationCost: 100,
              tollCost: 0,
              campsiteCost: 0,
              foodCost: 0,
              ferryCost: 0,
              otherCosts: 0,
              currency: 'EUR',
              segments: [],
              dailyBreakdown: [],
            },
            fuelSettings: {
              consumptionType: 'l_per_100km' as const,
              consumption: 12,
              fuelType: 'diesel' as const,
            },
            priceSettings: {
              priceType: 'manual' as const,
              manualPrices: {
                petrol: 1.65,
                diesel: 1.55,
                lpg: 0.85,
                electricity: 0.35,
              },
              currency: 'EUR' as const,
            },
            lastCalculated: new Date(),
          },
        },
      };
      await TripStorageService.saveTrip(trip1);

      const trip2 = {
        ...testTrip,
        metadata: {
          ...testTrip.metadata,
          id: 'test-trip-2',
        },
        data: {
          ...testTrip.data,
          costCalculations: {
            breakdown: {
              totalCost: 300, // Cheaper
              fuelCost: 250,
              accommodationCost: 50,
              tollCost: 0,
              campsiteCost: 0,
              foodCost: 0,
              ferryCost: 0,
              otherCosts: 0,
              currency: 'EUR',
              segments: [],
              dailyBreakdown: [],
            },
            fuelSettings: {
              consumptionType: 'l_per_100km' as const,
              consumption: 10,
              fuelType: 'diesel' as const,
            },
            priceSettings: {
              priceType: 'manual' as const,
              manualPrices: {
                petrol: 1.65,
                diesel: 1.55,
                lpg: 0.85,
                electricity: 0.35,
              },
              currency: 'EUR' as const,
            },
            lastCalculated: new Date(),
          },
        },
      };
      await TripStorageService.saveTrip(trip2);

      const comparison = await TripStorageService.compareTrips(['test-trip-1', 'test-trip-2']);

      expect(comparison?.comparison.analysis.cheapest).toBe('test-trip-2');
    });
  });

  describe('Search and Filtering', () => {
    it('should search trips by name', async () => {
      await TripStorageService.saveTrip(testTrip);

      const trip2 = {
        ...testTrip,
        metadata: {
          ...testTrip.metadata,
          id: 'test-trip-2',
          name: 'Alpine Adventure',
        },
      };
      await TripStorageService.saveTrip(trip2);

      const results = await TripStorageService.searchTrips('riviera');

      expect(results).toHaveLength(1);
      expect(results[0].name).toContain('Riviera');
    });

    it('should search trips by tags', async () => {
      await TripStorageService.saveTrip(testTrip);

      const results = await TripStorageService.searchTrips('beach');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].tags).toContain('beach');
    });

    it('should return empty array for no matches', async () => {
      await TripStorageService.saveTrip(testTrip);

      const results = await TripStorageService.searchTrips('nonexistent');
      expect(results).toHaveLength(0);
    });

    it('should get all trip categories', async () => {
      await TripStorageService.saveTrip(testTrip);

      const trip2 = {
        ...testTrip,
        metadata: {
          ...testTrip.metadata,
          id: 'test-trip-2',
          category: 'business' as const,
        },
      };
      await TripStorageService.saveTrip(trip2);

      const categories = await TripStorageService.getTripCategories();

      expect(categories).toBeDefined();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);

      const leisure = categories.find(c => c.category === 'leisure');
      expect(leisure?.count).toBe(1);
    });

    it('should get all tags', async () => {
      await TripStorageService.saveTrip(testTrip);

      const tags = await TripStorageService.getAllTags();

      expect(tags).toBeDefined();
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBe(3); // beach, coastal, france

      const beachTag = tags.find(t => t.tag === 'beach');
      expect(beachTag?.count).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty localStorage', async () => {
      const allTrips = await TripStorageService.getAllTrips();
      expect(allTrips).toHaveLength(0);
    });

    it('should handle trip with no waypoints', async () => {
      const emptyTrip = {
        ...testTrip,
        data: { ...testTrip.data, waypoints: [] },
      };

      const saved = await TripStorageService.saveTrip(emptyTrip);
      expect(saved.data.waypoints).toHaveLength(0);
    });

    it('should handle trip with minimal metadata', async () => {
      const minimalTrip: Omit<Trip, 'timestamps'> = {
        metadata: {
          id: 'minimal-trip',
          name: 'Minimal',
          category: 'custom',
          tags: [],
          duration: 1,
          difficulty: 'easy',
          season: 'year_round',
          countries: [],
          estimatedCost: 0,
          currency: 'EUR',
          isTemplate: false,
          isPublic: false,
        },
        data: {
          waypoints: [],
          routePreferences: {
            avoidTolls: false,
            avoidFerries: false,
            preferScenic: false,
            fuelEfficient: false,
          },
          campsiteSelections: [],
        },
      };

      const saved = await TripStorageService.saveTrip(minimalTrip);
      expect(saved).toBeDefined();
      expect(saved.metadata.id).toBe('minimal-trip');
    });

    it('should handle corrupted localStorage data', async () => {
      localStorage.setItem('camper-planner-trips', 'corrupted data');

      const allTrips = await TripStorageService.getAllTrips();
      expect(allTrips).toHaveLength(0);
    });
  });

  describe('Timestamp Management', () => {
    it('should update lastOpened when loading trip', async () => {
      const saved = await TripStorageService.saveTrip(testTrip);
      const originalLastOpened = saved.timestamps.lastOpened;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const loaded = await TripStorageService.loadTrip('test-trip-1');

      expect(loaded?.timestamps.lastOpened.getTime()).toBeGreaterThan(originalLastOpened.getTime());
    });

    it('should preserve created timestamp on updates', async () => {
      const saved1 = await TripStorageService.saveTrip(testTrip);
      const originalCreated = saved1.timestamps.created;

      const modified = {
        ...testTrip,
        metadata: { ...testTrip.metadata, name: 'Updated' },
      };
      const saved2 = await TripStorageService.saveTrip(modified);

      expect(saved2.timestamps.created).toEqual(originalCreated);
    });

    it('should update modified timestamp on changes', async () => {
      const saved1 = await TripStorageService.saveTrip(testTrip);

      await new Promise(resolve => setTimeout(resolve, 10));

      const modified = {
        ...testTrip,
        metadata: { ...testTrip.metadata, name: 'Updated' },
      };
      const saved2 = await TripStorageService.saveTrip(modified);

      expect(saved2.timestamps.modified.getTime()).toBeGreaterThan(
        saved1.timestamps.modified.getTime()
      );
    });
  });
});
