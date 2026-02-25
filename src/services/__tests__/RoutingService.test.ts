import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RoutingService, type RouteRequest, RoutingError } from '../RoutingService';
import { type Waypoint, type VehicleProfile } from '../../types';

// Mock the DataService parent class
vi.mock('../DataService', () => {
  return {
    DataService: class MockDataService {
      protected config: unknown;
      protected rateLimit: unknown;
      protected cache = new Map();
      protected rateLimitState = new Map();

      constructor(config: unknown, rateLimit: unknown) {
        this.config = config;
        this.rateLimit = rateLimit;
      }

      protected async request<T>(_context: unknown): Promise<T> {
        // Mock implementation - will be overridden in tests
        return {} as T;
      }
    },
  };
});

describe('RoutingService', () => {
  let routingService: RoutingService;
  let mockWaypoints: Waypoint[];
  let mockVehicleProfile: VehicleProfile;

  beforeEach(() => {
    routingService = new RoutingService();

    mockWaypoints = [
      {
        id: '1',
        name: 'Paris',
        lat: 48.8566,
        lng: 2.3522,
        type: 'start',
      },
      {
        id: '2',
        name: 'Lyon',
        lat: 45.764,
        lng: 4.8357,
        type: 'end',
      },
    ];

    mockVehicleProfile = {
      height: 3.0,
      width: 2.3,
      length: 7.0,
      weight: 3.5,
    };
  });

  describe('Request Validation', () => {
    it('should reject route with less than 2 waypoints', async () => {
      const request: RouteRequest = {
        waypoints: [mockWaypoints[0]],
      };

      await expect(routingService.calculateRoute(request)).rejects.toThrow(RoutingError);
      await expect(routingService.calculateRoute(request)).rejects.toThrow('At least 2 waypoints');
    });

    it('should reject route with more than 50 waypoints', async () => {
      const manyWaypoints: Waypoint[] = [];
      for (let i = 0; i < 51; i++) {
        manyWaypoints.push({
          id: `${i}`,
          name: `Waypoint ${i}`,
          lat: 48 + i * 0.1,
          lng: 2 + i * 0.1,
          type: i === 0 ? 'start' : i === 50 ? 'end' : 'waypoint',
        });
      }

      const request: RouteRequest = {
        waypoints: manyWaypoints,
      };

      await expect(routingService.calculateRoute(request)).rejects.toThrow(RoutingError);
      await expect(routingService.calculateRoute(request)).rejects.toThrow('Maximum 50 waypoints');
    });

    it('should reject invalid latitude', async () => {
      const invalidWaypoints = [{ ...mockWaypoints[0], lat: 91 }, mockWaypoints[1]];

      const request: RouteRequest = {
        waypoints: invalidWaypoints,
      };

      await expect(routingService.calculateRoute(request)).rejects.toThrow(RoutingError);
      await expect(routingService.calculateRoute(request)).rejects.toThrow('Invalid coordinates');
    });

    it('should reject invalid longitude', async () => {
      const invalidWaypoints = [mockWaypoints[0], { ...mockWaypoints[1], lng: -181 }];

      const request: RouteRequest = {
        waypoints: invalidWaypoints,
      };

      await expect(routingService.calculateRoute(request)).rejects.toThrow(RoutingError);
      await expect(routingService.calculateRoute(request)).rejects.toThrow('Invalid coordinates');
    });

    it('should reject vehicle height exceeding limits', async () => {
      const invalidVehicle = { ...mockVehicleProfile, height: 5.0 };

      const request: RouteRequest = {
        waypoints: mockWaypoints,
        vehicleProfile: invalidVehicle,
      };

      await expect(routingService.calculateRoute(request)).rejects.toThrow(RoutingError);
      await expect(routingService.calculateRoute(request)).rejects.toThrow(
        'height must be between'
      );
    });

    it('should reject vehicle width exceeding limits', async () => {
      const invalidVehicle = { ...mockVehicleProfile, width: 3.5 };

      const request: RouteRequest = {
        waypoints: mockWaypoints,
        vehicleProfile: invalidVehicle,
      };

      await expect(routingService.calculateRoute(request)).rejects.toThrow(RoutingError);
      await expect(routingService.calculateRoute(request)).rejects.toThrow('width must be between');
    });

    it('should reject vehicle weight exceeding limits', async () => {
      const invalidVehicle = { ...mockVehicleProfile, weight: 45 };

      const request: RouteRequest = {
        waypoints: mockWaypoints,
        vehicleProfile: invalidVehicle,
      };

      await expect(routingService.calculateRoute(request)).rejects.toThrow(RoutingError);
      await expect(routingService.calculateRoute(request)).rejects.toThrow(
        'weight must be between'
      );
    });

    it('should reject vehicle length exceeding limits', async () => {
      const invalidVehicle = { ...mockVehicleProfile, length: 25 };

      const request: RouteRequest = {
        waypoints: mockWaypoints,
        vehicleProfile: invalidVehicle,
      };

      await expect(routingService.calculateRoute(request)).rejects.toThrow(RoutingError);
      await expect(routingService.calculateRoute(request)).rejects.toThrow(
        'length must be between'
      );
    });

    it('should accept valid route request', async () => {
      // Mock the request method to return a valid response
      vi.spyOn(
        routingService as unknown as { request: (...args: unknown[]) => unknown },
        'request'
      ).mockResolvedValue({
        features: [
          {
            geometry: {
              coordinates: [
                [2.3522, 48.8566],
                [4.8357, 45.764],
              ],
              type: 'LineString',
            },
            properties: {
              summary: {
                distance: 460000,
                duration: 14400,
              },
              segments: [],
              way_points: [0, 1],
            },
          },
        ],
      });

      const request: RouteRequest = {
        waypoints: mockWaypoints,
        vehicleProfile: mockVehicleProfile,
      };

      const result = await routingService.calculateRoute(request);
      expect(result.status).toBe('success');
    });
  });

  describe('Vehicle Restriction Validation', () => {
    it('should detect vehicle height exceeding EU limits', async () => {
      const oversizedVehicle = { ...mockVehicleProfile, height: 4.5 };

      vi.spyOn(
        routingService as unknown as { request: (...args: unknown[]) => unknown },
        'request'
      ).mockResolvedValue({
        features: [
          {
            geometry: { coordinates: [], type: 'LineString' },
            properties: { summary: { distance: 0, duration: 0 }, segments: [], way_points: [] },
          },
        ],
      });

      const request: RouteRequest = {
        waypoints: mockWaypoints,
        vehicleProfile: oversizedVehicle,
      };

      const result = await routingService.calculateRoute(request);

      // Should have restrictions
      expect(result.restrictions).toBeDefined();
      expect(result.restrictions?.violatedDimensions).toContain('height');
      expect(result.restrictions?.suggestedActions.some(a => a.includes('height'))).toBe(true);
    });

    it('should detect vehicle width exceeding EU limits', async () => {
      const oversizedVehicle = { ...mockVehicleProfile, width: 2.6 };

      vi.spyOn(
        routingService as unknown as { request: (...args: unknown[]) => unknown },
        'request'
      ).mockResolvedValue({
        features: [
          {
            geometry: { coordinates: [], type: 'LineString' },
            properties: { summary: { distance: 0, duration: 0 }, segments: [], way_points: [] },
          },
        ],
      });

      const request: RouteRequest = {
        waypoints: mockWaypoints,
        vehicleProfile: oversizedVehicle,
      };

      const result = await routingService.calculateRoute(request);
      expect(result.restrictions?.violatedDimensions).toContain('width');
    });

    it('should detect vehicle weight exceeding EU limits', async () => {
      const oversizedVehicle = { ...mockVehicleProfile, weight: 45 };

      // Weight validation rejects before making API call
      const request: RouteRequest = {
        waypoints: mockWaypoints,
        vehicleProfile: oversizedVehicle,
      };

      await expect(routingService.calculateRoute(request)).rejects.toThrow(RoutingError);
    });

    it('should detect vehicle length exceeding EU limits', async () => {
      const oversizedVehicle = { ...mockVehicleProfile, length: 19 };

      vi.spyOn(
        routingService as unknown as { request: (...args: unknown[]) => unknown },
        'request'
      ).mockResolvedValue({
        features: [
          {
            geometry: { coordinates: [], type: 'LineString' },
            properties: { summary: { distance: 0, duration: 0 }, segments: [], way_points: [] },
          },
        ],
      });

      const request: RouteRequest = {
        waypoints: mockWaypoints,
        vehicleProfile: oversizedVehicle,
      };

      const result = await routingService.calculateRoute(request);
      expect(result.restrictions?.violatedDimensions).toContain('length');
    });

    it('should block route for vehicle that cannot be accommodated', async () => {
      const impossibleVehicle = { ...mockVehicleProfile, height: 4.2, width: 2.6 };

      const request: RouteRequest = {
        waypoints: mockWaypoints,
        vehicleProfile: impossibleVehicle,
      };

      const result = await routingService.calculateRoute(request);
      expect(result.status).toBe('error');
      expect(result.restrictions?.cannotAccommodate).toBe(true);
      expect(result.errors).toContain('Vehicle dimensions exceed EU road limits');
    });

    it('should allow normal-sized vehicle without restrictions', async () => {
      const normalVehicle = { height: 2.5, width: 2.0, length: 6.0, weight: 3.0 };

      vi.spyOn(
        routingService as unknown as { request: (...args: unknown[]) => unknown },
        'request'
      ).mockResolvedValue({
        features: [
          {
            geometry: {
              coordinates: [
                [2.3522, 48.8566],
                [4.8357, 45.764],
              ],
              type: 'LineString',
            },
            properties: {
              summary: { distance: 460000, duration: 14400 },
              segments: [],
              way_points: [0, 1],
            },
          },
        ],
      });

      const request: RouteRequest = {
        waypoints: mockWaypoints,
        vehicleProfile: normalVehicle,
      };

      const result = await routingService.calculateRoute(request);
      expect(result.status).toBe('success');
      expect(result.restrictions).toBeUndefined();
    });
  });

  describe('Profile Determination', () => {
    it('should use driving-car for small vehicles', async () => {
      const smallVehicle = { height: 2.0, width: 1.8, length: 5.0, weight: 2.0 };

      vi.spyOn(
        routingService as unknown as { request: (...args: unknown[]) => unknown },
        'request'
      ).mockResolvedValue({
        features: [
          {
            geometry: { coordinates: [[2.3522, 48.8566]], type: 'LineString' },
            properties: {
              summary: { distance: 460000, duration: 14400 },
              segments: [],
              way_points: [0],
            },
          },
        ],
      });

      const request: RouteRequest = {
        waypoints: mockWaypoints,
        vehicleProfile: smallVehicle,
      };

      const result = await routingService.calculateRoute(request);
      expect(result.metadata.profile).toBe('driving-car');
    });

    it('should use driving-hgv for large vehicles (height)', async () => {
      const largeVehicle = { height: 3.0, width: 2.0, length: 6.0, weight: 3.0 };

      vi.spyOn(
        routingService as unknown as { request: (...args: unknown[]) => unknown },
        'request'
      ).mockResolvedValue({
        features: [
          {
            geometry: { coordinates: [[2.3522, 48.8566]], type: 'LineString' },
            properties: {
              summary: { distance: 460000, duration: 14400 },
              segments: [],
              way_points: [0],
            },
          },
        ],
      });

      const request: RouteRequest = {
        waypoints: mockWaypoints,
        vehicleProfile: largeVehicle,
      };

      const result = await routingService.calculateRoute(request);
      expect(result.metadata.profile).toBe('driving-hgv');
    });

    it('should use driving-hgv for large vehicles (weight)', async () => {
      const heavyVehicle = { height: 2.0, width: 2.0, length: 6.0, weight: 4.0 };

      vi.spyOn(
        routingService as unknown as { request: (...args: unknown[]) => unknown },
        'request'
      ).mockResolvedValue({
        features: [
          {
            geometry: { coordinates: [[2.3522, 48.8566]], type: 'LineString' },
            properties: {
              summary: { distance: 460000, duration: 14400 },
              segments: [],
              way_points: [0],
            },
          },
        ],
      });

      const request: RouteRequest = {
        waypoints: mockWaypoints,
        vehicleProfile: heavyVehicle,
      };

      const result = await routingService.calculateRoute(request);
      expect(result.metadata.profile).toBe('driving-hgv');
    });

    it('should use requested profile when provided', async () => {
      vi.spyOn(
        routingService as unknown as { request: (...args: unknown[]) => unknown },
        'request'
      ).mockResolvedValue({
        features: [
          {
            geometry: { coordinates: [[2.3522, 48.8566]], type: 'LineString' },
            properties: {
              summary: { distance: 460000, duration: 14400 },
              segments: [],
              way_points: [0],
            },
          },
        ],
      });

      const request: RouteRequest = {
        waypoints: mockWaypoints,
        options: { profile: 'driving-hgv' },
      };

      const result = await routingService.calculateRoute(request);
      expect(result.metadata.profile).toBe('driving-hgv');
    });

    it('should default to driving-car when no vehicle profile', async () => {
      vi.spyOn(
        routingService as unknown as { request: (...args: unknown[]) => unknown },
        'request'
      ).mockResolvedValue({
        features: [
          {
            geometry: { coordinates: [[2.3522, 48.8566]], type: 'LineString' },
            properties: {
              summary: { distance: 460000, duration: 14400 },
              segments: [],
              way_points: [0],
            },
          },
        ],
      });

      const request: RouteRequest = {
        waypoints: mockWaypoints,
      };

      const result = await routingService.calculateRoute(request);
      expect(result.metadata.profile).toBe('driving-car');
    });
  });

  describe('OpenRouteService Integration', () => {
    it('should transform ORS response correctly', async () => {
      const orsResponse = {
        features: [
          {
            geometry: {
              coordinates: [
                [2.3522, 48.8566],
                [3.5, 47.0],
                [4.8357, 45.764],
              ],
              type: 'LineString',
            },
            properties: {
              summary: {
                distance: 460000,
                duration: 14400,
              },
              segments: [
                { distance: 230000, duration: 7200 },
                { distance: 230000, duration: 7200 },
              ],
              way_points: [0, 2],
            },
          },
        ],
      };

      vi.spyOn(
        routingService as unknown as { request: (...args: unknown[]) => unknown },
        'request'
      ).mockResolvedValue(orsResponse);

      const request: RouteRequest = {
        waypoints: mockWaypoints,
      };

      const result = await routingService.calculateRoute(request);

      expect(result.status).toBe('success');
      expect(result.routes).toHaveLength(1);
      expect(result.routes[0].summary.distance).toBe(460000);
      expect(result.routes[0].summary.duration).toBe(14400);
      expect(result.routes[0].geometry.coordinates).toHaveLength(3);
      expect(result.metadata.service).toBe('openrouteservice');
    });

    it('should handle alternative routes', async () => {
      const orsResponse = {
        features: [
          {
            geometry: { coordinates: [[2.3522, 48.8566]], type: 'LineString' },
            properties: {
              summary: { distance: 460000, duration: 14400 },
              segments: [],
              way_points: [0],
            },
          },
          {
            geometry: { coordinates: [[2.3522, 48.8566]], type: 'LineString' },
            properties: {
              summary: { distance: 480000, duration: 15000 },
              segments: [],
              way_points: [0],
            },
          },
        ],
      };

      vi.spyOn(
        routingService as unknown as { request: (...args: unknown[]) => unknown },
        'request'
      ).mockResolvedValue(orsResponse);

      const request: RouteRequest = {
        waypoints: mockWaypoints,
        options: { alternative_routes: true },
      };

      const result = await routingService.calculateRoute(request);

      expect(result.alternativeRoutes).toHaveLength(1);
      expect(result.alternativeRoutes![0].summary.distance).toBe(480000);
    });

    it('should add warning for significantly longer alternative routes', async () => {
      const orsResponse = {
        features: [
          {
            geometry: { coordinates: [[2.3522, 48.8566]], type: 'LineString' },
            properties: {
              summary: { distance: 100000, duration: 3600 },
              segments: [],
              way_points: [0],
            },
          },
          {
            geometry: { coordinates: [[2.3522, 48.8566]], type: 'LineString' },
            properties: {
              summary: { distance: 200000, duration: 7200 },
              segments: [],
              way_points: [0],
            },
          },
        ],
      };

      vi.spyOn(
        routingService as unknown as { request: (...args: unknown[]) => unknown },
        'request'
      ).mockResolvedValue(orsResponse);

      const request: RouteRequest = {
        waypoints: mockWaypoints,
        vehicleProfile: mockVehicleProfile,
      };

      const result = await routingService.calculateRoute(request);

      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some(w => w.includes('significantly longer'))).toBe(true);
    });

    it('should throw error when no route found from both services', async () => {
      // ORS returns no routes - this is recoverable, so tries fallback
      // OSRM also returns no routes
      vi.spyOn(routingService as unknown as { request: (...args: unknown[]) => unknown }, 'request')
        .mockResolvedValueOnce({ features: [] }) // ORS fails
        .mockResolvedValueOnce({ routes: [] }); // OSRM also fails

      const request: RouteRequest = {
        waypoints: mockWaypoints,
      };

      // Should fail with "All routing services unavailable" since both failed
      await expect(routingService.calculateRoute(request)).rejects.toThrow(RoutingError);
      await expect(routingService.calculateRoute(request)).rejects.toThrow('All routing services');
    });
  });

  describe('OSRM Fallback', () => {
    it('should fallback to OSRM when ORS fails', async () => {
      // First call (ORS) fails
      // Second call (OSRM) succeeds
      vi.spyOn(routingService as unknown as { request: (...args: unknown[]) => unknown }, 'request')
        .mockRejectedValueOnce(new Error('ORS unavailable'))
        .mockResolvedValueOnce({
          routes: [
            {
              geometry: {
                coordinates: [
                  [2.3522, 48.8566],
                  [4.8357, 45.764],
                ],
                type: 'LineString',
              },
              distance: 460000,
              duration: 14400,
              legs: [],
            },
          ],
          waypoints: [{}, {}],
        });

      const request: RouteRequest = {
        waypoints: mockWaypoints,
      };

      const result = await routingService.calculateRoute(request);

      expect(result.status).toBe('success');
      expect(result.metadata.service).toBe('osrm');
      expect(result.warnings).toContain('Primary routing service unavailable, using fallback');
    });

    it('should warn about vehicle restrictions when using OSRM', async () => {
      vi.spyOn(routingService as unknown as { request: (...args: unknown[]) => unknown }, 'request')
        .mockRejectedValueOnce(new Error('ORS unavailable'))
        .mockResolvedValueOnce({
          routes: [
            {
              geometry: { coordinates: [[2.3522, 48.8566]], type: 'LineString' },
              distance: 460000,
              duration: 14400,
              legs: [],
            },
          ],
          waypoints: [{}],
        });

      const request: RouteRequest = {
        waypoints: mockWaypoints,
        vehicleProfile: mockVehicleProfile,
      };

      const result = await routingService.calculateRoute(request);

      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some(w => w.includes('Vehicle restrictions not supported'))).toBe(
        true
      );
    });

    it('should throw error when both services fail', async () => {
      vi.spyOn(routingService as unknown as { request: (...args: unknown[]) => unknown }, 'request')
        .mockRejectedValueOnce(new Error('ORS unavailable'))
        .mockRejectedValueOnce(new Error('OSRM unavailable'));

      const request: RouteRequest = {
        waypoints: mockWaypoints,
      };

      await expect(routingService.calculateRoute(request)).rejects.toThrow(RoutingError);
      await expect(routingService.calculateRoute(request)).rejects.toThrow('All routing services');
    });
  });

  describe('Service Status', () => {
    it('should return service status', () => {
      const status = routingService.getServiceStatus();

      expect(status.primary.name).toBe('OpenRouteService');
      expect(status.fallback.name).toBe('OSRM');
      expect(status.fallback.available).toBe(true);
      expect(status.rateLimitInfo).toBeDefined();
    });

    it('should track rate limit information', () => {
      const status = routingService.getServiceStatus();

      expect(status.rateLimitInfo.remaining).toBeGreaterThanOrEqual(0);
      expect(status.rateLimitInfo.resetTime).toBeGreaterThan(0);
    });
  });

  describe('Health Check', () => {
    it('should return true when service is healthy', async () => {
      vi.spyOn(
        routingService as unknown as { request: (...args: unknown[]) => unknown },
        'request'
      ).mockResolvedValue({});

      const isHealthy = await routingService.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it('should return false when service is unhealthy', async () => {
      vi.spyOn(
        routingService as unknown as { request: (...args: unknown[]) => unknown },
        'request'
      ).mockRejectedValue(new Error('Service down'));

      const isHealthy = await routingService.healthCheck();
      expect(isHealthy).toBe(false);
    });
  });

  describe('Route Options', () => {
    it('should request elevation data', async () => {
      const requestSpy = vi
        .spyOn(routingService as unknown as { request: (...args: unknown[]) => unknown }, 'request')
        .mockResolvedValue({
          features: [
            {
              geometry: { coordinates: [[2.3522, 48.8566]], type: 'LineString' },
              properties: {
                summary: { distance: 460000, duration: 14400 },
                segments: [],
                way_points: [0],
              },
            },
          ],
        });

      const request: RouteRequest = {
        waypoints: mockWaypoints,
        options: { elevation: true },
      };

      await routingService.calculateRoute(request);

      expect(requestSpy).toHaveBeenCalled();
      // Request should include elevation: true in enhanced options
    });

    it('should request alternative routes', async () => {
      vi.spyOn(
        routingService as unknown as { request: (...args: unknown[]) => unknown },
        'request'
      ).mockResolvedValue({
        features: [
          {
            geometry: { coordinates: [[2.3522, 48.8566]], type: 'LineString' },
            properties: {
              summary: { distance: 460000, duration: 14400 },
              segments: [],
              way_points: [0],
            },
          },
        ],
      });

      const request: RouteRequest = {
        waypoints: mockWaypoints,
        options: { alternative_routes: true },
      };

      const result = await routingService.calculateRoute(request);
      expect(result.status).toBe('success');
    });
  });

  describe('Error Types', () => {
    it('should create RoutingError with correct properties', () => {
      const error = new RoutingError('Test error', 'TEST_CODE', 'test-service', true);

      expect(error.name).toBe('RoutingError');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.service).toBe('test-service');
      expect(error.recoverable).toBe(true);
    });

    it('should default recoverable to true', () => {
      const error = new RoutingError('Test error', 'TEST_CODE', 'test-service');

      expect(error.recoverable).toBe(true);
    });
  });
});
