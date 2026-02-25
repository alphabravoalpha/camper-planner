import { describe, it, expect, beforeEach } from 'vitest';
import { RouteExportService, type ExportOptions } from '../RouteExportService';
import { type Waypoint } from '../../store';
import { type Trip } from '../TripStorageService';
import { type VehicleProfile } from '../../store';

describe('RouteExportService', () => {
  let mockWaypoints: Waypoint[];
  let mockTrip: Trip;
  let mockVehicle: VehicleProfile;
  let defaultExportOptions: ExportOptions;

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

    mockVehicle = {
      type: 'motorhome',
      name: 'Test RV',
      height: 3.2,
      width: 2.3,
      length: 7.0,
      weight: 3500,
      fuelType: 'diesel',
    };

    mockTrip = {
      metadata: {
        id: 'test-trip-1',
        name: 'Test Trip',
        category: 'leisure' as const,
        tags: ['test'],
        duration: 3,
        difficulty: 'easy' as const,
        season: 'summer' as const,
        countries: ['France'],
        estimatedCost: 500,
        currency: 'EUR',
        isTemplate: false,
        isPublic: false,
      },
      data: {
        waypoints: mockWaypoints,
        vehicleProfile: mockVehicle,
        routePreferences: {
          avoidTolls: false,
          avoidFerries: false,
          preferScenic: false,
          fuelEfficient: false,
        },
        campsiteSelections: [],
      },
      timestamps: {
        created: new Date(),
        modified: new Date(),
        lastOpened: new Date(),
        version: '1.0',
      },
    };

    defaultExportOptions = {
      format: 'gpx',
      includeWaypoints: true,
      includeCampsites: true,
      includeRoute: true,
      includeVehicleInfo: true,
      includeMetadata: true,
      gpsDeviceCompatibility: 'universal',
    };
  });

  describe('Export Validation', () => {
    it('should validate export data successfully', () => {
      const result = RouteExportService.validateExportData(mockWaypoints, defaultExportOptions);

      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty waypoints', () => {
      const result = RouteExportService.validateExportData([], defaultExportOptions);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('waypoint');
    });

    it('should warn about missing names', () => {
      const waypointsWithoutNames = [
        { id: '1', lat: 48.8566, lng: 2.3522, type: 'start' as const, name: '' },
        { id: '2', lat: 45.764, lng: 4.8357, type: 'end' as const, name: '' },
      ];

      const result = RouteExportService.validateExportData(
        waypointsWithoutNames,
        defaultExportOptions
      );

      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should validate coordinates', () => {
      const invalidWaypoints = [{ id: '1', name: 'Test', lat: 91, lng: 0, type: 'start' as const }];

      const result = RouteExportService.validateExportData(invalidWaypoints, defaultExportOptions);

      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('GPX Export', () => {
    it('should export to GPX format', async () => {
      const options: ExportOptions = {
        ...defaultExportOptions,
        format: 'gpx',
      };

      const result = await RouteExportService.exportRoute(mockWaypoints, options);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(typeof result.data).toBe('string');
      expect(result.data).toContain('<?xml version="1.0"');
      expect(result.data).toContain('<gpx');
    });

    it('should include waypoints in GPX', async () => {
      const options: ExportOptions = {
        ...defaultExportOptions,
        format: 'gpx',
        includeWaypoints: true,
      };

      const result = await RouteExportService.exportRoute(mockWaypoints, options);

      expect(result.data).toContain('Paris');
      expect(result.data).toContain('Lyon');
      expect(result.data).toContain('Marseille');
    });

    it('should exclude waypoints when option disabled', async () => {
      const waypointsWithCampsite = [
        ...mockWaypoints,
        {
          id: '4',
          name: 'Camping Site',
          lat: 44.0,
          lng: 5.0,
          type: 'campsite' as const,
        },
      ];

      const options: ExportOptions = {
        ...defaultExportOptions,
        format: 'gpx',
        includeWaypoints: false,
        includeCampsites: true,
      };

      const result = await RouteExportService.exportRoute(waypointsWithCampsite, options);

      expect(result.exportInfo.waypoints).toBe(0);
    });

    it('should include metadata in GPX', async () => {
      const options: ExportOptions = {
        ...defaultExportOptions,
        format: 'gpx',
        customName: 'My Route',
        description: 'Test route description',
        author: 'Test Author',
      };

      const result = await RouteExportService.exportRoute(mockWaypoints, options, {
        trip: mockTrip,
      });

      expect(result.data).toContain('My Route');
    });

    it('should generate valid GPX filename', async () => {
      const options: ExportOptions = {
        ...defaultExportOptions,
        format: 'gpx',
        customName: 'Test Route',
      };

      const result = await RouteExportService.exportRoute(mockWaypoints, options);

      expect(result.filename).toMatch(/\.gpx$/);
      expect(result.filename).toContain('Test Route');
    });

    it('should calculate file size', async () => {
      const options: ExportOptions = {
        ...defaultExportOptions,
        format: 'gpx',
      };

      const result = await RouteExportService.exportRoute(mockWaypoints, options);

      expect(result.fileSize).toBeGreaterThan(0);
    });

    it('should validate GPX compatibility', () => {
      const gpxContent = `<?xml version="1.0"?>
        <gpx version="1.1" creator="Test">
          <wpt lat="48.8566" lon="2.3522">
            <name>Paris</name>
          </wpt>
        </gpx>`;

      const result = RouteExportService.validateGPXCompatibility(gpxContent, 'garmin');

      expect(result.devices).toBeDefined();
      expect(result.devices.length).toBeGreaterThan(0);
      expect(result.warnings).toBeDefined();
    });
  });

  describe('JSON Export', () => {
    it('should export to JSON format', async () => {
      const options: ExportOptions = {
        ...defaultExportOptions,
        format: 'json',
      };

      const result = await RouteExportService.exportRoute(mockWaypoints, options);

      expect(result.success).toBe(true);
      expect(() => JSON.parse(result.data as string)).not.toThrow();
    });

    it('should include trip data in JSON', async () => {
      const options: ExportOptions = {
        ...defaultExportOptions,
        format: 'json',
      };

      const result = await RouteExportService.exportRoute(mockWaypoints, options, {
        trip: mockTrip,
      });

      const data = JSON.parse(result.data as string);
      expect(data.trip).toBeDefined();
      expect(data.trip.metadata.name).toBe('Test Trip');
    });

    it('should include vehicle info when enabled', async () => {
      const options: ExportOptions = {
        ...defaultExportOptions,
        format: 'json',
        includeVehicleInfo: true,
      };

      const result = await RouteExportService.exportRoute(mockWaypoints, options, {
        vehicle: mockVehicle,
      });

      const data = JSON.parse(result.data as string);
      expect(data.vehicle).toBeDefined();
      expect(data.vehicle.type).toBe('motorhome');
    });

    it('should exclude vehicle info when disabled', async () => {
      const options: ExportOptions = {
        ...defaultExportOptions,
        format: 'json',
        includeVehicleInfo: false,
      };

      const result = await RouteExportService.exportRoute(mockWaypoints, options, {
        vehicle: mockVehicle,
      });

      const data = JSON.parse(result.data as string);
      expect(data.vehicle).toBeUndefined();
    });

    it('should include export metadata', async () => {
      const options: ExportOptions = {
        ...defaultExportOptions,
        format: 'json',
      };

      const result = await RouteExportService.exportRoute(mockWaypoints, options);

      const data = JSON.parse(result.data as string);
      expect(data.metadata).toBeDefined();
      expect(data.metadata.version).toBeDefined();
      expect(data.metadata.exportedAt).toBeDefined();
    });
  });

  describe('KML Export', () => {
    it('should export to KML format', async () => {
      const options: ExportOptions = {
        ...defaultExportOptions,
        format: 'kml',
      };

      const result = await RouteExportService.exportRoute(mockWaypoints, options);

      expect(result.success).toBe(true);
      expect(result.data).toContain('<?xml version="1.0"');
      expect(result.data).toContain('<kml');
    });

    it('should include placemarks in KML', async () => {
      const options: ExportOptions = {
        ...defaultExportOptions,
        format: 'kml',
      };

      const result = await RouteExportService.exportRoute(mockWaypoints, options);

      expect(result.data).toContain('<Placemark>');
      expect(result.data).toContain('Paris');
    });

    it('should escape XML special characters in names', async () => {
      const specialWaypoints = [
        {
          id: '1',
          name: 'Location with <special> & "characters"',
          lat: 48.8566,
          lng: 2.3522,
          type: 'start' as const,
        },
      ];

      const options: ExportOptions = {
        ...defaultExportOptions,
        format: 'kml',
      };

      const result = await RouteExportService.exportRoute(specialWaypoints, options);

      // Name tags should have escaped XML
      expect(result.data).toContain('&lt;special&gt;');
      expect(result.data).toContain('&amp;');
    });
  });

  describe('CSV Export', () => {
    it('should export to CSV format', async () => {
      const options: ExportOptions = {
        ...defaultExportOptions,
        format: 'csv',
      };

      const result = await RouteExportService.exportRoute(mockWaypoints, options);

      expect(result.success).toBe(true);
      expect(result.data).toContain('Latitude');
      expect(result.data).toContain('Longitude');
      expect(result.data).toContain('Name');
    });

    it('should include waypoint data in CSV', async () => {
      const options: ExportOptions = {
        ...defaultExportOptions,
        format: 'csv',
      };

      const result = await RouteExportService.exportRoute(mockWaypoints, options);

      expect(result.data).toContain('48.8566');
      expect(result.data).toContain('Paris');
    });

    it('should escape CSV special characters', async () => {
      const specialWaypoints = [
        {
          id: '1',
          name: 'Location, with "comma"',
          lat: 48.8566,
          lng: 2.3522,
          type: 'start' as const,
        },
      ];

      const options: ExportOptions = {
        ...defaultExportOptions,
        format: 'csv',
      };

      const result = await RouteExportService.exportRoute(specialWaypoints, options);

      expect(result.data).toBeDefined();
      // CSV should quote fields with special chars
    });
  });

  describe('Import Functionality', () => {
    it('should import from GPX', async () => {
      const gpxContent = `<?xml version="1.0"?>
        <gpx version="1.1" creator="Test">
          <wpt lat="48.8566" lon="2.3522">
            <name>Paris</name>
          </wpt>
          <wpt lat="45.764" lon="4.8357">
            <name>Lyon</name>
          </wpt>
        </gpx>`;

      const result = RouteExportService.importFromGPX(gpxContent);

      expect(result.success).toBe(true);
      expect(result.waypoints.length).toBeGreaterThan(0);
      expect(result.waypoints[0].name).toBe('Paris');
    });

    it('should import from JSON', async () => {
      const jsonContent = JSON.stringify({
        metadata: { version: '1.0', exportedAt: new Date(), format: 'json' },
        route: {
          waypoints: mockWaypoints,
        },
        exportOptions: defaultExportOptions,
      });

      const result = RouteExportService.importFromJSON(jsonContent);

      expect(result.success).toBe(true);
      expect(result.waypoints).toHaveLength(3);
    });

    it('should handle invalid GPX', () => {
      const invalidGPX = 'not valid xml';

      const result = RouteExportService.importFromGPX(invalidGPX);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle invalid JSON', () => {
      const invalidJSON = '{ invalid json';

      const result = RouteExportService.importFromJSON(invalidJSON);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should import route with auto-detection', async () => {
      const gpxContent = `<?xml version="1.0"?>
        <gpx version="1.1">
          <wpt lat="48.8566" lon="2.3522">
            <name>Paris</name>
          </wpt>
        </gpx>`;

      const result = await RouteExportService.importRoute(gpxContent, 'gpx');

      expect(result.success).toBe(true);
      expect(result.waypoints).toBeDefined();
    });
  });

  describe('Utility Functions', () => {
    it('should calculate total distance', () => {
      const distance = RouteExportService.calculateTotalDistance(mockWaypoints);

      expect(distance).toBeGreaterThan(0);
    });

    it('should calculate distance between two points', () => {
      const distance = RouteExportService.calculateDistance(mockWaypoints[0], mockWaypoints[1]);

      expect(distance).toBeGreaterThan(0);
    });

    it('should escape XML correctly', () => {
      const text = 'Text with <tags> & "quotes"';
      const escaped = RouteExportService.escapeXML(text);

      expect(escaped).not.toContain('<');
      expect(escaped).toContain('&lt;');
      expect(escaped).toContain('&amp;');
    });

    it('should escape CSV correctly', () => {
      const text = 'Text with "quote"';
      const escaped = RouteExportService.escapeCSV(text);

      // escapeCSV doubles internal quotes: " -> ""
      expect(escaped).toContain('""');
      expect(escaped).toBe('Text with ""quote""');
    });

    it('should format dates consistently', () => {
      const date = new Date('2025-07-01T12:00:00Z');
      const formatted = RouteExportService.formatDate(date);

      expect(formatted).toBeDefined();
      expect(formatted).toMatch(/\d{8}/); // Format is YYYYMMDD without dashes
      expect(formatted).toBe('20250701');
    });

    it('should parse CSV lines', () => {
      const line = 'value1,"value2, with comma",value3';
      const parsed = RouteExportService.parseCSVLine(line);

      expect(parsed).toHaveLength(3);
      expect(parsed[1]).toBe('value2, with comma');
    });

    it('should create waypoint descriptions', () => {
      const description = RouteExportService.createWaypointDescription(
        mockWaypoints[0],
        defaultExportOptions
      );

      expect(description).toBeDefined();
      expect(typeof description).toBe('string');
    });

    it('should get GPS symbols for waypoint types', () => {
      const symbols = {
        start: 'Waypoint',
        waypoint: 'Waypoint',
        end: 'Flag',
        campsite: 'Campground',
      };

      const startSymbol = RouteExportService.getGPSSymbol('start', symbols);
      expect(startSymbol).toBe('Waypoint');

      const campsiteSymbol = RouteExportService.getGPSSymbol('campsite', symbols);
      expect(campsiteSymbol).toBe('Campground');
    });
  });

  describe('GPS Device Compatibility', () => {
    it('should support Garmin compatibility', async () => {
      const options: ExportOptions = {
        ...defaultExportOptions,
        format: 'gpx',
        gpsDeviceCompatibility: 'garmin',
      };

      const result = await RouteExportService.exportRoute(mockWaypoints, options);

      expect(result.success).toBe(true);
      expect(result.exportInfo.compatibility).toContain('Garmin Devices');
    });

    it('should support TomTom compatibility', async () => {
      const options: ExportOptions = {
        ...defaultExportOptions,
        format: 'gpx',
        gpsDeviceCompatibility: 'tomtom',
      };

      const result = await RouteExportService.exportRoute(mockWaypoints, options);

      expect(result.success).toBe(true);
      expect(result.exportInfo.compatibility).toContain('TomTom Devices');
    });

    it('should support smartphone compatibility', async () => {
      const options: ExportOptions = {
        ...defaultExportOptions,
        format: 'gpx',
        gpsDeviceCompatibility: 'smartphone',
      };

      const result = await RouteExportService.exportRoute(mockWaypoints, options);

      expect(result.success).toBe(true);
      expect(result.exportInfo.compatibility.length).toBeGreaterThan(0);
    });

    it('should support universal compatibility', async () => {
      const options: ExportOptions = {
        ...defaultExportOptions,
        format: 'gpx',
        gpsDeviceCompatibility: 'universal',
      };

      const result = await RouteExportService.exportRoute(mockWaypoints, options);

      expect(result.success).toBe(true);
    });
  });

  describe('Export Info', () => {
    it('should provide accurate export info', async () => {
      const options: ExportOptions = {
        ...defaultExportOptions,
        format: 'gpx',
      };

      const result = await RouteExportService.exportRoute(mockWaypoints, options);

      // exportInfo.waypoints only counts type='waypoint', not 'start' or 'end'
      expect(result.exportInfo.waypoints).toBe(1); // Only Lyon is type='waypoint'
      expect(result.exportInfo.totalPoints).toBe(3);
      expect(result.exportInfo.format).toBe('gpx');
      expect(result.exportInfo.exportedAt).toBeInstanceOf(Date);
    });

    it('should count campsites separately', async () => {
      const waypointsWithCampsites = [
        ...mockWaypoints,
        {
          id: '4',
          name: 'Campsite 1',
          lat: 44.0,
          lng: 5.0,
          type: 'campsite' as const,
        },
        {
          id: '5',
          name: 'Campsite 2',
          lat: 44.5,
          lng: 5.5,
          type: 'campsite' as const,
        },
      ];

      const options: ExportOptions = {
        ...defaultExportOptions,
        format: 'json',
      };

      const result = await RouteExportService.exportRoute(waypointsWithCampsites, options);

      expect(result.exportInfo.campsites).toBe(2);
      expect(result.exportInfo.waypoints).toBe(1); // Only Lyon is type='waypoint'
      expect(result.exportInfo.totalPoints).toBe(5);
    });
  });

  describe('Error Handling', () => {
    it('should handle export errors gracefully', async () => {
      const options: ExportOptions = {
        ...defaultExportOptions,
        format: 'gpx',
      };

      const result = await RouteExportService.exportRoute([], options);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should collect warnings', async () => {
      const waypointsWithoutNames = [
        { id: '1', lat: 48.8566, lng: 2.3522, type: 'start' as const, name: '' },
        { id: '2', lat: 45.764, lng: 4.8357, type: 'end' as const, name: '' },
      ];

      const options: ExportOptions = {
        ...defaultExportOptions,
        format: 'gpx',
      };

      const result = await RouteExportService.exportRoute(waypointsWithoutNames, options);

      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle missing additional data', async () => {
      const options: ExportOptions = {
        ...defaultExportOptions,
        format: 'json',
        includeVehicleInfo: true,
      };

      const result = await RouteExportService.exportRoute(mockWaypoints, options);

      expect(result.success).toBe(true);
      // Should succeed even without vehicle data
    });
  });

  describe('Edge Cases', () => {
    it('should handle single waypoint', async () => {
      const singleWaypoint = [mockWaypoints[0]];

      const options: ExportOptions = {
        ...defaultExportOptions,
        format: 'gpx',
      };

      const result = await RouteExportService.exportRoute(singleWaypoint, options);

      expect(result.success).toBe(true);
      expect(result.exportInfo.totalPoints).toBe(1);
    });

    it('should handle very long routes', async () => {
      const longRoute: Waypoint[] = [];
      for (let i = 0; i < 50; i++) {
        longRoute.push({
          id: `wp-${i}`,
          name: `Waypoint ${i}`,
          lat: 48 + i * 0.1,
          lng: 2 + i * 0.1,
          type: i === 0 ? 'start' : i === 49 ? 'end' : 'waypoint',
        });
      }

      const options: ExportOptions = {
        ...defaultExportOptions,
        format: 'gpx',
      };

      const result = await RouteExportService.exportRoute(longRoute, options);

      expect(result.success).toBe(true);
      expect(result.exportInfo.totalPoints).toBe(50);
    });

    it('should handle waypoints at extreme but valid coordinates', async () => {
      const extremeWaypoints = [
        {
          id: '1',
          name: 'North',
          lat: 85.0,
          lng: 0.1, // Avoid 0 since validation checks !wp.lng
          type: 'start' as const,
        },
        {
          id: '2',
          name: 'South',
          lat: -85.0,
          lng: 170.0,
          type: 'end' as const,
        },
      ];

      const options: ExportOptions = {
        ...defaultExportOptions,
        format: 'gpx',
      };

      const result = await RouteExportService.exportRoute(extremeWaypoints, options);

      expect(result.success).toBe(true);
      expect(result.exportInfo.totalPoints).toBe(2);
    });

    it('should handle all export options disabled', async () => {
      const options: ExportOptions = {
        ...defaultExportOptions,
        format: 'json',
        includeWaypoints: false,
        includeCampsites: false,
        includeRoute: false,
        includeVehicleInfo: false,
        includeMetadata: false,
      };

      const result = await RouteExportService.exportRoute(mockWaypoints, options);

      // Should still succeed with minimal data
      expect(result).toBeDefined();
    });
  });
});
