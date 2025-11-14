// Route Distance Calculation Utilities
// Phase 4.3: Calculate distances from campsites to routes for filtering

import type { Campsite } from '../services/CampsiteService';

export interface RouteGeometry {
  coordinates: [number, number][]; // [lng, lat] format
}

export interface DistanceResult {
  distance: number; // kilometers
  nearestPoint: [number, number]; // [lat, lng]
  segmentIndex: number;
}

/**
 * Calculate the shortest distance from a point to a route
 */
export function calculateDistanceToRoute(
  campsite: Campsite,
  routeGeometry: RouteGeometry
): DistanceResult | null {
  if (!routeGeometry?.coordinates || routeGeometry.coordinates.length < 2) {
    return null;
  }

  const campsiteLat = campsite.lat;
  const campsiteLng = campsite.lng;

  let minDistance = Infinity;
  let nearestPoint: [number, number] = [campsiteLat, campsiteLng];
  let nearestSegmentIndex = 0;

  // Check distance to each route segment
  for (let i = 0; i < routeGeometry.coordinates.length - 1; i++) {
    const start = routeGeometry.coordinates[i];
    const end = routeGeometry.coordinates[i + 1];

    // Convert to [lat, lng] format
    const startPoint: [number, number] = [start[1], start[0]];
    const endPoint: [number, number] = [end[1], end[0]];

    const result = distanceToLineSegment(
      [campsiteLat, campsiteLng],
      startPoint,
      endPoint
    );

    if (result.distance < minDistance) {
      minDistance = result.distance;
      nearestPoint = result.nearestPoint;
      nearestSegmentIndex = i;
    }
  }

  return {
    distance: minDistance,
    nearestPoint,
    segmentIndex: nearestSegmentIndex
  };
}

/**
 * Calculate distance from a point to a line segment
 */
function distanceToLineSegment(
  point: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number]
): { distance: number; nearestPoint: [number, number] } {
  const [pointLat, pointLng] = point;
  const [startLat, startLng] = lineStart;
  const [endLat, endLng] = lineEnd;

  // Vector from start to end of line segment
  const dx = endLng - startLng;
  const dy = endLat - startLat;

  // If start and end are the same point
  if (dx === 0 && dy === 0) {
    return {
      distance: haversineDistance(pointLat, pointLng, startLat, startLng),
      nearestPoint: [startLat, startLng]
    };
  }

  // Parameter t that represents position along the line segment
  const t = Math.max(0, Math.min(1,
    ((pointLng - startLng) * dx + (pointLat - startLat) * dy) / (dx * dx + dy * dy)
  ));

  // Nearest point on the line segment
  const nearestLat = startLat + t * dy;
  const nearestLng = startLng + t * dx;

  return {
    distance: haversineDistance(pointLat, pointLng, nearestLat, nearestLng),
    nearestPoint: [nearestLat, nearestLng]
  };
}

/**
 * Calculate haversine distance between two points in kilometers
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Filter campsites by distance from route
 */
export function filterCampsitesByRoute(
  campsites: Campsite[],
  routeGeometry: RouteGeometry,
  maxDistance: number // kilometers
): Array<Campsite & { routeDistance?: number }> {
  return campsites
    .map(campsite => {
      const distanceResult = calculateDistanceToRoute(campsite, routeGeometry);
      return {
        ...campsite,
        routeDistance: distanceResult?.distance || Infinity
      };
    })
    .filter(campsite => (campsite.routeDistance || Infinity) <= maxDistance)
    .sort((a, b) => (a.routeDistance || 0) - (b.routeDistance || 0));
}

/**
 * Get route bounds with buffer for campsite loading
 */
export function getRouteBounds(
  routeGeometry: RouteGeometry,
  bufferKm: number = 10
): {
  north: number;
  south: number;
  east: number;
  west: number;
} | null {
  if (!routeGeometry?.coordinates || routeGeometry.coordinates.length === 0) {
    return null;
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  routeGeometry.coordinates.forEach(([lng, lat]) => {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  });

  // Convert buffer from km to approximate degrees
  const bufferDegrees = bufferKm / 111.32; // Rough conversion

  return {
    north: maxLat + bufferDegrees,
    south: minLat - bufferDegrees,
    east: maxLng + bufferDegrees,
    west: minLng - bufferDegrees
  };
}

/**
 * Check if a point is within a certain distance of a route
 */
export function isPointNearRoute(
  point: [number, number],
  routeGeometry: RouteGeometry,
  maxDistance: number // kilometers
): boolean {
  if (!routeGeometry?.coordinates || routeGeometry.coordinates.length < 2) {
    return false;
  }

  for (let i = 0; i < routeGeometry.coordinates.length - 1; i++) {
    const start = routeGeometry.coordinates[i];
    const end = routeGeometry.coordinates[i + 1];

    const startPoint: [number, number] = [start[1], start[0]];
    const endPoint: [number, number] = [end[1], end[0]];

    const result = distanceToLineSegment(point, startPoint, endPoint);

    if (result.distance <= maxDistance) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate route relevance score for campsite sorting
 */
export function calculateRouteRelevance(
  campsite: Campsite,
  routeGeometry: RouteGeometry,
  hasRoute: boolean = true
): number {
  if (!hasRoute) {
    return 0; // No bonus for route proximity
  }

  const distanceResult = calculateDistanceToRoute(campsite, routeGeometry);
  if (!distanceResult) {
    return 0;
  }

  // Score decreases with distance (max 100 points for 0km, 0 points for 50km+)
  const distance = distanceResult.distance;
  if (distance >= 50) return 0;

  return Math.max(0, 100 - (distance * 2));
}