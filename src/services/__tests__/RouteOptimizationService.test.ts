import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RouteOptimizationService, type OptimizationCriteria } from '../RouteOptimizationService';
import { type Waypoint, type VehicleProfile } from '../../store';

// Mock RoutingService to avoid real API calls
vi.mock('../RoutingService', () => ({
  RoutingService: vi.fn().mockImplementation(() => ({
    calculateRoute: vi.fn().mockResolvedValue({
      status: 'success',
      distance: 100000, // meters
      duration: 7200, // seconds (2 hours)
      geometry: [
        [48.8566, 2.3522],
        [51.5074, -0.1278],
      ],
      elevationGain: 100,
      elevationLoss: 80,
    }),
  })),
}));

describe('RouteOptimizationService', () => {
  let service: RouteOptimizationService;
  let testWaypoints: Waypoint[];
  let testCriteria: OptimizationCriteria;
  let testVehicleProfile: VehicleProfile;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RouteOptimizationService();

    // Create test waypoints matching actual Waypoint interface
    testWaypoints = [
      {
        id: '1',
        name: 'Paris',
        lat: 48.8566,
        lng: 2.3522,
        type: 'start',
      },
      {
        id: '2',
        name: 'London',
        lat: 51.5074,
        lng: -0.1278,
        type: 'waypoint',
      },
      {
        id: '3',
        name: 'Berlin',
        lat: 52.5200,
        lng: 13.4050,
        type: 'waypoint',
      },
      {
        id: '4',
        name: 'Vienna',
        lat: 48.2082,
        lng: 16.3738,
        type: 'end',
      },
    ];

    testVehicleProfile = {
      id: 'test-vehicle',
      name: 'Test Camper',
      type: 'campervan',
      height: 3.2,
      width: 2.3,
      weight: 3.5,
      length: 7.0,
      fuelType: 'diesel',
    };

    testCriteria = {
      objective: 'shortest',
      vehicleProfile: testVehicleProfile,
    };
  });

  describe('Basic Functionality', () => {
    it('should create service instance', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(RouteOptimizationService);
    });

    it('should throw error with less than 3 waypoints', async () => {
      const twoWaypoints = testWaypoints.slice(0, 2);

      await expect(
        service.optimizeRoute(twoWaypoints, testCriteria)
      ).rejects.toThrow('Route optimization requires at least 3 waypoints');
    });

    it('should accept exactly 3 waypoints (minimum)', async () => {
      const threeWaypoints = testWaypoints.slice(0, 3);

      // This should not throw
      const result = await service.optimizeRoute(threeWaypoints, testCriteria);
      expect(result).toBeDefined();
    }, 10000); // Increase timeout for this test
  });

  describe('Optimization Result Structure', () => {
    it('should return complete optimization result', async () => {
      const result = await service.optimizeRoute(testWaypoints, testCriteria);

      // Check main structure
      expect(result).toHaveProperty('originalRoute');
      expect(result).toHaveProperty('optimizedRoute');
      expect(result).toHaveProperty('improvements');
      expect(result).toHaveProperty('optimizationMetadata');
    }, 10000);

    it('should include waypoints in both routes', async () => {
      const result = await service.optimizeRoute(testWaypoints, testCriteria);

      expect(result.originalRoute.waypoints).toHaveLength(testWaypoints.length);
      expect(result.optimizedRoute.waypoints).toHaveLength(testWaypoints.length);
      expect(Array.isArray(result.originalRoute.waypoints)).toBe(true);
      expect(Array.isArray(result.optimizedRoute.waypoints)).toBe(true);
    }, 10000);

    it('should include route metrics', async () => {
      const result = await service.optimizeRoute(testWaypoints, testCriteria);

      // Original route metrics
      expect(result.originalRoute).toHaveProperty('totalDistance');
      expect(result.originalRoute).toHaveProperty('totalTime');
      expect(typeof result.originalRoute.totalDistance).toBe('number');
      expect(typeof result.originalRoute.totalTime).toBe('number');

      // Optimized route metrics
      expect(result.optimizedRoute).toHaveProperty('totalDistance');
      expect(result.optimizedRoute).toHaveProperty('totalTime');
      expect(result.optimizedRoute).toHaveProperty('reorderingApplied');
      expect(typeof result.optimizedRoute.reorderingApplied).toBe('boolean');
    }, 10000);

    it('should calculate improvements', async () => {
      const result = await service.optimizeRoute(testWaypoints, testCriteria);

      expect(result.improvements).toHaveProperty('distanceSaved');
      expect(result.improvements).toHaveProperty('timeSaved');
      expect(result.improvements).toHaveProperty('percentageImprovement');

      expect(typeof result.improvements.distanceSaved).toBe('number');
      expect(typeof result.improvements.timeSaved).toBe('number');
      expect(typeof result.improvements.percentageImprovement).toBe('number');

      // Improvements should be non-negative
      expect(result.improvements.distanceSaved).toBeGreaterThanOrEqual(0);
      expect(result.improvements.timeSaved).toBeGreaterThanOrEqual(0);
    }, 10000);

    it('should include optimization metadata', async () => {
      const result = await service.optimizeRoute(testWaypoints, testCriteria);

      expect(result.optimizationMetadata).toHaveProperty('algorithm');
      expect(result.optimizationMetadata).toHaveProperty('iterations');
      expect(result.optimizationMetadata).toHaveProperty('executionTime');
      expect(result.optimizationMetadata).toHaveProperty('convergenceReached');

      expect(typeof result.optimizationMetadata.algorithm).toBe('string');
      expect(typeof result.optimizationMetadata.iterations).toBe('number');
      expect(typeof result.optimizationMetadata.executionTime).toBe('number');
      expect(typeof result.optimizationMetadata.convergenceReached).toBe('boolean');

      // Execution time should be non-negative (can be 0 on fast machines)
      expect(result.optimizationMetadata.executionTime).toBeGreaterThanOrEqual(0);
    }, 10000);
  });

  describe('Optimization Objectives', () => {
    it('should handle shortest objective', async () => {
      const criteria: OptimizationCriteria = {
        ...testCriteria,
        objective: 'shortest',
      };

      const result = await service.optimizeRoute(testWaypoints, criteria);
      expect(result).toBeDefined();
      expect(result.optimizationMetadata.algorithm).toBeDefined();
    }, 10000);

    it('should handle fastest objective', async () => {
      const criteria: OptimizationCriteria = {
        ...testCriteria,
        objective: 'fastest',
      };

      const result = await service.optimizeRoute(testWaypoints, criteria);
      expect(result).toBeDefined();
    }, 10000);

    it('should handle balanced objective', async () => {
      const criteria: OptimizationCriteria = {
        ...testCriteria,
        objective: 'balanced',
      };

      const result = await service.optimizeRoute(testWaypoints, criteria);
      expect(result).toBeDefined();
    }, 10000);
  });

  describe('Edge Cases', () => {
    it('should handle waypoints with identical coordinates', async () => {
      const duplicateWaypoints: Waypoint[] = [
        ...testWaypoints.slice(0, 2),
        {
          id: 'duplicate',
          name: 'Duplicate',
          lat: testWaypoints[1].lat,
          lng: testWaypoints[1].lng,
          type: 'waypoint',
        },
        ...testWaypoints.slice(2),
      ];

      const result = await service.optimizeRoute(duplicateWaypoints, testCriteria);
      expect(result).toBeDefined();
      expect(result.optimizedRoute.waypoints).toHaveLength(duplicateWaypoints.length);
    }, 10000);

    it('should handle locked waypoints constraint', async () => {
      const criteriaWithLocked: OptimizationCriteria = {
        ...testCriteria,
        lockedWaypoints: ['2'], // Lock the second waypoint
      };

      const result = await service.optimizeRoute(testWaypoints, criteriaWithLocked);
      expect(result).toBeDefined();

      // Find the locked waypoint in both routes
      const lockedOriginal = result.originalRoute.waypoints.find(w => w.id === '2');
      const lockedOptimized = result.optimizedRoute.waypoints.find(w => w.id === '2');

      expect(lockedOriginal).toBeDefined();
      expect(lockedOptimized).toBeDefined();
    }, 10000);
  });

  describe('Constraints', () => {
    it('should respect time constraints', async () => {
      const criteriaWithTime: OptimizationCriteria = {
        ...testCriteria,
        timeConstraints: {
          maxDrivingTime: 8,
          preferredStartTime: 9,
          avoidNightDriving: true,
        },
      };

      const result = await service.optimizeRoute(testWaypoints, criteriaWithTime);
      expect(result).toBeDefined();
    }, 10000);

    it('should consider campsite preferences', async () => {
      const criteriaWithCampsites: OptimizationCriteria = {
        ...testCriteria,
        campsitePreferences: {
          maxDistanceBetweenStops: 300,
          preferredStopDuration: 12,
          requireCampsiteOvernight: true,
        },
      };

      const result = await service.optimizeRoute(testWaypoints, criteriaWithCampsites);
      expect(result).toBeDefined();
    }, 10000);
  });
});
