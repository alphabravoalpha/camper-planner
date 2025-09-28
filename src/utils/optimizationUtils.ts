// Route Optimization Utility Functions
// Phase 5.1: Helper functions for optimization visualization and analytics

import { Waypoint } from '../store/routeStore';
import { OptimizationResult } from '../services/RouteOptimizationService';

export interface OptimizationVisualization {
  originalPath: [number, number][];
  optimizedPath: [number, number][];
  reorderedWaypoints: Array<{
    original: number;
    optimized: number;
    waypoint: Waypoint;
  }>;
  improvementMetrics: {
    distanceImprovement: number;
    timeImprovement: number;
    costImprovement?: number;
    efficiencyGain: number;
  };
}

/**
 * Generate visualization data for optimization results
 */
export function generateOptimizationVisualization(
  result: OptimizationResult
): OptimizationVisualization {
  const originalPath = result.originalRoute.waypoints.map(wp => [wp.lat, wp.lng] as [number, number]);
  const optimizedPath = result.optimizedRoute.waypoints.map(wp => [wp.lat, wp.lng] as [number, number]);

  // Map waypoint reordering
  const reorderedWaypoints = result.optimizedRoute.waypoints.map((optimizedWp, optimizedIndex) => {
    const originalIndex = result.originalRoute.waypoints.findIndex(wp => wp.id === optimizedWp.id);
    return {
      original: originalIndex,
      optimized: optimizedIndex,
      waypoint: optimizedWp
    };
  });

  return {
    originalPath,
    optimizedPath,
    reorderedWaypoints,
    improvementMetrics: {
      distanceImprovement: result.improvements.distanceSaved,
      timeImprovement: result.improvements.timeSaved,
      costImprovement: result.improvements.costSaved,
      efficiencyGain: result.improvements.percentageImprovement
    }
  };
}

/**
 * Calculate route efficiency score
 */
export function calculateRouteEfficiency(waypoints: Waypoint[]): number {
  if (waypoints.length < 2) return 1;

  // Calculate straight-line distance vs actual route distance
  const straightLineDistance = calculateStraightLineDistance(waypoints);
  const routeDistance = calculateTotalRouteDistance(waypoints);

  return straightLineDistance / routeDistance;
}

/**
 * Calculate straight-line distance for a route
 */
export function calculateStraightLineDistance(waypoints: Waypoint[]): number {
  if (waypoints.length < 2) return 0;

  const start = waypoints[0];
  const end = waypoints[waypoints.length - 1];

  return haversineDistance(start.lat, start.lng, end.lat, end.lng);
}

/**
 * Calculate total route distance through all waypoints
 */
export function calculateTotalRouteDistance(waypoints: Waypoint[]): number {
  if (waypoints.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    totalDistance += haversineDistance(
      waypoints[i].lat,
      waypoints[i].lng,
      waypoints[i + 1].lat,
      waypoints[i + 1].lng
    );
  }

  return totalDistance;
}

/**
 * Haversine distance calculation
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find potential optimization improvements in a route
 */
export function analyzeRouteOptimizationPotential(waypoints: Waypoint[]): {
  hasBacktracking: boolean;
  crossingPaths: boolean;
  inefficientSegments: Array<{
    startIndex: number;
    endIndex: number;
    inefficiencyRatio: number;
  }>;
  overallEfficiency: number;
} {
  if (waypoints.length < 3) {
    return {
      hasBacktracking: false,
      crossingPaths: false,
      inefficientSegments: [],
      overallEfficiency: 1
    };
  }

  // Check for backtracking
  const hasBacktracking = checkForBacktracking(waypoints);

  // Check for crossing paths
  const crossingPaths = checkForCrossingPaths(waypoints);

  // Find inefficient segments
  const inefficientSegments = findInefficientSegments(waypoints);

  // Calculate overall efficiency
  const overallEfficiency = calculateRouteEfficiency(waypoints);

  return {
    hasBacktracking,
    crossingPaths,
    inefficientSegments,
    overallEfficiency
  };
}

/**
 * Check if route has backtracking patterns
 */
