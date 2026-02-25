// GPX Export Service
// Phase 2.1: Complete GPX export functionality for route data

import {
  type ExportableRoute,
  prepareRouteForExport,
  validateExportableRoute,
} from '../utils/routeExport';
import { type RouteResponse } from './RoutingService';
import { type Waypoint } from '../types';

export interface GPXExportOptions {
  includeWaypoints: boolean;
  includeTrackPoints: boolean;
  includeInstructions: boolean;
  includeElevation: boolean;
  includeMetadata: boolean;
  creator?: string;
  description?: string;
}

export interface ExportResult {
  success: boolean;
  data?: string;
  filename?: string;
  error?: string;
  format: string;
  size?: number;
}

class GPXExportService {
  private static readonly DEFAULT_OPTIONS: GPXExportOptions = {
    includeWaypoints: true,
    includeTrackPoints: true,
    includeInstructions: true,
    includeElevation: true,
    includeMetadata: true,
    creator: 'European Camper Trip Planner',
  };

  /**
   * Export route to GPX format
   */
  static async exportToGPX(
    routeResponse: RouteResponse,
    waypoints: Waypoint[],
    routeName?: string,
    options: Partial<GPXExportOptions> = {}
  ): Promise<ExportResult> {
    try {
      const exportOptions = { ...this.DEFAULT_OPTIONS, ...options };

      // Prepare route data for export
      const exportableRoute = prepareRouteForExport(routeResponse, waypoints, routeName);

      // Validate the route data
      if (!validateExportableRoute(exportableRoute)) {
        return {
          success: false,
          error: 'Invalid route data for export',
          format: 'gpx',
        };
      }

      // Generate GPX content
      const gpxContent = this.generateGPXContent(exportableRoute, exportOptions);

      // Generate filename
      const filename = this.generateFilename(exportableRoute.name, 'gpx');

      return {
        success: true,
        data: gpxContent,
        filename,
        format: 'gpx',
        size: new Blob([gpxContent]).size,
      };
    } catch (error) {
      console.error('GPX export error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown export error',
        format: 'gpx',
      };
    }
  }

