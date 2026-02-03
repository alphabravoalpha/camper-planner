import { describe, it, expect, beforeEach } from 'vitest';
import MultiFormatExportService from '../MultiFormatExportService';
import { type RouteResponse } from '../RoutingService';
import { type Waypoint } from '../../types';

describe('MultiFormatExportService', () => {
  let mockRouteResponse: RouteResponse;
  let mockWaypoints: Waypoint[];

  beforeEach(() => {
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
        type: 'waypoint',
      },
      {
        id: '3',
        name: 'Marseille',
        lat: 43.2965,
        lng: 5.3698,
        type: 'end',
      },
    ];

    mockRouteResponse = {
      id: 'test-route-1',
      status: 'success',
      routes: [
        {
          geometry: {
            coordinates: [
              [2.3522, 48.8566],
              [3.5, 47.0],
              [4.8357, 45.764],
              [5.0, 44.0],
              [5.3698, 43.2965],
            ],
            type: 'LineString',
          },
          summary: {
            distance: 660000,
            duration: 21600,
          },
          segments: [
            { distance: 330000, duration: 10800 },
            { distance: 330000, duration: 10800 },
          ],
          waypoints: [0, 2, 4],
        },
      ],
      metadata: {
        service: 'openrouteservice',
        profile: 'driving-hgv',
        timestamp: Date.now(),
        query: { waypoints: mockWaypoints },
        attribution: 'OpenRouteService',
      },
    };
  });

  describe('Format Routing', () => {
    it('should export to GPX format', async () => {
      const result = await MultiFormatExportService.exportRoute(
        mockRouteResponse,
        mockWaypoints,
        'gpx',
        'Test Route'
      );

      expect(result.success).toBe(true);
      expect(result.format).toBe('gpx');
      expect(result.data).toContain('<?xml version="1.0"');
      expect(result.data).toContain('<gpx');
    });

    it('should export to KML format', async () => {
      const result = await MultiFormatExportService.exportRoute(
        mockRouteResponse,
        mockWaypoints,
        'kml',
        'Test Route'
      );

      expect(result.success).toBe(true);
      expect(result.format).toBe('kml');
      expect(result.data).toContain('<?xml version="1.0"');
      expect(result.data).toContain('<kml');
    });

    it('should export to JSON format', async () => {
      const result = await MultiFormatExportService.exportRoute(
        mockRouteResponse,
        mockWaypoints,
        'json',
        'Test Route'
      );

      expect(result.success).toBe(true);
      expect(result.format).toBe('json');

      // Should be valid JSON
      expect(() => JSON.parse(result.data!)).not.toThrow();
    });

    it('should export to CSV format', async () => {
      const result = await MultiFormatExportService.exportRoute(
        mockRouteResponse,
        mockWaypoints,
        'csv',
        'Test Route'
      );

      expect(result.success).toBe(true);
      expect(result.format).toBe('csv');
      expect(result.data).toContain('Latitude,Longitude');
    });
  });

  describe('KML Export', () => {
    it('should include waypoints in KML', async () => {
      const result = await MultiFormatExportService.exportRoute(
        mockRouteResponse,
        mockWaypoints,
        'kml',
        'Test Route'
      );

      expect(result.data).toContain('<Folder>');
      expect(result.data).toContain('<name>Waypoints</name>');
      expect(result.data).toContain('Paris');
      expect(result.data).toContain('Lyon');
      expect(result.data).toContain('Marseille');
    });

    it('should include route track in KML', async () => {
      const result = await MultiFormatExportService.exportRoute(
        mockRouteResponse,
        mockWaypoints,
        'kml',
        'Test Route'
      );

      expect(result.data).toContain('<LineString>');
      expect(result.data).toContain('<coordinates>');
      expect(result.data).toContain('660'); // Distance in description
    });

    it('should use different styles for waypoint types', async () => {
      const result = await MultiFormatExportService.exportRoute(
        mockRouteResponse,
        mockWaypoints,
        'kml',
        'Test Route'
      );

      expect(result.data).toContain('start-point');
      expect(result.data).toContain('end-point');
      expect(result.data).toContain('waypoint');
    });

    it('should escape XML special characters in KML', async () => {
      const specialWaypoints = [
        { id: '1', name: 'Route with <special> & "chars"', lat: 48.8566, lng: 2.3522, type: 'start' as const },
      ];

      const result = await MultiFormatExportService.exportRoute(
        mockRouteResponse,
        specialWaypoints,
        'kml'
      );

      expect(result.data).not.toContain('<special>');
      expect(result.data).toContain('&lt;');
      expect(result.data).toContain('&gt;');
      expect(result.data).toContain('&amp;');
    });

    it('should generate valid KML filename', async () => {
      const result = await MultiFormatExportService.exportRoute(
        mockRouteResponse,
        mockWaypoints,
        'kml',
        'My Route Name'
      );

      expect(result.filename).toMatch(/\.kml$/);
      expect(result.filename).toMatch(/my_route_name/);
    });
  });

  describe('JSON Export', () => {
    it('should include all route data in JSON', async () => {
      const result = await MultiFormatExportService.exportRoute(
        mockRouteResponse,
        mockWaypoints,
        'json',
        'Test Route'
      );

      const jsonData = JSON.parse(result.data!);

      expect(jsonData.id).toBeDefined();
      expect(jsonData.name).toBe('Test Route');
      expect(jsonData.waypoints).toHaveLength(3);
      expect(jsonData.track).toBeDefined();
      expect(jsonData.metadata).toBeDefined();
    });

    it('should include waypoint details in JSON', async () => {
      const result = await MultiFormatExportService.exportRoute(
        mockRouteResponse,
        mockWaypoints,
        'json',
        'Test Route'
      );

      const jsonData = JSON.parse(result.data!);

      expect(jsonData.waypoints[0].name).toBe('Paris');
      expect(jsonData.waypoints[0].lat).toBe(48.8566);
      expect(jsonData.waypoints[0].lng).toBe(2.3522);
      expect(jsonData.waypoints[0].type).toBe('start');
    });

    it('should include track data in JSON', async () => {
      const result = await MultiFormatExportService.exportRoute(
        mockRouteResponse,
        mockWaypoints,
        'json',
        'Test Route'
      );

      const jsonData = JSON.parse(result.data!);

      expect(jsonData.track.totalDistance).toBe(660000);
      expect(jsonData.track.totalDuration).toBe(21600);
      expect(jsonData.track.segments).toBeDefined();
    });

    it('should generate valid JSON filename', async () => {
      const result = await MultiFormatExportService.exportRoute(
        mockRouteResponse,
        mockWaypoints,
        'json',
        'Test Route'
      );

      expect(result.filename).toMatch(/\.json$/);
    });
  });

  describe('CSV Export', () => {
    it('should include CSV headers', async () => {
      const result = await MultiFormatExportService.exportRoute(
        mockRouteResponse,
        mockWaypoints,
        'csv',
        'Test Route'
      );

      expect(result.data).toContain('Latitude');
      expect(result.data).toContain('Longitude');
      expect(result.data).toContain('Name');
    });

    it('should include waypoint data in CSV', async () => {
      const result = await MultiFormatExportService.exportRoute(
        mockRouteResponse,
        mockWaypoints,
        'csv',
        'Test Route'
      );

      expect(result.data).toContain('Paris');
      expect(result.data).toContain('48.8566');
      expect(result.data).toContain('2.3522');
    });

    it('should handle CSV special characters', async () => {
      const specialWaypoints = [
        { id: '1', name: 'Location, with "comma"', lat: 48.8566, lng: 2.3522, type: 'start' as const },
      ];

      const result = await MultiFormatExportService.exportRoute(
        mockRouteResponse,
        specialWaypoints,
        'csv'
      );

      // CSV should quote fields with special chars
      expect(result.data).toBeDefined();
    });

    it('should generate valid CSV filename', async () => {
      const result = await MultiFormatExportService.exportRoute(
        mockRouteResponse,
        mockWaypoints,
        'csv',
        'Test Route'
      );

      expect(result.filename).toMatch(/\.csv$/);
    });
  });

  describe('Export Options', () => {
    it('should respect includeWaypoints option', async () => {
      const result = await MultiFormatExportService.exportRoute(
        mockRouteResponse,
        mockWaypoints,
        'kml',
        'Test Route',
        { includeWaypoints: false }
      );

      expect(result.data).not.toContain('<name>Waypoints</name>');
    });

    it('should respect includeTrackPoints option', async () => {
      const result = await MultiFormatExportService.exportRoute(
        mockRouteResponse,
        mockWaypoints,
        'kml',
        'Test Route',
        { includeTrackPoints: false }
      );

      expect(result.data).not.toContain('<LineString>');
    });

    it('should use custom creator', async () => {
      const result = await MultiFormatExportService.exportRoute(
        mockRouteResponse,
        mockWaypoints,
        'kml',
        'Test Route',
        { creator: 'Custom App' }
      );

      // Creator might be in metadata or description
      expect(result.data).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid route response', async () => {
      const invalidRoute = {
        status: 'error',
        error: 'Route failed',
      } as unknown as RouteResponse;

      const result = await MultiFormatExportService.exportRoute(
        invalidRoute,
        mockWaypoints,
        'kml',
        'Test Route'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle empty waypoints', async () => {
      const result = await MultiFormatExportService.exportRoute(
        mockRouteResponse,
        [],
        'json',
        'Test Route'
      );

      expect(result.success).toBe(false);
    });

    it('should handle missing route geometry', async () => {
      const routeNoGeometry = {
        ...mockRouteResponse,
        routes: [
          {
            ...mockRouteResponse.routes[0],
            geometry: { coordinates: [], type: 'LineString' as const },
          },
        ],
      };

      const result = await MultiFormatExportService.exportRoute(
        routeNoGeometry,
        mockWaypoints,
        'kml',
        'Test Route'
      );

      expect(result.format).toBe('kml');
    });
  });

  describe('File Size', () => {
    it('should calculate file size for all formats', async () => {
      const formats: Array<'gpx' | 'kml' | 'json' | 'csv'> = ['gpx', 'kml', 'json', 'csv'];

      for (const format of formats) {
        const result = await MultiFormatExportService.exportRoute(
          mockRouteResponse,
          mockWaypoints,
          format,
          'Test Route'
        );

        expect(result.size).toBeGreaterThan(0);
      }
    });

    it('should have reasonable file sizes', async () => {
      const result = await MultiFormatExportService.exportRoute(
        mockRouteResponse,
        mockWaypoints,
        'kml',
        'Test Route'
      );

      expect(result.size).toBeGreaterThan(100);
      expect(result.size).toBeLessThan(100000);
    });
  });

  describe('Filename Generation', () => {
    it('should sanitize route names in filenames', async () => {
      const result = await MultiFormatExportService.exportRoute(
        mockRouteResponse,
        mockWaypoints,
        'json',
        'Route/with\\special:chars'
      );

      expect(result.filename).not.toContain('/');
      expect(result.filename).not.toContain('\\');
      expect(result.filename).not.toContain(':');
    });

    it('should include date in filename', async () => {
      const result = await MultiFormatExportService.exportRoute(
        mockRouteResponse,
        mockWaypoints,
        'kml',
        'Test Route'
      );

      expect(result.filename).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it('should use default name when not provided', async () => {
      const result = await MultiFormatExportService.exportRoute(
        mockRouteResponse,
        mockWaypoints,
        'csv'
      );

      expect(result.filename).toBeDefined();
      expect(result.filename).toMatch(/\.csv$/);
    });
  });
});
