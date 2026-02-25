// Route Export Service
// Phase 6.1: Comprehensive route and trip data export functionality

import { type Waypoint } from '../store';
import { type VehicleProfile } from '../store';
import { type Trip } from './TripStorageService';

// Type definitions for optional planning features
export interface TripPlan {
  days: number;
  stopsPerDay: number;
  accommodationNights: number;
}

export interface CostBreakdown {
  fuel: number;
  tolls: number;
  accommodation: number;
  total: number;
}

export interface ExportOptions {
  format: 'gpx' | 'json' | 'kml' | 'csv';
  includeWaypoints: boolean;
  includeCampsites: boolean;
  includeRoute: boolean;
  includeVehicleInfo: boolean;
  // includeCostData: boolean; // V2 feature - disabled in MVP
  // includePlanningData: boolean; // V2 feature - disabled in MVP
  includeMetadata: boolean;
  gpsDeviceCompatibility: 'garmin' | 'tomtom' | 'smartphone' | 'universal';
  customName?: string;
  description?: string;
  author?: string;
}

export interface ExportResult {
  success: boolean;
  data?: string | Blob;
  filename: string;
  fileSize: number;
  warnings: string[];
  errors: string[];
  exportInfo: {
    format: string;
    waypoints: number;
    campsites: number;
    totalPoints: number;
    exportedAt: Date;
    compatibility: string[];
  };
}

export interface GPXWaypoint {
  lat: number;
  lon: number;
  name: string;
  description?: string;
  type?: 'waypoint' | 'campsite' | 'poi' | 'fuel' | 'rest';
  symbol?: string;
  elevation?: number;
  time?: Date;
}

export interface GPXRoute {
  name: string;
  description?: string;
  waypoints: GPXWaypoint[];
  routePoints: Array<{ lat: number; lon: number; elevation?: number }>;
}

export interface GPXTrack {
  name: string;
  description?: string;
  segments: Array<{
    points: Array<{ lat: number; lon: number; elevation?: number; time?: Date }>;
  }>;
}

export interface JSONExportData {
  metadata: {
    version: string;
    exportedAt: Date;
    exportedBy: string;
    format: string;
    compatibility: string[];
  };
  trip?: Trip;
  route: {
    waypoints: Waypoint[];
    totalDistance?: number;
    estimatedDuration?: number;
  };
  vehicle?: VehicleProfile;
  planning?: TripPlan;
  costs?: CostBreakdown;
  exportOptions: ExportOptions;
}

// Additional data that can be passed to export methods
interface ExportAdditionalData {
  trip?: Trip;
  vehicle?: VehicleProfile;
}

// GPS symbol set for a specific device type
interface GPSSymbolSet {
  waypoint: string;
  campsite: string;
  poi: string;
  fuel: string;
  rest: string;
  accommodation: string;
  restaurant: string;
  [key: string]: string;
}

// GPS device symbol mappings for compatibility
const GPS_SYMBOLS: Record<string, GPSSymbolSet> = {
  garmin: {
    waypoint: 'Waypoint',
    campsite: 'Campground',
    poi: 'Tourist Attraction',
    fuel: 'Gas Station',
    rest: 'Rest Area',
    accommodation: 'Lodging',
    restaurant: 'Restaurant',
  },
  tomtom: {
    waypoint: 'Destination',
    campsite: 'Camping',
    poi: 'Attraction',
    fuel: 'Petrol Station',
    rest: 'Rest Area',
    accommodation: 'Hotel',
    restaurant: 'Restaurant',
  },
  smartphone: {
    waypoint: 'flag',
    campsite: 'campground',
    poi: 'star',
    fuel: 'gas-station',
    rest: 'rest-area',
    accommodation: 'lodging',
    restaurant: 'restaurant',
  },
  universal: {
    waypoint: 'waypoint',
    campsite: 'campsite',
    poi: 'poi',
    fuel: 'fuel',
    rest: 'rest',
    accommodation: 'accommodation',
    restaurant: 'restaurant',
  },
};