  /**
   * Generate GPX XML content
   */
  private static generateGPXContent(route: ExportableRoute, options: GPXExportOptions): string {
    const escapedName = this.escapeXML(route.name);
    const escapedDescription = this.escapeXML(route.description);

    let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="${this.escapeXML(options.creator || 'Camper Planner')}"
     xmlns="http://www.topografix.com/GPX/1/1"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
`;

    // Metadata
    if (options.includeMetadata) {
      gpx += `  <metadata>
    <name>${escapedName}</name>
    <desc>${escapedDescription}</desc>
    <author>
      <name>${this.escapeXML(route.metadata.creator)}</name>
    </author>
    <time>${route.metadata.timestamp}</time>
    <bounds minlat="${route.track.bounds.south}" minlon="${route.track.bounds.west}"
            maxlat="${route.track.bounds.north}" maxlon="${route.track.bounds.east}"/>
`;

      // Add vehicle profile info as extensions
      if (route.metadata.vehicleProfile) {
        gpx += `    <extensions>
      <vehicle_profile>
        <height>${route.metadata.vehicleProfile.height}</height>
        <width>${route.metadata.vehicleProfile.width}</width>
        <length>${route.metadata.vehicleProfile.length}</length>
        <weight>${route.metadata.vehicleProfile.weight}</weight>
      </vehicle_profile>
`;

        // Add restrictions if any
        if (route.metadata.restrictions) {
          gpx += `      <restrictions>
        <violated_dimensions>${route.metadata.restrictions.violatedDimensions.join(', ')}</violated_dimensions>
        <warnings>${route.metadata.restrictions.warnings.join('; ')}</warnings>
      </restrictions>
`;
        }

        gpx += `    </extensions>
`;
      }

      gpx += `  </metadata>
`;
    }

    // Waypoints
    if (options.includeWaypoints) {
      route.waypoints.forEach(waypoint => {
        gpx += `  <wpt lat="${waypoint.lat}" lon="${waypoint.lng}">
    <name>${this.escapeXML(waypoint.name)}</name>
    <type>${waypoint.type}</type>
`;

        if (waypoint.description) {
          gpx += `    <desc>${this.escapeXML(waypoint.description)}</desc>
`;
        }

        if (waypoint.elevation && options.includeElevation) {
          gpx += `    <ele>${waypoint.elevation}</ele>
`;
        }

        // Add custom extensions for waypoint order and type
        gpx += `    <extensions>
      <order>${waypoint.order}</order>
      <waypoint_type>${waypoint.type}</waypoint_type>
    </extensions>
`;

        gpx += `  </wpt>
`;
      });
    }

    // Track
    if (options.includeTrackPoints) {
      gpx += `  <trk>
    <name>${escapedName} Track</name>
    <desc>Route track with ${route.track.segments.length} segments</desc>
    <extensions>
      <total_distance>${route.track.totalDistance}</total_distance>
      <total_duration>${route.track.totalDuration}</total_duration>
      <service>${this.escapeXML(route.metadata.service)}</service>
      <profile>${this.escapeXML(route.metadata.profile)}</profile>
    </extensions>
`;

      // Track segments
      route.track.segments.forEach((segment, _segmentIndex) => {
        gpx += `    <trkseg>
`;

        // Track points
        segment.points.forEach(point => {
          gpx += `      <trkpt lat="${point.lat}" lon="${point.lng}">
`;

          if (point.elevation && options.includeElevation) {
            gpx += `        <ele>${point.elevation}</ele>
`;
          }

          if (point.time) {
            gpx += `        <time>${point.time}</time>
`;
          }

          if (point.distance !== undefined) {
            gpx += `        <extensions>
          <distance>${point.distance}</distance>
        </extensions>
`;
          }

          gpx += `      </trkpt>
`;
        });

        // Add segment instructions as route points if requested
        if (options.includeInstructions && segment.instructions) {
          segment.instructions.forEach((instruction, instrIndex) => {
            gpx += `      <!-- Instruction ${instrIndex + 1}: ${this.escapeXML(instruction.instruction)} -->
      <trkpt lat="${instruction.coordinates[1]}" lon="${instruction.coordinates[0]}">
        <name>Instruction ${instrIndex + 1}</name>
        <desc>${this.escapeXML(instruction.instruction)}</desc>
        <extensions>
          <instruction>
            <text>${this.escapeXML(instruction.instruction)}</text>
            <distance>${instruction.distance}</distance>
            <duration>${instruction.duration}</duration>
            ${instruction.direction ? `<direction>${this.escapeXML(instruction.direction)}</direction>` : ''}
            ${instruction.streetName ? `<street>${this.escapeXML(instruction.streetName)}</street>` : ''}
          </instruction>
        </extensions>
      </trkpt>
`;
          });
        }

        gpx += `    </trkseg>
`;
      });

      gpx += `  </trk>
`;
    }

    // Route (alternative to track, contains waypoints in sequence)
    gpx += `  <rte>
    <name>${escapedName} Route</name>
    <desc>Waypoint-based route</desc>
`;

    route.waypoints.forEach(waypoint => {
      gpx += `    <rtept lat="${waypoint.lat}" lon="${waypoint.lng}">
      <name>${this.escapeXML(waypoint.name)}</name>
      <desc>${waypoint.type}</desc>
    </rtept>
`;
    });

    gpx += `  </rte>
`;

    gpx += `</gpx>`;

    return gpx;
  }

  /**
   * Download GPX file to user's device
   */
  static async downloadGPX(
    routeResponse: RouteResponse,
    waypoints: Waypoint[],
    routeName?: string,
    options?: Partial<GPXExportOptions>
  ): Promise<boolean> {
    try {
      const result = await this.exportToGPX(routeResponse, waypoints, routeName, options);

      if (!result.success || !result.data || !result.filename) {
        throw new Error(result.error || 'Export failed');
      }

      // Create and trigger download
      const blob = new Blob([result.data], { type: 'application/gpx+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('GPX download error:', error);
      return false;
    }
  }

  /**
   * Validate GPX content
   */
  static validateGPX(gpxContent: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic XML structure validation
    if (!gpxContent.includes('<?xml')) {
      errors.push('Missing XML declaration');
    }

    if (!gpxContent.includes('<gpx')) {
      errors.push('Missing GPX root element');
    }

    if (!gpxContent.includes('</gpx>')) {
      errors.push('Missing closing GPX tag');
    }

    // Check for required elements
    if (!gpxContent.includes('<metadata>')) {
      errors.push('Missing metadata section');
    }

    // Validate coordinate format (basic check)
    const coordRegex = /lat="(-?\d+\.?\d*)" lon="(-?\d+\.?\d*)"/g;
    const coordMatches = [...gpxContent.matchAll(coordRegex)];

    for (const match of coordMatches) {
      const lat = parseFloat(match[1]);
      const lon = parseFloat(match[2]);

      if (lat < -90 || lat > 90) {
        errors.push(`Invalid latitude: ${lat}`);
      }

      if (lon < -180 || lon > 180) {
        errors.push(`Invalid longitude: ${lon}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get export statistics
   */
  static getExportStats(route: ExportableRoute): {
    waypoints: number;
    trackPoints: number;
    segments: number;
    distance: string;
    duration: string;
    hasElevation: boolean;
    hasInstructions: boolean;
  } {
    const totalTrackPoints = route.track.segments.reduce(
      (sum, segment) => sum + segment.points.length,
      0
    );
    const hasElevation = route.track.segments.some(segment =>
      segment.points.some(point => point.elevation !== undefined)
    );
    const hasInstructions = route.track.segments.some(
      segment => segment.instructions && segment.instructions.length > 0
    );

    return {
      waypoints: route.waypoints.length,
      trackPoints: totalTrackPoints,
      segments: route.track.segments.length,
      distance: `${(route.track.totalDistance / 1000).toFixed(1)} km`,
      duration: this.formatDuration(route.track.totalDuration),
      hasElevation,
      hasInstructions,
    };
  }

  /**
   * Helper methods
   */
  private static escapeXML(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private static generateFilename(routeName: string, extension: string): string {
    const sanitizedName = routeName
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase();

    const timestamp = new Date().toISOString().split('T')[0];
    return `${sanitizedName}_${timestamp}.${extension}`;
  }

  private static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}

export default GPXExportService;