function checkForBacktracking(waypoints: Waypoint[]): boolean {
  for (let i = 0; i < waypoints.length - 2; i++) {
    const current = waypoints[i];
    const next = waypoints[i + 1];
    const afterNext = waypoints[i + 2];

    // Calculate angles to detect sharp turns that might indicate backtracking
    const angle1 = calculateBearing(current, next);
    const angle2 = calculateBearing(next, afterNext);
    const angleDiff = Math.abs(angle1 - angle2);

    // If we have a sharp turn (> 120 degrees), it might be backtracking
    if (angleDiff > 120 && angleDiff < 240) {
      // Check if we're actually going back towards a previous point
      for (let j = 0; j < i; j++) {
        const previousPoint = waypoints[j];
        const distanceToNext = haversineDistance(afterNext.lat, afterNext.lng, previousPoint.lat, previousPoint.lng);
        const distanceToCurrent = haversineDistance(current.lat, current.lng, previousPoint.lat, previousPoint.lng);

        if (distanceToNext < distanceToCurrent * 0.8) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Check if route has crossing paths
 */
function checkForCrossingPaths(waypoints: Waypoint[]): boolean {
  // Simplified check - in a real implementation, you'd check for line segment intersections
  for (let i = 0; i < waypoints.length - 3; i++) {
    for (let j = i + 2; j < waypoints.length - 1; j++) {
      // Check if segments (i, i+1) and (j, j+1) cross
      if (doSegmentsIntersect(waypoints[i], waypoints[i + 1], waypoints[j], waypoints[j + 1])) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Find segments that are particularly inefficient
 */
function findInefficientSegments(waypoints: Waypoint[]): Array<{
  startIndex: number;
  endIndex: number;
  inefficiencyRatio: number;
}> {
  const inefficientSegments = [];

  for (let i = 0; i < waypoints.length - 2; i++) {
    for (let j = i + 2; j < waypoints.length; j++) {
      // Calculate efficiency of going through intermediate points vs direct
      const directDistance = haversineDistance(
        waypoints[i].lat, waypoints[i].lng,
        waypoints[j].lat, waypoints[j].lng
      );

      let throughDistance = 0;
      for (let k = i; k < j; k++) {
        throughDistance += haversineDistance(
          waypoints[k].lat, waypoints[k].lng,
          waypoints[k + 1].lat, waypoints[k + 1].lng
        );
      }

      const inefficiencyRatio = throughDistance / directDistance;

      // If the detour is more than 50% longer than direct route, flag it
      if (inefficiencyRatio > 1.5) {
        inefficientSegments.push({
          startIndex: i,
          endIndex: j,
          inefficiencyRatio
        });
      }
    }
  }

  return inefficientSegments.sort((a, b) => b.inefficiencyRatio - a.inefficiencyRatio).slice(0, 3);
}

/**
 * Calculate bearing between two points
 */
function calculateBearing(point1: Waypoint, point2: Waypoint): number {
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const lat1 = point1.lat * Math.PI / 180;
  const lat2 = point2.lat * Math.PI / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

/**
 * Check if two line segments intersect
 */
function doSegmentsIntersect(p1: Waypoint, q1: Waypoint, p2: Waypoint, q2: Waypoint): boolean {
  // Simplified intersection check using orientation
  const o1 = orientation(p1, q1, p2);
  const o2 = orientation(p1, q1, q2);
  const o3 = orientation(p2, q2, p1);
  const o4 = orientation(p2, q2, q1);

  // General case
  if (o1 !== o2 && o3 !== o4) return true;

  return false;
}

/**
 * Calculate orientation of ordered triplet of points
 */
function orientation(p: Waypoint, q: Waypoint, r: Waypoint): number {
  const val = (q.lng - p.lng) * (r.lat - q.lat) - (q.lat - p.lat) * (r.lng - q.lng);
  if (val === 0) return 0; // collinear
  return val > 0 ? 1 : 2; // clockwise or counterclockwise
}

/**
 * Format optimization improvements for display
 */
export function formatOptimizationSummary(result: OptimizationResult): string {
  const { improvements } = result;

  if (improvements.percentageImprovement < 1) {
    return "Route is already well optimized";
  }

  const parts = [];

  if (improvements.distanceSaved > 0.1) {
    parts.push(`${improvements.distanceSaved.toFixed(1)}km shorter`);
  }

  if (improvements.timeSaved > 1) {
    const hours = Math.floor(improvements.timeSaved / 60);
    const minutes = Math.round(improvements.timeSaved % 60);
    if (hours > 0) {
      parts.push(`${hours}h ${minutes}m faster`);
    } else {
      parts.push(`${minutes}m faster`);
    }
  }

  if (improvements.costSaved && improvements.costSaved > 1) {
    parts.push(`€${improvements.costSaved.toFixed(0)} cheaper`);
  }

  return parts.length > 0 ? parts.join(', ') : "Minor improvements";
}