export class RouteExportService {
  /**
   * Export route data in specified format
   */
  static async exportRoute(
    waypoints: Waypoint[],
    options: ExportOptions,
    additionalData?: {
      trip?: Trip;
      vehicle?: VehicleProfile;
      // planning?: TripPlan; // V2 feature - disabled in MVP
      // costs?: CostBreakdown; // V2 feature - disabled in MVP
    }
  ): Promise<ExportResult> {
    const warnings: string[] = [];

    try {
      // Validate input data
      const validation = this.validateExportData(waypoints, options);
      warnings.push(...validation.warnings);

      if (validation.errors.length > 0) {
        return {
          success: false,
          filename: '',
          fileSize: 0,
          warnings,
          errors: validation.errors,
          exportInfo: {
            format: options.format,
            waypoints: 0,
            campsites: 0,
            totalPoints: 0,
            exportedAt: new Date(),
            compatibility: [],
          },
        };
      }

      // Filter waypoints based on options
      let exportWaypoints = waypoints;
      if (!options.includeWaypoints) {
        exportWaypoints = exportWaypoints.filter(wp => wp.type !== 'waypoint');
      }
      if (!options.includeCampsites) {
        exportWaypoints = exportWaypoints.filter(wp => wp.type !== 'campsite');
      }

      let result: ExportResult;

      switch (options.format) {
        case 'gpx':
          result = await this.exportToGPX(exportWaypoints, options, additionalData);
          break;
        case 'json':
          result = await this.exportToJSON(exportWaypoints, options, additionalData);
          break;
        case 'kml':
          result = await this.exportToKML(exportWaypoints, options, additionalData);
          break;
        case 'csv':
          result = await this.exportToCSV(exportWaypoints, options, additionalData);
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }

      result.warnings.push(...warnings);
      return result;
    } catch (error) {
      console.error('Export error:', error);
      return {
        success: false,
        filename: '',
        fileSize: 0,
        warnings,
        errors: [`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        exportInfo: {
          format: options.format,
          waypoints: 0,
          campsites: 0,
          totalPoints: 0,
          exportedAt: new Date(),
          compatibility: [],
        },
      };
    }
  }

  /**
   * Export to GPX format with GPS device compatibility
   */
  static async exportToGPX(
    waypoints: Waypoint[],
    options: ExportOptions,
    additionalData?: ExportAdditionalData
  ): Promise<ExportResult> {
    const warnings: string[] = [];
    const symbols = GPS_SYMBOLS[options.gpsDeviceCompatibility] || GPS_SYMBOLS.universal;

    // Create GPX XML structure
    const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Camper Planner"
     xmlns="http://www.topografix.com/GPX/1/1"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${this.escapeXML(options.customName || 'Camper Route')}</name>
    <desc>${this.escapeXML(options.description || 'Route exported from Camper Planner')}</desc>
    <author>
      <name>${this.escapeXML(options.author || 'Camper Planner')}</name>
    </author>
    <time>${new Date().toISOString()}</time>
  </metadata>`;

    let gpxWaypoints = '';
    let gpxRoute = '';
    let gpxTrack = '';

    // Add waypoints
    if (options.includeWaypoints || options.includeCampsites) {
      waypoints.forEach((waypoint, _index) => {
        const symbol = this.getGPSSymbol(waypoint.type, symbols);
        const description = this.createWaypointDescription(waypoint, options, additionalData);

        gpxWaypoints += `
  <wpt lat="${waypoint.lat}" lon="${waypoint.lng}">
    <name>${this.escapeXML(waypoint.name)}</name>
    <desc>${this.escapeXML(description)}</desc>
    <sym>${this.escapeXML(symbol)}</sym>
    <type>${this.escapeXML(waypoint.type)}</type>
  </wpt>`;
      });
    }

    // Add route (for navigation)
    if (options.includeRoute && waypoints.length > 1) {
      gpxRoute = `
  <rte>
    <name>${this.escapeXML(options.customName || 'Camper Route')}</name>
    <desc>${this.escapeXML('Navigation route for GPS devices')}</desc>`;

      waypoints.forEach((waypoint, _index) => {
        gpxRoute += `
    <rtept lat="${waypoint.lat}" lon="${waypoint.lng}">
      <name>${this.escapeXML(waypoint.name)}</name>
      <desc>${this.escapeXML(`Stop ${_index + 1}: ${waypoint.name}`)}</desc>
    </rtept>`;
      });

      gpxRoute += `
  </rte>`;
    }

    // Add track (for breadcrumb trail)
    if (options.includeRoute && waypoints.length > 1) {
      gpxTrack = `
  <trk>
    <name>${this.escapeXML(options.customName || 'Camper Track')}</name>
    <desc>${this.escapeXML('Track for route visualization')}</desc>
    <trkseg>`;

      waypoints.forEach(waypoint => {
        gpxTrack += `
      <trkpt lat="${waypoint.lat}" lon="${waypoint.lng}">
        <name>${this.escapeXML(waypoint.name)}</name>
      </trkpt>`;
      });

      gpxTrack += `
    </trkseg>
  </trk>`;
    }

    const gpxFooter = `
</gpx>`;

    const gpxContent = gpxHeader + gpxWaypoints + gpxRoute + gpxTrack + gpxFooter;

    // Validate GPX compatibility
    const compatibility = this.validateGPXCompatibility(gpxContent, options.gpsDeviceCompatibility);
    warnings.push(...compatibility.warnings);

    const filename = `${options.customName || 'camper-route'}_${this.formatDate(new Date())}.gpx`;
    const fileSize = new Blob([gpxContent]).size;

    return {
      success: true,
      data: gpxContent,
      filename,
      fileSize,
      warnings,
      errors: [],
      exportInfo: {
        format: 'gpx',
        waypoints: waypoints.filter(w => w.type === 'waypoint').length,
        campsites: waypoints.filter(w => w.type === 'campsite').length,
        totalPoints: waypoints.length,
        exportedAt: new Date(),
        compatibility: compatibility.devices,
      },
    };
  }

  /**
   * Export to comprehensive JSON format
   */
  static async exportToJSON(
    waypoints: Waypoint[],
    options: ExportOptions,
    additionalData?: ExportAdditionalData
  ): Promise<ExportResult> {
    const exportData: JSONExportData = {
      metadata: {
        version: '1.0.0',
        exportedAt: new Date(),
        exportedBy: 'Camper Planner',
        format: 'json',
        compatibility: ['Camper Planner', 'Generic GPS Applications'],
      },
      route: {
        waypoints,
        totalDistance: this.calculateTotalDistance(waypoints),
        estimatedDuration: this.calculateTotalDistance(waypoints) / 70, // Rough estimate
      },
      exportOptions: options,
    };

    // Add optional data based on export options
    if (options.includeVehicleInfo && additionalData?.vehicle) {
      exportData.vehicle = additionalData.vehicle;
    }

    // V2 features disabled in MVP:
    // if (options.includePlanningData && additionalData?.planning) {
    //   exportData.planning = additionalData.planning;
    // }
    // if (options.includeCostData && additionalData?.costs) {
    //   exportData.costs = additionalData.costs;
    // }

    if (additionalData?.trip) {
      exportData.trip = additionalData.trip;
    }

    const jsonContent = JSON.stringify(exportData, null, 2);
    const filename = `${options.customName || 'camper-trip'}_${this.formatDate(new Date())}.json`;
    const fileSize = new Blob([jsonContent]).size;

    return {
      success: true,
      data: jsonContent,
      filename,
      fileSize,
      warnings: [],
      errors: [],
      exportInfo: {
        format: 'json',
        waypoints: waypoints.filter(w => w.type === 'waypoint').length,
        campsites: waypoints.filter(w => w.type === 'campsite').length,
        totalPoints: waypoints.length,
        exportedAt: new Date(),
        compatibility: ['Camper Planner', 'Generic Applications'],
      },
    };
  }

  /**
   * Export to KML format for Google Earth
   */
  static async exportToKML(
    waypoints: Waypoint[],
    options: ExportOptions,
    additionalData?: ExportAdditionalData
  ): Promise<ExportResult> {
    const warnings: string[] = [];

    const kmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${this.escapeXML(options.customName || 'Camper Route')}</name>
    <description>${this.escapeXML(options.description || 'Route exported from Camper Planner')}</description>

    <!-- Styles -->
    <Style id="waypointStyle">
      <IconStyle>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/pushpin/red-pushpin.png</href>
        </Icon>
      </IconStyle>
    </Style>
    <Style id="campsiteStyle">
      <IconStyle>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/pal4/icon46.png</href>
        </Icon>
      </IconStyle>
    </Style>
    <Style id="routeStyle">
      <LineStyle>
        <color>ff0000ff</color>
        <width>3</width>
      </LineStyle>
    </Style>`;

    let kmlContent = kmlHeader;

    // Add placemarks for waypoints
    waypoints.forEach((waypoint, _index) => {
      const styleId = waypoint.type === 'campsite' ? 'campsiteStyle' : 'waypointStyle';
      const description = this.createWaypointDescription(waypoint, options, additionalData);

      kmlContent += `
    <Placemark>
      <name>${this.escapeXML(waypoint.name)}</name>
      <description><![CDATA[${description}]]></description>
      <styleUrl>#${styleId}</styleUrl>
      <Point>
        <coordinates>${waypoint.lng},${waypoint.lat},0</coordinates>
      </Point>
    </Placemark>`;
    });

    // Add route line if requested
    if (options.includeRoute && waypoints.length > 1) {
      kmlContent += `
    <Placemark>
      <name>Route</name>
      <description>Navigation route</description>
      <styleUrl>#routeStyle</styleUrl>
      <LineString>
        <tessellate>1</tessellate>
        <coordinates>`;

      waypoints.forEach(waypoint => {
        kmlContent += `${waypoint.lng},${waypoint.lat},0 `;
      });

      kmlContent += `
        </coordinates>
      </LineString>
    </Placemark>`;
    }

    kmlContent += `
  </Document>
</kml>`;

    const filename = `${options.customName || 'camper-route'}_${this.formatDate(new Date())}.kml`;
    const fileSize = new Blob([kmlContent]).size;

    return {
      success: true,
      data: kmlContent,
      filename,
      fileSize,
      warnings,
      errors: [],
      exportInfo: {
        format: 'kml',
        waypoints: waypoints.filter(w => w.type === 'waypoint').length,
        campsites: waypoints.filter(w => w.type === 'campsite').length,
        totalPoints: waypoints.length,
        exportedAt: new Date(),
        compatibility: ['Google Earth', 'Google Maps', 'Many GPS Applications'],
      },
    };
  }

  /**
   * Export to CSV format for spreadsheet applications
   */
  static async exportToCSV(
    waypoints: Waypoint[],
    options: ExportOptions,
    additionalData?: ExportAdditionalData
  ): Promise<ExportResult> {
    const headers = ['Name', 'Latitude', 'Longitude', 'Type'];

    if (options.includeMetadata) {
      headers.push('Description', 'Index', 'Distance from Previous (km)');
    }

    let csvContent = headers.join(',') + '\n';

    let totalDistance = 0;
    waypoints.forEach((waypoint, _index) => {
      const row = [
        `"${this.escapeCSV(waypoint.name)}"`,
        waypoint.lat.toString(),
        waypoint.lng.toString(),
        `"${waypoint.type}"`,
      ];

      if (options.includeMetadata) {
        const description = this.createWaypointDescription(waypoint, options, additionalData);
        let distanceFromPrevious = 0;

        if (_index > 0) {
          distanceFromPrevious = this.calculateDistance(waypoints[_index - 1], waypoint);
          totalDistance += distanceFromPrevious;
        }

        row.push(
          `"${this.escapeCSV(description)}"`,
          (_index + 1).toString(),
          distanceFromPrevious.toFixed(2)
        );
      }

      csvContent += row.join(',') + '\n';
    });

    // Add summary row if metadata included
    if (options.includeMetadata) {
      csvContent += '\n';
      csvContent += `"TOTAL","","","","Total Distance: ${totalDistance.toFixed(2)} km","${waypoints.length} waypoints",""\n`;
    }

    const filename = `${options.customName || 'camper-route'}_${this.formatDate(new Date())}.csv`;
    const fileSize = new Blob([csvContent]).size;

    return {
      success: true,
      data: csvContent,
      filename,
      fileSize,
      warnings: [],
      errors: [],
      exportInfo: {
        format: 'csv',
        waypoints: waypoints.filter(w => w.type === 'waypoint').length,
        campsites: waypoints.filter(w => w.type === 'campsite').length,
        totalPoints: waypoints.length,
        exportedAt: new Date(),
        compatibility: ['Excel', 'Google Sheets', 'Numbers', 'Any Spreadsheet Application'],
      },
    };
  }

  /**
   * Import trip data from various formats
   */
  static async importRoute(
    fileContent: string,
    format: string
  ): Promise<{
    success: boolean;
    waypoints: Waypoint[];
    metadata?: Record<string, unknown>;
    warnings: string[];
    errors: string[];
  }> {
    try {
      switch (format.toLowerCase()) {
        case 'gpx':
          return this.importFromGPX(fileContent);
        case 'json':
          return this.importFromJSON(fileContent);
        case 'kml':
          return this.importFromKML(fileContent);
        case 'csv':
          return this.importFromCSV(fileContent);
        default:
          throw new Error(`Unsupported import format: ${format}`);
      }
    } catch (error) {
      return {
        success: false,
        waypoints: [],
        warnings: [],
        errors: [`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * Import from GPX format
   */
  static importFromGPX(gpxContent: string): {
    success: boolean;
    waypoints: Waypoint[];
    metadata?: Record<string, unknown>;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];
    const waypoints: Waypoint[] = [];

    try {
      // Parse GPX XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(gpxContent, 'text/xml');

      // Check for parsing errors
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        throw new Error('Invalid GPX format: ' + parseError.textContent);
      }

      // Extract waypoints
      const wpts = xmlDoc.querySelectorAll('wpt');
      wpts.forEach((wpt, _index) => {
        const lat = parseFloat(wpt.getAttribute('lat') || '0');
        const lon = parseFloat(wpt.getAttribute('lon') || '0');
        const name = wpt.querySelector('name')?.textContent || `Waypoint ${_index + 1}`;
        const __desc = wpt.querySelector('desc')?.textContent || '';
        const type = wpt.querySelector('type')?.textContent || 'waypoint';

        if (lat && lon) {
          waypoints.push({
            id: `imported_${Date.now()}_${_index}`,
            lat,
            lng: lon,
            name,
            type: type as Waypoint['type'],
          });
        }
      });

      // Extract route points if no waypoints found
      if (waypoints.length === 0) {
        const rtepts = xmlDoc.querySelectorAll('rtept');
        rtepts.forEach((rtept, _index) => {
          const lat = parseFloat(rtept.getAttribute('lat') || '0');
          const lon = parseFloat(rtept.getAttribute('lon') || '0');
          const name = rtept.querySelector('name')?.textContent || `Route Point ${_index + 1}`;

          if (lat && lon) {
            waypoints.push({
              id: `imported_route_${Date.now()}_${_index}`,
              lat,
              lng: lon,
              name,
              type: 'waypoint',
            });
          }
        });
      }

      if (waypoints.length === 0) {
        warnings.push('No waypoints or route points found in GPX file');
      }

      return {
        success: true,
        waypoints,
        warnings,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        waypoints: [],
        warnings,
        errors: [`GPX import failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * Import from JSON format
   */
  static importFromJSON(jsonContent: string): {
    success: boolean;
    waypoints: Waypoint[];
    metadata?: Record<string, unknown>;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      const data = JSON.parse(jsonContent) as JSONExportData;

      // Validate JSON structure
      if (!data.route?.waypoints) {
        throw new Error('Invalid JSON format: missing route.waypoints');
      }

      // Extract waypoints
      const waypoints = data.route.waypoints.map((wp, _index) => ({
        ...wp,
        id: wp.id || `imported_${Date.now()}_${_index}`,
      }));

      return {
        success: true,
        waypoints,
        metadata: data,
        warnings,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        waypoints: [],
        warnings,
        errors: [`JSON import failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * Import from KML format
   */
  static importFromKML(kmlContent: string): {
    success: boolean;
    waypoints: Waypoint[];
    metadata?: Record<string, unknown>;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];
    const waypoints: Waypoint[] = [];

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(kmlContent, 'text/xml');

      const placemarks = xmlDoc.querySelectorAll('Placemark');
      placemarks.forEach((placemark, _index) => {
        const name = placemark.querySelector('name')?.textContent || `Waypoint ${_index + 1}`;
        const point = placemark.querySelector('Point coordinates');

        if (point?.textContent) {
          const coords = point.textContent.trim().split(',');
          if (coords.length >= 2) {
            const lng = parseFloat(coords[0]);
            const lat = parseFloat(coords[1]);

            if (!isNaN(lat) && !isNaN(lng)) {
              waypoints.push({
                id: `imported_kml_${Date.now()}_${_index}`,
                lat,
                lng,
                name,
                type: 'waypoint',
              });
            }
          }
        }
      });

      if (waypoints.length === 0) {
        warnings.push('No valid placemarks found in KML file');
      }

      return {
        success: true,
        waypoints,
        warnings,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        waypoints: [],
        warnings,
        errors: [`KML import failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * Import from CSV format
   */
  static importFromCSV(csvContent: string): {
    success: boolean;
    waypoints: Waypoint[];
    metadata?: Record<string, unknown>;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];
    const waypoints: Waypoint[] = [];

    try {
      const lines = csvContent.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        throw new Error('CSV must contain header and at least one data row');
      }

      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
      const nameIndex = headers.findIndex(h => h.includes('name'));
      const latIndex = headers.findIndex(h => h.includes('lat'));
      const lngIndex = headers.findIndex(h => h.includes('lng') || h.includes('lon'));
      const typeIndex = headers.findIndex(h => h.includes('type'));

      if (nameIndex === -1 || latIndex === -1 || lngIndex === -1) {
        throw new Error('CSV must contain Name, Latitude, and Longitude columns');
      }

      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i]);
        if (values.length > Math.max(nameIndex, latIndex, lngIndex)) {
          const name = values[nameIndex]?.replace(/"/g, '') || `Waypoint ${i}`;
          const lat = parseFloat(values[latIndex] || '0');
          const lng = parseFloat(values[lngIndex] || '0');
          const type =
            typeIndex >= 0 ? values[typeIndex]?.replace(/"/g, '') || 'waypoint' : 'waypoint';

          if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
            waypoints.push({
              id: `imported_csv_${Date.now()}_${i}`,
              lat,
              lng,
              name,
              type: type as Waypoint['type'],
            });
          }
        }
      }

      if (waypoints.length === 0) {
        warnings.push('No valid waypoints found in CSV file');
      }

      return {
        success: true,
        waypoints,
        warnings,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        waypoints: [],
        warnings,
        errors: [`CSV import failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * Helper methods
   */
  static validateExportData(
    waypoints: Waypoint[],
    _options: ExportOptions
  ): {
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];

    if (waypoints.length === 0) {
      errors.push('No waypoints to export');
      return { warnings, errors };
    }

    if (waypoints.length > 1000) {
      warnings.push('Large number of waypoints may cause performance issues on some GPS devices');
    }

    // Validate coordinates
    waypoints.forEach((wp, _index) => {
      if (!wp.lat || !wp.lng || isNaN(wp.lat) || isNaN(wp.lng)) {
        errors.push(`Invalid coordinates for waypoint ${_index + 1}: ${wp.name}`);
      }
      if (Math.abs(wp.lat) > 90 || Math.abs(wp.lng) > 180) {
        errors.push(`Coordinates out of range for waypoint ${_index + 1}: ${wp.name}`);
      }
    });

    // Validate names
    waypoints.forEach((wp, _index) => {
      if (!wp.name || wp.name.trim() === '') {
        warnings.push(`Waypoint ${_index + 1} has no name - will use default`);
      }
    });

    return { warnings, errors };
  }

  static validateGPXCompatibility(
    gpxContent: string,
    deviceType: string
  ): {
    warnings: string[];
    devices: string[];
  } {
    const warnings: string[] = [];
    const devices: string[] = [];

    // Basic compatibility checks
    devices.push('Generic GPS Devices');

    if (deviceType === 'garmin' || deviceType === 'universal') {
      devices.push('Garmin Devices');
      if (gpxContent.includes('<sym>')) {
        warnings.push('Garmin devices may not recognize all symbol types');
      }
    }

    if (deviceType === 'tomtom' || deviceType === 'universal') {
      devices.push('TomTom Devices');
    }

    if (deviceType === 'smartphone' || deviceType === 'universal') {
      devices.push('Smartphone Apps');
    }

    return { warnings, devices };
  }

  static getGPSSymbol(waypointType: string, symbols: GPSSymbolSet): string {
    return symbols[waypointType] || symbols.waypoint || 'waypoint';
  }

  static createWaypointDescription(
    waypoint: Waypoint,
    options: ExportOptions,
    _additionalData?: ExportAdditionalData
  ): string {
    let description = `${waypoint.type.charAt(0).toUpperCase() + waypoint.type.slice(1)}: ${waypoint.name}`;

    if (options.includeMetadata) {
      description += `\nCoordinates: ${waypoint.lat.toFixed(6)}, ${waypoint.lng.toFixed(6)}`;

      if (waypoint.type === 'campsite') {
        description += '\nAmenities: Check local information';
      }
    }

    return description;
  }

  static calculateTotalDistance(waypoints: Waypoint[]): number {
    if (waypoints.length < 2) return 0;

    let total = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      total += this.calculateDistance(waypoints[i], waypoints[i + 1]);
    }
    return total;
  }

  static calculateDistance(waypoint1: Waypoint, waypoint2: Waypoint): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((waypoint2.lat - waypoint1.lat) * Math.PI) / 180;
    const dLng = ((waypoint2.lng - waypoint1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((waypoint1.lat * Math.PI) / 180) *
        Math.cos((waypoint2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  static escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  static escapeCSV(text: string): string {
    return text.replace(/"/g, '""');
  }

  static formatDate(date: Date): string {
    return date.toISOString().split('T')[0].replace(/-/g, '');
  }

  static parseCSVLine(line: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }
}

// Export singleton instance
export const routeExportService = new RouteExportService();
