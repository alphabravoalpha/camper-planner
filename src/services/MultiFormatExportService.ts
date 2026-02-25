// Multi-Format Export Service
// Phase 2.1: Complete export functionality for KML, JSON, and CSV formats

import {
  type ExportableRoute,
  prepareRouteForExport,
  validateExportableRoute,
  type ExportFormat,
  EXPORT_FORMATS,
} from '../utils/routeExport';
import { type RouteResponse } from './RoutingService';
import { type Waypoint } from '../types';
import GPXExportService, { type ExportResult } from './GPXExportService';

export interface ExportOptions {
  includeWaypoints: boolean;
  includeTrackPoints: boolean;
  includeInstructions: boolean;
  includeElevation: boolean;
  includeMetadata: boolean;
  creator?: string;
  description?: string;
  format: 'gpx' | 'kml' | 'json' | 'csv';
}

class MultiFormatExportService {
  /**
   * Export route to any supported format
   */
  static async exportRoute(
    routeResponse: RouteResponse,
    waypoints: Waypoint[],
    format: 'gpx' | 'kml' | 'json' | 'csv',
    routeName?: string,
    options: Partial<ExportOptions> = {}
  ): Promise<ExportResult> {
    const exportOptions: ExportOptions = {
      includeWaypoints: true,
      includeTrackPoints: true,
      includeInstructions: true,
      includeElevation: true,
      includeMetadata: true,
      creator: 'European Camper Trip Planner',
      format,
      ...options,
    };

    try {
      switch (format) {
        case 'gpx':
          return await GPXExportService.exportToGPX(
            routeResponse,
            waypoints,
            routeName,
            exportOptions
          );
        case 'kml':
          return await this.exportToKML(routeResponse, waypoints, routeName, exportOptions);
        case 'json':
          return await this.exportToJSON(routeResponse, waypoints, routeName, exportOptions);
        case 'csv':
          return await this.exportToCSV(routeResponse, waypoints, routeName, exportOptions);
        default:
          return {
            success: false,
            error: `Unsupported format: ${format}`,
            format,
          };
      }
    } catch (error) {
      console.error(`${format.toUpperCase()} export error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown export error',
        format,
      };
    }
  }

  /**
   * Export to KML format
   */
  private static async exportToKML(
    routeResponse: RouteResponse,
    waypoints: Waypoint[],
    routeName?: string,
    options: ExportOptions = {} as ExportOptions
  ): Promise<ExportResult> {
    const exportableRoute = prepareRouteForExport(routeResponse, waypoints, routeName);

    if (!validateExportableRoute(exportableRoute)) {
      return {
        success: false,
        error: 'Invalid route data for KML export',
        format: 'kml',
      };
    }

    const kmlContent = this.generateKMLContent(exportableRoute, options);
    const filename = this.generateFilename(exportableRoute.name, 'kml');

    return {
      success: true,
      data: kmlContent,
      filename,
      format: 'kml',
      size: new Blob([kmlContent]).size,
    };
  }

  /**
   * Generate KML content
   */
  private static generateKMLContent(route: ExportableRoute, options: ExportOptions): string {
    const escapedName = this.escapeXML(route.name);
    const escapedDescription = this.escapeXML(route.description);

    let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapedName}</name>
    <description>${escapedDescription}</description>
`;

    // Styles for different waypoint types
    kml += `    <!-- Styles -->
    <Style id="start-point">
      <IconStyle>
        <Icon><href>http://maps.google.com/mapfiles/kml/paddle/grn-circle.png</href></Icon>
        <scale>1.2</scale>
      </IconStyle>
    </Style>
    <Style id="end-point">
      <IconStyle>
        <Icon><href>http://maps.google.com/mapfiles/kml/paddle/red-circle.png</href></Icon>
        <scale>1.2</scale>
      </IconStyle>
    </Style>
    <Style id="waypoint">
      <IconStyle>
        <Icon><href>http://maps.google.com/mapfiles/kml/paddle/blu-circle.png</href></Icon>
      </IconStyle>
    </Style>
    <Style id="campsite">
      <IconStyle>
        <Icon><href>http://maps.google.com/mapfiles/kml/paddle/ylw-stars.png</href></Icon>
      </IconStyle>
    </Style>
    <Style id="route-line">
      <LineStyle>
        <color>ff0000ff</color>
        <width>4</width>
      </LineStyle>
    </Style>
`;

    // Waypoints as placemarks
    if (options.includeWaypoints) {
      kml += `    <!-- Waypoints -->
    <Folder>
      <name>Waypoints</name>
`;

      route.waypoints.forEach((waypoint, index) => {
        let styleId = 'waypoint';
        if (waypoint.type === 'start') styleId = 'start-point';
        else if (waypoint.type === 'end') styleId = 'end-point';
        else if (waypoint.type === 'campsite') styleId = 'campsite';

        kml += `      <Placemark>
        <name>${this.escapeXML(waypoint.name)}</name>
        <description>
          <![CDATA[
            <strong>Type:</strong> ${waypoint.type}<br/>
            <strong>Position:</strong> ${index + 1} of ${route.waypoints.length}<br/>
            <strong>Coordinates:</strong> ${waypoint.lat.toFixed(4)}, ${waypoint.lng.toFixed(4)}
            ${waypoint.description ? `<br/><strong>Description:</strong> ${waypoint.description}` : ''}
          ]]>
        </description>
        <styleUrl>#${styleId}</styleUrl>
        <Point>
          <coordinates>${waypoint.lng},${waypoint.lat}${waypoint.elevation ? `,${waypoint.elevation}` : ''}</coordinates>
        </Point>
      </Placemark>
`;
      });

      kml += `    </Folder>
`;
    }

    // Route track
    if (options.includeTrackPoints) {
      kml += `    <!-- Route Track -->
    <Placemark>
      <name>${escapedName} Track</name>
      <description>
        <![CDATA[
          <strong>Distance:</strong> ${(route.track.totalDistance / 1000).toFixed(1)} km<br/>
          <strong>Duration:</strong> ${this.formatDuration(route.track.totalDuration)}<br/>
          <strong>Service:</strong> ${route.metadata.service}<br/>
          <strong>Profile:</strong> ${route.metadata.profile}
        ]]>
      </description>
      <styleUrl>#route-line</styleUrl>
      <LineString>
        <tessellate>1</tessellate>
        <coordinates>
`;

      // Add all track points as coordinates
      route.track.segments.forEach(segment => {
        segment.points.forEach(point => {
          kml += `          ${point.lng},${point.lat}${point.elevation ? `,${point.elevation}` : ',0'}
`;
        });
      });

      kml += `        </coordinates>
      </LineString>
    </Placemark>
`;
    }

    // Instructions as placemarks
    if (options.includeInstructions) {
      kml += `    <!-- Instructions -->
    <Folder>
      <name>Turn Instructions</name>
`;

      route.track.segments.forEach((segment, segmentIndex) => {
        if (segment.instructions) {
          segment.instructions.forEach((instruction, instrIndex) => {
            kml += `      <Placemark>
        <name>Instruction ${segmentIndex + 1}.${instrIndex + 1}</name>
        <description>
          <![CDATA[
            ${this.escapeXML(instruction.instruction)}<br/>
            <strong>Distance:</strong> ${(instruction.distance / 1000).toFixed(1)} km<br/>
            <strong>Duration:</strong> ${this.formatDuration(instruction.duration)}
            ${instruction.streetName ? `<br/><strong>Street:</strong> ${this.escapeXML(instruction.streetName)}` : ''}
            ${instruction.direction ? `<br/><strong>Direction:</strong> ${this.escapeXML(instruction.direction)}` : ''}
          ]]>
        </description>
        <Point>
          <coordinates>${instruction.coordinates[0]},${instruction.coordinates[1]},0</coordinates>
        </Point>
      </Placemark>
`;
          });
        }
      });

      kml += `    </Folder>
`;
    }

    kml += `  </Document>
</kml>`;

    return kml;
  }

  /**
   * Export to JSON format
   */
  private static async exportToJSON(
    routeResponse: RouteResponse,
    waypoints: Waypoint[],
    routeName?: string,
    options: ExportOptions = {} as ExportOptions
  ): Promise<ExportResult> {
    const exportableRoute = prepareRouteForExport(routeResponse, waypoints, routeName);

    if (!validateExportableRoute(exportableRoute)) {
      return {
        success: false,
        error: 'Invalid route data for JSON export',
        format: 'json',
      };
    }

    // Create comprehensive JSON export
    const jsonData = {
      ...exportableRoute,
      exportInfo: {
        format: 'json',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        exportedBy: options.creator || 'European Camper Trip Planner',
        options: {
          includeWaypoints: options.includeWaypoints,
          includeTrackPoints: options.includeTrackPoints,
          includeInstructions: options.includeInstructions,
          includeElevation: options.includeElevation,
          includeMetadata: options.includeMetadata,
        },
      },
      statistics: {
        totalWaypoints: exportableRoute.waypoints.length,
        totalTrackPoints: exportableRoute.track.segments.reduce(
          (sum, segment) => sum + segment.points.length,
          0
        ),
        totalSegments: exportableRoute.track.segments.length,
        totalInstructions: exportableRoute.track.segments.reduce(
          (sum, segment) => sum + (segment.instructions?.length || 0),
          0
        ),
        hasElevation: exportableRoute.track.segments.some(segment =>
          segment.points.some(point => point.elevation !== undefined)
        ),
        bounds: exportableRoute.track.bounds,
      },
    };

    const jsonContent = JSON.stringify(jsonData, null, 2);
    const filename = this.generateFilename(exportableRoute.name, 'json');

    return {
      success: true,
      data: jsonContent,
      filename,
      format: 'json',
      size: new Blob([jsonContent]).size,
    };
  }

  /**
   * Export to CSV format
   */
  private static async exportToCSV(
    routeResponse: RouteResponse,
    waypoints: Waypoint[],
    routeName?: string,
    options: ExportOptions = {} as ExportOptions
  ): Promise<ExportResult> {
    const exportableRoute = prepareRouteForExport(routeResponse, waypoints, routeName);

    if (!validateExportableRoute(exportableRoute)) {
      return {
        success: false,
        error: 'Invalid route data for CSV export',
        format: 'csv',
      };
    }

    let csvContent = '';

    // Waypoints CSV
    if (options.includeWaypoints) {
      csvContent += '# Waypoints\n';
      csvContent += 'ID,Name,Type,Latitude,Longitude,Elevation,Order,Description\n';

      exportableRoute.waypoints.forEach(waypoint => {
        csvContent += `"${waypoint.id}","${this.escapeCSV(waypoint.name)}","${waypoint.type}",${waypoint.lat},${waypoint.lng},${waypoint.elevation || ''},${waypoint.order},"${this.escapeCSV(waypoint.description || '')}"\n`;
      });

      csvContent += '\n';
    }

    // Track points CSV
    if (options.includeTrackPoints) {
      csvContent += '# Track Points\n';
      csvContent += 'Segment,Point_Index,Latitude,Longitude,Elevation,Distance,Time\n';

      exportableRoute.track.segments.forEach((segment, segmentIndex) => {
        segment.points.forEach((point, pointIndex) => {
          csvContent += `${segmentIndex + 1},${pointIndex + 1},${point.lat},${point.lng},${point.elevation || ''},${point.distance || ''},${point.time || ''}\n`;
        });
      });

      csvContent += '\n';
    }

    // Instructions CSV
    if (options.includeInstructions) {
      csvContent += '# Instructions\n';
      csvContent +=
        'Segment,Instruction_Index,Instruction,Distance,Duration,Direction,Street_Name,Latitude,Longitude\n';

      exportableRoute.track.segments.forEach((segment, segmentIndex) => {
        if (segment.instructions) {
          segment.instructions.forEach((instruction, instrIndex) => {
            csvContent += `${segmentIndex + 1},${instrIndex + 1},"${this.escapeCSV(instruction.instruction)}",${instruction.distance},${instruction.duration},"${this.escapeCSV(instruction.direction || '')}","${this.escapeCSV(instruction.streetName || '')}",${instruction.coordinates[1]},${instruction.coordinates[0]}\n`;
          });
        }
      });

      csvContent += '\n';
    }

    // Route summary
    csvContent += '# Route Summary\n';
    csvContent += 'Property,Value\n';
    csvContent += `"Route Name","${this.escapeCSV(exportableRoute.name)}"\n`;
    csvContent += `"Description","${this.escapeCSV(exportableRoute.description)}"\n`;
    csvContent += `"Total Distance (km)","${(exportableRoute.track.totalDistance / 1000).toFixed(2)}"\n`;
    csvContent += `"Total Duration","${this.formatDuration(exportableRoute.track.totalDuration)}"\n`;
    csvContent += `"Total Waypoints","${exportableRoute.waypoints.length}"\n`;
    csvContent += `"Total Segments","${exportableRoute.track.segments.length}"\n`;
    csvContent += `"Service","${exportableRoute.metadata.service}"\n`;
    csvContent += `"Profile","${exportableRoute.metadata.profile}"\n`;
    csvContent += `"Created","${exportableRoute.metadata.timestamp}"\n`;

    const filename = this.generateFilename(exportableRoute.name, 'csv');

    return {
      success: true,
      data: csvContent,
      filename,
      format: 'csv',
      size: new Blob([csvContent]).size,
    };
  }

  /**
   * Download any format
   */
  static async downloadRoute(
    routeResponse: RouteResponse,
    waypoints: Waypoint[],
    format: 'gpx' | 'kml' | 'json' | 'csv',
    routeName?: string,
    options?: Partial<ExportOptions>
  ): Promise<boolean> {
    try {
      const result = await this.exportRoute(routeResponse, waypoints, format, routeName, options);

      if (!result.success || !result.data || !result.filename) {
        throw new Error(result.error || 'Export failed');
      }

      const exportFormat = EXPORT_FORMATS[format];
      const blob = new Blob([result.data], { type: exportFormat.mimeType });
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
      console.error(`${format.toUpperCase()} download error:`, error);
      return false;
    }
  }

  /**
   * Get available export formats with their capabilities
   */
  static getAvailableFormats(): Array<ExportFormat & { capabilities: string[] }> {
    return Object.values(EXPORT_FORMATS).map(format => ({
      ...format,
      capabilities: [
        'Waypoints',
        ...(format.supportsElevation ? ['Elevation'] : []),
        ...(format.supportsInstructions ? ['Turn Instructions'] : []),
        'Track Points',
        'Metadata',
      ],
    }));
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

  private static escapeCSV(text: string): string {
    if (!text) return '';
    return text.replace(/"/g, '""');
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

export default MultiFormatExportService;
