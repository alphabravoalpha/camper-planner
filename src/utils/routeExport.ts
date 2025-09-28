// Route Export Utilities
// Phase 3.4: Prepare route data for export (GPX format for Phase 6)

import { RouteResponse, RouteData, RouteStep } from '../services/RoutingService';
import { Waypoint } from '../types';

export interface ExportableRoute {
  id: string;
  name: string;
  description: string;
  waypoints: ExportableWaypoint[];
  track: ExportableTrack;
  metadata: ExportableMetadata;
}

export interface ExportableWaypoint {
  id: string;
  name: string;
  description?: string;
  lat: number;
  lng: number;
  elevation?: number;
  type: 'start' | 'waypoint' | 'end';
  order: number;
}

export interface ExportableTrack {
  name: string;
  segments: ExportableTrackSegment[];
  totalDistance: number; // meters
  totalDuration: number; // seconds
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface ExportableTrackSegment {
  points: ExportableTrackPoint[];
  distance: number; // meters
  duration: number; // seconds
  instructions?: ExportableInstruction[];
}

export interface ExportableTrackPoint {
  lat: number;
  lng: number;
  elevation?: number;
  time?: string; // ISO timestamp
  distance?: number; // cumulative distance from start
}

export interface ExportableInstruction {
  distance: number;
  duration: number;
  instruction: string;
  direction?: string;
  streetName?: string;
  coordinates: [number, number];
}

export interface ExportableMetadata {
  creator: string;
  version: string;
  timestamp: string;
  service: string;
  profile: string;
  vehicleProfile?: {
    height: number;
    width: number;
    weight: number;
    length: number;
  };
  restrictions?: {
    violatedDimensions: string[];
    warnings: string[];
  };
}

/**
 * Convert RouteResponse to exportable format
 */
export function prepareRouteForExport(
  routeResponse: RouteResponse,
  waypoints: Waypoint[],
  routeName?: string
): ExportableRoute {
  if (!routeResponse.routes.length) {
    throw new Error('No routes available for export');
  }

  const mainRoute = routeResponse.routes[0];
  const timestamp = new Date().toISOString();

  // Prepare waypoints
  const exportableWaypoints: ExportableWaypoint[] = waypoints.map((wp, index) => ({
    id: wp.id,
    name: wp.name || `Waypoint ${index + 1}`,
    description: undefined, // Could be added from wp.notes in future
    lat: wp.lat,
    lng: wp.lng,
    elevation: undefined, // Could be extracted from route if available
    type: wp.type,
    order: index
  }));

  // Calculate bounds
  const allCoordinates = mainRoute.geometry.coordinates;
  const bounds = {
    north: Math.max(...allCoordinates.map(coord => coord[1])),
    south: Math.min(...allCoordinates.map(coord => coord[1])),
    east: Math.max(...allCoordinates.map(coord => coord[0])),
    west: Math.min(...allCoordinates.map(coord => coord[0]))
  };

  // Prepare track segments
  const exportableSegments: ExportableTrackSegment[] = mainRoute.segments.map((segment, segmentIndex) => {
    // Extract track points for this segment
    const segmentPoints: ExportableTrackPoint[] = [];

    // For now, we'll use the full route geometry and divide it by segments
    // In a more sophisticated implementation, we'd have per-segment geometry
    const pointsPerSegment = Math.floor(allCoordinates.length / mainRoute.segments.length);
    const startIndex = segmentIndex * pointsPerSegment;
    const endIndex = segmentIndex === mainRoute.segments.length - 1
      ? allCoordinates.length
      : (segmentIndex + 1) * pointsPerSegment;

    let cumulativeDistance = 0;
    for (let i = startIndex; i < endIndex; i++) {
      const coord = allCoordinates[i];

      // Calculate cumulative distance (simple approximation)
      if (i > startIndex) {
        const prevCoord = allCoordinates[i - 1];
        cumulativeDistance += calculateDistance(
          prevCoord[1], prevCoord[0],
          coord[1], coord[0]
        );
      }

      segmentPoints.push({
        lat: coord[1],
        lng: coord[0],
        elevation: coord[2], // Third element if present
        distance: cumulativeDistance
      });
    }

    // Prepare instructions
    const instructions: ExportableInstruction[] = (segment.steps || []).map(step => ({
      distance: step.distance,
      duration: step.duration,
      instruction: step.instruction,
      streetName: step.name,
      coordinates: step.wayPoints
    }));

    return {
      points: segmentPoints,
      distance: segment.distance,
      duration: segment.duration,
      instructions: instructions.length > 0 ? instructions : undefined
    };
  });

  // Prepare track
  const exportableTrack: ExportableTrack = {
    name: routeName || `Route ${routeResponse.id}`,
    segments: exportableSegments,
    totalDistance: mainRoute.summary.distance,
    totalDuration: mainRoute.summary.duration,
    bounds
  };

  // Prepare metadata
  const exportableMetadata: ExportableMetadata = {
    creator: 'European Camper Trip Planner',
    version: '1.0.0',
    timestamp,
    service: routeResponse.metadata.service,
    profile: routeResponse.metadata.profile,
    vehicleProfile: routeResponse.metadata.query.vehicleProfile,
    restrictions: routeResponse.restrictions ? {
      violatedDimensions: routeResponse.restrictions.violatedDimensions,
      warnings: routeResponse.warnings || []
    } : undefined
  };

  return {
    id: routeResponse.id,
    name: routeName || `European Camper Route - ${new Date().toLocaleDateString()}`,
    description: `Generated route with ${waypoints.length} waypoints. Distance: ${Math.round(mainRoute.summary.distance / 1000)} km, Duration: ${Math.round(mainRoute.summary.duration / 3600)}h ${Math.round((mainRoute.summary.duration % 3600) / 60)}m`,
    waypoints: exportableWaypoints,
    track: exportableTrack,
    metadata: exportableMetadata
  };
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Validate exportable route data
 */
export function validateExportableRoute(route: ExportableRoute): boolean {
  // Basic validation
  if (!route.id || !route.waypoints.length || !route.track.segments.length) {
    return false;
  }

  // Waypoint validation
  for (const wp of route.waypoints) {
    if (!wp.id || !wp.name || !isValidCoordinate(wp.lat, wp.lng)) {
      return false;
    }
  }

  // Track validation
  for (const segment of route.track.segments) {
    if (!segment.points.length) {
      return false;
    }

    for (const point of segment.points) {
      if (!isValidCoordinate(point.lat, point.lng)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Check if coordinates are valid
 */
function isValidCoordinate(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Get route statistics for export summary
 */
export function getRouteStatistics(route: ExportableRoute) {
  const totalPoints = route.track.segments.reduce((sum, segment) => sum + segment.points.length, 0);
  const hasElevation = route.track.segments.some(segment =>
    segment.points.some(point => point.elevation !== undefined)
  );
  const hasInstructions = route.track.segments.some(segment =>
    segment.instructions && segment.instructions.length > 0
  );

  return {
    waypoints: route.waypoints.length,
    segments: route.track.segments.length,
    trackPoints: totalPoints,
    totalDistance: route.track.totalDistance,
    totalDuration: route.track.totalDuration,
    hasElevation,
    hasInstructions,
    bounds: route.track.bounds,
    vehicleCompatible: !route.metadata.restrictions?.violatedDimensions.length
  };
}

/**
 * Format route for different export formats (preparation for Phase 6)
 */
export interface ExportFormat {
  format: 'gpx' | 'kml' | 'json' | 'csv';
  mimeType: string;
  extension: string;
  supportsElevation: boolean;
  supportsInstructions: boolean;
}

export const EXPORT_FORMATS: Record<string, ExportFormat> = {
  gpx: {
    format: 'gpx',
    mimeType: 'application/gpx+xml',
    extension: '.gpx',
    supportsElevation: true,
    supportsInstructions: true
  },
  kml: {
    format: 'kml',
    mimeType: 'application/vnd.google-earth.kml+xml',
    extension: '.kml',
    supportsElevation: true,
    supportsInstructions: false
  },
  json: {
    format: 'json',
    mimeType: 'application/json',
    extension: '.json',
    supportsElevation: true,
    supportsInstructions: true
  },
  csv: {
    format: 'csv',
    mimeType: 'text/csv',
    extension: '.csv',
    supportsElevation: true,
    supportsInstructions: false
  }
};

/**
 * Get suggested filename for export
 */
export function getSuggestedFilename(route: ExportableRoute, format: ExportFormat): string {
  const sanitizedName = route.name
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase();

  const timestamp = new Date().toISOString().split('T')[0];
  return `${sanitizedName}_${timestamp}${format.extension}`;
}