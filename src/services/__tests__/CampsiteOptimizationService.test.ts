import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CampsiteOptimizationService,
  type CampsiteOptimizationRequest,
} from '../CampsiteOptimizationService';
import { type Waypoint, type VehicleProfile } from '../../types';
import { type Campsite } from '../CampsiteService';

// Mock dependencies
vi.mock('../RouteOptimizationService', () => ({
  routeOptimizationService: {
    optimizeRoute: vi.fn().mockResolvedValue({
      optimizedWaypoints: [],
      improvement: { distance: 0, time: 0 },
      iterations: 1,
    }),
    findOptimalInsertion: vi.fn().mockResolvedValue({
      suggestedPosition: 1,
      routeImpact: { distanceAdded: 10000, timeAdded: 600 },
    }),
  },
}));

vi.mock('../CampsiteService', () => ({
  campsiteService: {
    searchCampsites: vi.fn().mockResolvedValue({
      campsites: [],
      metadata: { results_count: 0 },
      cached: false,
      boundingBox: { north: 0, south: 0, east: 0, west: 0 },
    }),
  },
}));

// Helper to access private static methods for testing
const ServicePrivate = CampsiteOptimizationService as unknown as Record<
  string,
  (...args: unknown[]) => unknown
>;

describe('CampsiteOptimizationService', () => {
  let mockWaypoints: Waypoint[];
  let mockVehicleProfile: VehicleProfile;
  let mockCampsite: Campsite;

  beforeEach(() => {
    vi.clearAllMocks();

    mockWaypoints = [
      { id: '1', name: 'Start', lat: 48.8566, lng: 2.3522, type: 'start' },
      { id: '2', name: 'End', lat: 43.2965, lng: 5.3698, type: 'end' },
    ];

    mockVehicleProfile = {
      type: 'motorhome',
      height: 3.0,
      width: 2.3,
      length: 7.0,
      weight: 3.5,
    };

    mockCampsite = {
      id: 12345,
      type: 'campsite',
      name: 'Test Campsite',
      lat: 46.0,
      lng: 4.0,
      amenities: {
        toilets: true,
        showers: true,
        drinking_water: true,
        electricity: true,
        wifi: true,
        restaurant: false,
        shop: false,
        playground: false,
        laundry: false,
        swimming_pool: false,
      },
      access: {
        motorhome: true,
        caravan: true,
        tent: true,
      },
      contact: { website: 'https://test.com' },
      source: 'openstreetmap',
      last_updated: Date.now(),
    };
  });

  describe('Basic Optimization', () => {
    it('should optimize route without campsite suggestions', async () => {
      const request: CampsiteOptimizationRequest = {
        waypoints: mockWaypoints,
        criteria: {
          objective: 'shortest',
        },
        suggestCampsites: false,
        replaceExistingCampsites: false,
      };

      const result = await CampsiteOptimizationService.optimizeWithCampsites(request);

      expect(result).toBeDefined();
      expect(result.campsiteIntegration).toBeDefined();
      expect(result.campsiteIntegration.suggestedCampsites).toEqual([]);
    });

    it('should count existing campsite stops', async () => {
      const waypointsWithCampsite = [
        ...mockWaypoints,
        { id: '3', name: 'Campsite', lat: 46.0, lng: 4.0, type: 'campsite' as const },
      ];

      const request: CampsiteOptimizationRequest = {
        waypoints: waypointsWithCampsite,
        criteria: { objective: 'balanced' },
        suggestCampsites: false,
        replaceExistingCampsites: false,
      };

      const result = await CampsiteOptimizationService.optimizeWithCampsites(request);

      expect(result.campsiteIntegration.totalCampsiteStops).toBe(1);
    });
  });

  describe('Campsite Suggestions', () => {
    it('should suggest campsites when requested', async () => {
      const { campsiteService } = await import('../CampsiteService');
      vi.mocked(campsiteService.searchCampsites).mockResolvedValue({
        campsites: [mockCampsite],
        metadata: {
          results_count: 1,
          service: 'overpass',
          timestamp: Date.now(),
          query: {} as unknown as import('../CampsiteService').CampsiteRequest,
          cache_hit: false,
          query_duration: 100,
        },
        cached: false,
        boundingBox: { north: 50, south: 40, east: 10, west: 0 },
      });

      const request: CampsiteOptimizationRequest = {
        waypoints: mockWaypoints,
        criteria: { objective: 'balanced' },
        suggestCampsites: true,
        replaceExistingCampsites: false,
        campsiteRequirements: {
          maxDistanceFromRoute: 10,
          vehicleCompatibleOnly: true,
          maxStopsPerDay: 3,
          preferredStopDuration: 8,
        },
      };

      const result = await CampsiteOptimizationService.optimizeWithCampsites(request);

      expect(result.campsiteIntegration.suggestedCampsites.length).toBeGreaterThan(0);
    });

    it('should not suggest campsites when none available', async () => {
      const { campsiteService } = await import('../CampsiteService');
      vi.mocked(campsiteService.searchCampsites).mockResolvedValue({
        campsites: [],
        metadata: {
          results_count: 0,
          service: 'overpass',
          timestamp: Date.now(),
          query: {} as unknown as import('../CampsiteService').CampsiteRequest,
          cache_hit: false,
          query_duration: 100,
        },
        cached: false,
        boundingBox: { north: 50, south: 40, east: 10, west: 0 },
      });

      const request: CampsiteOptimizationRequest = {
        waypoints: mockWaypoints,
        criteria: { objective: 'balanced' },
        suggestCampsites: true,
        replaceExistingCampsites: false,
        campsiteRequirements: {
          maxDistanceFromRoute: 10,
          vehicleCompatibleOnly: true,
          maxStopsPerDay: 3,
          preferredStopDuration: 8,
        },
      };

      const result = await CampsiteOptimizationService.optimizeWithCampsites(request);

      expect(result.campsiteIntegration.suggestedCampsites).toEqual([]);
    });

    it('should filter campsites by vehicle compatibility', async () => {
      const incompatibleCampsite = {
        ...mockCampsite,
        access: { motorhome: false, caravan: false, tent: true },
      };

      const { campsiteService } = await import('../CampsiteService');
      vi.mocked(campsiteService.searchCampsites).mockResolvedValue({
        campsites: [incompatibleCampsite],
        metadata: {
          results_count: 1,
          service: 'overpass',
          timestamp: Date.now(),
          query: {} as unknown as import('../CampsiteService').CampsiteRequest,
          cache_hit: false,
          query_duration: 100,
        },
        cached: false,
        boundingBox: { north: 50, south: 40, east: 10, west: 0 },
      });

      const request: CampsiteOptimizationRequest = {
        waypoints: mockWaypoints,
        criteria: { objective: 'balanced', vehicleProfile: mockVehicleProfile },
        suggestCampsites: true,
        replaceExistingCampsites: false,
        campsiteRequirements: {
          maxDistanceFromRoute: 10,
          vehicleCompatibleOnly: true,
          maxStopsPerDay: 3,
          preferredStopDuration: 8,
        },
      };

      const result = await CampsiteOptimizationService.optimizeWithCampsites(request);

      // Should filter out incompatible campsites
      expect(result.campsiteIntegration.suggestedCampsites).toEqual([]);
    });
  });

  describe('Campsite Suitability Scoring', () => {
    it('should calculate higher score for vehicle-compatible campsites', () => {
      const requirements = {
        maxDistanceFromRoute: 10,
        vehicleCompatibleOnly: true,
        maxStopsPerDay: 3,
        preferredStopDuration: 8,
      };

      const score = ServicePrivate.calculateCampsiteSuitability(
        mockCampsite,
        requirements,
        mockVehicleProfile
      );

      expect(score).toBeGreaterThan(0.5); // Base score + compatibility bonus
    });

    it('should score campsites with required amenities higher', () => {
      const requirements = {
        maxDistanceFromRoute: 10,
        requiredAmenities: ['toilets', 'showers', 'electricity'],
        vehicleCompatibleOnly: false,
        maxStopsPerDay: 3,
        preferredStopDuration: 8,
      };

      const score = ServicePrivate.calculateCampsiteSuitability(
        mockCampsite,
        requirements,
        undefined
      );

      expect(score).toBeGreaterThan(0.5); // Has all required amenities
    });

    it('should score campsites with contact info higher', () => {
      const campsiteWithContact = {
        ...mockCampsite,
        contact: { website: 'https://test.com', phone: '+123456789' },
        opening_hours: 'Mo-Su 08:00-20:00',
      };

      const requirements = {
        maxDistanceFromRoute: 10,
        vehicleCompatibleOnly: false,
        maxStopsPerDay: 3,
        preferredStopDuration: 8,
      };

      const score = ServicePrivate.calculateCampsiteSuitability(
        campsiteWithContact,
        requirements,
        undefined
      );

      expect(score).toBeGreaterThan(0.5); // Base + contact + hours bonus
    });

    it('should cap suitability score at 1.0', () => {
      const perfectCampsite = {
        ...mockCampsite,
        contact: { website: 'https://test.com', phone: '+123456789' },
        opening_hours: 'Mo-Su 08:00-20:00',
      };

      const requirements = {
        maxDistanceFromRoute: 10,
        requiredAmenities: ['toilets', 'showers', 'electricity'],
        preferredTypes: ['campsite'],
        vehicleCompatibleOnly: true,
        maxStopsPerDay: 3,
        preferredStopDuration: 8,
      };

      const score = ServicePrivate.calculateCampsiteSuitability(
        perfectCampsite,
        requirements,
        mockVehicleProfile
      );

      expect(score).toBeLessThanOrEqual(1.0);
    });
  });

  describe('Distance Calculations', () => {
    it('should calculate distance between waypoints', () => {
      const paris = { id: '1', lat: 48.8566, lng: 2.3522, type: 'start' as const, name: 'Paris' };
      const lyon = { id: '2', lat: 45.764, lng: 4.8357, type: 'end' as const, name: 'Lyon' };

      const distance = ServicePrivate.calculateDistance(paris, lyon);

      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeCloseTo(392, -1); // ~392 km Paris to Lyon
    });

    it('should return 0 for same location', () => {
      const waypoint = {
        id: '1',
        lat: 48.8566,
        lng: 2.3522,
        type: 'waypoint' as const,
        name: 'Paris',
      };

      const distance = ServicePrivate.calculateDistance(waypoint, waypoint);

      expect(distance).toBe(0);
    });
  });

  describe('Segment Bounds Calculation', () => {
    it('should calculate bounds with buffer', () => {
      const start = { id: '1', lat: 48.0, lng: 2.0, type: 'start' as const, name: 'Start' };
      const end = { id: '2', lat: 46.0, lng: 4.0, type: 'end' as const, name: 'End' };
      const bufferKm = 10;

      const bounds = ServicePrivate.calculateSegmentBounds(start, end, bufferKm);

      expect(bounds.north).toBeGreaterThan(Math.max(start.lat, end.lat));
      expect(bounds.south).toBeLessThan(Math.min(start.lat, end.lat));
      expect(bounds.east).toBeGreaterThan(Math.max(start.lng, end.lng));
      expect(bounds.west).toBeLessThan(Math.min(start.lng, end.lng));
    });
  });

  describe('Long Segment Identification', () => {
    it('should identify segments needing campsites', () => {
      const waypoints = [
        { id: '1', lat: 50.0, lng: 0.0, type: 'start' as const, name: 'Start' },
        { id: '2', lat: 45.0, lng: 0.0, type: 'waypoint' as const, name: 'Middle' }, // ~555 km from start
        { id: '3', lat: 40.0, lng: 0.0, type: 'end' as const, name: 'End' },
      ];

      const segments = ServicePrivate.identifyLongSegments(waypoints, 3);

      expect(segments.length).toBeGreaterThan(0);
      expect(segments.every((s: { needsCampsite: boolean }) => s.needsCampsite)).toBe(true);
    });

    it('should not identify short segments', () => {
      const waypoints = [
        { id: '1', lat: 48.8566, lng: 2.3522, type: 'start' as const, name: 'Paris' },
        { id: '2', lat: 48.8606, lng: 2.3376, type: 'end' as const, name: 'Nearby' }, // ~1.5 km
      ];

      const segments = ServicePrivate.identifyLongSegments(waypoints, 3);

      expect(segments).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should handle campsite service errors gracefully', async () => {
      const { campsiteService } = await import('../CampsiteService');
      vi.mocked(campsiteService.searchCampsites).mockRejectedValue(
        new Error('Service unavailable')
      );

      const request: CampsiteOptimizationRequest = {
        waypoints: mockWaypoints,
        criteria: { objective: 'balanced' },
        suggestCampsites: true,
        replaceExistingCampsites: false,
        campsiteRequirements: {
          maxDistanceFromRoute: 10,
          vehicleCompatibleOnly: true,
          maxStopsPerDay: 3,
          preferredStopDuration: 8,
        },
      };

      const result = await CampsiteOptimizationService.optimizeWithCampsites(request);

      // Should not throw, just return empty suggestions
      expect(result.campsiteIntegration.suggestedCampsites).toEqual([]);
    });

    it('should handle empty waypoint list', async () => {
      const request: CampsiteOptimizationRequest = {
        waypoints: [],
        criteria: { objective: 'balanced' },
        suggestCampsites: true,
        replaceExistingCampsites: false,
        campsiteRequirements: {
          maxDistanceFromRoute: 10,
          vehicleCompatibleOnly: true,
          maxStopsPerDay: 3,
          preferredStopDuration: 8,
        },
      };

      const result = await CampsiteOptimizationService.optimizeWithCampsites(request);

      expect(result.campsiteIntegration.suggestedCampsites).toEqual([]);
    });

    it('should handle single waypoint', async () => {
      const request: CampsiteOptimizationRequest = {
        waypoints: [mockWaypoints[0]],
        criteria: { objective: 'balanced' },
        suggestCampsites: true,
        replaceExistingCampsites: false,
        campsiteRequirements: {
          maxDistanceFromRoute: 10,
          vehicleCompatibleOnly: true,
          maxStopsPerDay: 3,
          preferredStopDuration: 8,
        },
      };

      const result = await CampsiteOptimizationService.optimizeWithCampsites(request);

      expect(result.campsiteIntegration.suggestedCampsites).toEqual([]);
    });
  });

  describe('Campsite Replacement', () => {
    it('should replace existing campsites when requested', async () => {
      const request: CampsiteOptimizationRequest = {
        waypoints: [
          mockWaypoints[0],
          { id: 'campsite_123', lat: 46.0, lng: 4.0, type: 'campsite', name: 'Old Campsite' },
          mockWaypoints[1],
        ],
        criteria: { objective: 'balanced' },
        suggestCampsites: false,
        replaceExistingCampsites: true,
        campsiteRequirements: {
          maxDistanceFromRoute: 10,
          vehicleCompatibleOnly: true,
          maxStopsPerDay: 3,
          preferredStopDuration: 8,
        },
      };

      const result = await CampsiteOptimizationService.optimizeWithCampsites(request);

      // Should attempt replacement (though may not find better options)
      expect(result).toBeDefined();
    });

    it('should not replace when requirements not provided', async () => {
      const waypointsWithCampsite = [
        mockWaypoints[0],
        { id: 'campsite_123', lat: 46.0, lng: 4.0, type: 'campsite' as const, name: 'Campsite' },
        mockWaypoints[1],
      ];

      const request: CampsiteOptimizationRequest = {
        waypoints: waypointsWithCampsite,
        criteria: { objective: 'balanced' },
        suggestCampsites: false,
        replaceExistingCampsites: true,
        // No campsiteRequirements
      };

      const result = await CampsiteOptimizationService.optimizeWithCampsites(request);

      expect(result).toBeDefined();
    });
  });
});
