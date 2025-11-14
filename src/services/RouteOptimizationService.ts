// Route Optimization Service
// Phase 5.1: Multi-stop optimization with TSP solver and intelligent waypoint management

import { RoutingService } from './RoutingService';
import type { RouteRequest } from './RoutingService';
import type { VehicleProfile, Waypoint } from '../types';

export interface OptimizationCriteria {
  objective: 'shortest' | 'fastest' | 'balanced';
  vehicleProfile?: VehicleProfile;
  timeConstraints?: {
    maxDrivingTime: number; // hours per day
    preferredStartTime: number; // hour of day (0-23)
    avoidNightDriving: boolean;
  };
  campsitePreferences?: {
    maxDistanceBetweenStops: number; // km
    preferredStopDuration: number; // hours
    requireCampsiteOvernight: boolean;
  };
  lockedWaypoints?: string[]; // waypoint IDs that cannot be reordered
}

export interface OptimizationResult {
  originalRoute: {
    waypoints: Waypoint[];
    totalDistance: number;
    totalTime: number;
    estimatedCost?: number;
  };
  optimizedRoute: {
    waypoints: Waypoint[];
    totalDistance: number;
    totalTime: number;
    estimatedCost?: number;
    reorderingApplied: boolean;
  };
  improvements: {
    distanceSaved: number; // km
    timeSaved: number; // minutes
    costSaved?: number;
    percentageImprovement: number;
  };
  optimizationMetadata: {
    algorithm: string;
    iterations: number;
    executionTime: number; // ms
    convergenceReached: boolean;
  };
}

export interface WaypointInsertionResult {
  suggestedPosition: number;
  routeImpact: {
    distanceAdded: number;
    timeAdded: number;
    efficiency: number; // 0-1 score
  };
  alternatives: Array<{
    position: number;
    distanceAdded: number;
    timeAdded: number;
    efficiency: number;
  }>;
}

// Distance matrix for TSP calculations
interface DistanceMatrix {
  distances: number[][]; // km
  durations: number[][]; // minutes
  costs?: number[][];
}

export class RouteOptimizationService {
  private routingService: RoutingService;
  private distanceCache: Map<string, DistanceMatrix> = new Map();

  constructor() {
    this.routingService = new RoutingService();
  }

  /**
   * Optimize route with multiple waypoints using TSP solver
   */
  async optimizeRoute(
    waypoints: Waypoint[],
    criteria: OptimizationCriteria
  ): Promise<OptimizationResult> {
    if (waypoints.length < 3) {
      throw new Error('Route optimization requires at least 3 waypoints');
    }

    const startTime = Date.now();

    // Calculate original route metrics
    const originalMetrics = await this.calculateRouteMetrics(waypoints, criteria.vehicleProfile);

    // Build distance matrix
    const distanceMatrix = await this.buildDistanceMatrix(waypoints, criteria.vehicleProfile);

    // Apply TSP solver based on criteria
    const optimizationResult = await this.solveTSP(distanceMatrix, criteria, waypoints);

    // Reorder waypoints based on optimization
    const optimizedWaypoints = this.reorderWaypoints(waypoints, optimizationResult.order, criteria.lockedWaypoints);

    // Calculate optimized route metrics
    const optimizedMetrics = await this.calculateRouteMetrics(optimizedWaypoints, criteria.vehicleProfile);

    // Calculate improvements
    const improvements = this.calculateImprovements(originalMetrics, optimizedMetrics);

    return {
      originalRoute: {
        waypoints,
        totalDistance: originalMetrics.distance,
        totalTime: originalMetrics.duration,
        estimatedCost: originalMetrics.cost
      },
      optimizedRoute: {
        waypoints: optimizedWaypoints,
        totalDistance: optimizedMetrics.distance,
        totalTime: optimizedMetrics.duration,
        estimatedCost: optimizedMetrics.cost,
        reorderingApplied: JSON.stringify(waypoints.map(w => w.id)) !== JSON.stringify(optimizedWaypoints.map(w => w.id))
      },
      improvements,
      optimizationMetadata: {
        algorithm: criteria.objective === 'shortest' ? 'Distance-TSP' : criteria.objective === 'fastest' ? 'Time-TSP' : 'Balanced-TSP',
        iterations: optimizationResult.iterations,
        executionTime: Date.now() - startTime,
        convergenceReached: optimizationResult.converged
      }
    };
  }

  /**
   * Find optimal position to insert a new waypoint
   */
  async findOptimalInsertion(
    existingWaypoints: Waypoint[],
    newWaypoint: Waypoint,
    criteria: OptimizationCriteria
  ): Promise<WaypointInsertionResult> {
    if (existingWaypoints.length === 0) {
      return {
        suggestedPosition: 0,
        routeImpact: { distanceAdded: 0, timeAdded: 0, efficiency: 1 },
        alternatives: []
      };
    }

    const alternatives: Array<{
      position: number;
      distanceAdded: number;
      timeAdded: number;
      efficiency: number;
    }> = [];

    // Calculate current route metrics
    const baseMetrics = await this.calculateRouteMetrics(existingWaypoints, criteria.vehicleProfile);

    // Try inserting at each possible position
    for (let position = 0; position <= existingWaypoints.length; position++) {
      const testWaypoints = [...existingWaypoints];
      testWaypoints.splice(position, 0, newWaypoint);

      const testMetrics = await this.calculateRouteMetrics(testWaypoints, criteria.vehicleProfile);

      const distanceAdded = testMetrics.distance - baseMetrics.distance;
      const timeAdded = testMetrics.duration - baseMetrics.duration;

      // Calculate efficiency score (lower impact = higher efficiency)
      const efficiency = this.calculateInsertionEfficiency(distanceAdded, timeAdded, criteria);

      alternatives.push({
        position,
        distanceAdded,
        timeAdded,
        efficiency
      });
    }

    // Sort by efficiency and find best option
    alternatives.sort((a, b) => b.efficiency - a.efficiency);
    const best = alternatives[0];

    return {
      suggestedPosition: best.position,
      routeImpact: {
        distanceAdded: best.distanceAdded,
        timeAdded: best.timeAdded,
        efficiency: best.efficiency
      },
      alternatives: alternatives.slice(1, 4) // Return top 3 alternatives
    };
  }

  /**
   * Build distance matrix between all waypoints
   */
  private async buildDistanceMatrix(
    waypoints: Waypoint[],
    vehicleProfile?: VehicleProfile
  ): Promise<DistanceMatrix> {
    const n = waypoints.length;
    const distances: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
    const durations: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
    const costs: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

    // Generate cache key
    const cacheKey = this.generateMatrixCacheKey(waypoints, vehicleProfile);
    const cached = this.distanceCache.get(cacheKey);
    if (cached) return cached;

    // Calculate all pairwise distances and times
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          distances[i][j] = 0;
          durations[i][j] = 0;
          costs[i][j] = 0;
          continue;
        }

        try {
          const routeRequest: RouteRequest = {
            waypoints: [waypoints[i], waypoints[j]],
            vehicleProfile,
            options: {
              alternatives: false,
              steps: false,
              geometries: 'geojson'
            }
          };

          const routeResponse = await this.routingService.calculateRoute(routeRequest);

          if (routeResponse.routes && routeResponse.routes.length > 0) {
            const route = routeResponse.routes[0];
            distances[i][j] = route.summary.distance / 1000; // Convert to km
            durations[i][j] = route.summary.duration / 60; // Convert to minutes
            costs[i][j] = this.estimateRouteCost(route.summary.distance, route.summary.duration, vehicleProfile);
          } else {
            // Fallback to straight-line distance
            distances[i][j] = this.calculateHaversineDistance(waypoints[i], waypoints[j]);
            durations[i][j] = distances[i][j] * 1.2; // Estimate: ~50km/h average
            costs[i][j] = distances[i][j] * 0.5; // Rough fuel cost estimate
          }
        } catch (error) {
          console.warn(`Failed to calculate route from ${i} to ${j}:`, error);
          // Fallback to straight-line distance
          distances[i][j] = this.calculateHaversineDistance(waypoints[i], waypoints[j]);
          durations[i][j] = distances[i][j] * 1.2;
          costs[i][j] = distances[i][j] * 0.5;
        }
      }
    }

    const matrix = { distances, durations, costs };
    this.distanceCache.set(cacheKey, matrix);
    return matrix;
  }

  /**
   * Solve TSP using genetic algorithm with local optimization
   */
  private async solveTSP(
    matrix: DistanceMatrix,
    criteria: OptimizationCriteria,
    waypoints: Waypoint[]
  ): Promise<{ order: number[]; iterations: number; converged: boolean }> {
    const n = matrix.distances.length;
    if (n <= 3) {
      return { order: Array.from({ length: n }, (_, i) => i), iterations: 0, converged: true };
    }

    // Handle locked waypoints
    const lockedPositions = this.getLockedPositions(waypoints, criteria.lockedWaypoints);

    // Choose optimization metric based on criteria
    const getDistance = (i: number, j: number): number => {
      switch (criteria.objective) {
        case 'shortest':
          return matrix.distances[i][j];
        case 'fastest':
          return matrix.durations[i][j];
        case 'balanced':
          // Balanced: 60% time + 40% distance (normalized)
          const normalizedTime = matrix.durations[i][j] / Math.max(...matrix.durations.flat());
          const normalizedDist = matrix.distances[i][j] / Math.max(...matrix.distances.flat());
          return 0.6 * normalizedTime + 0.4 * normalizedDist;
        default:
          return matrix.distances[i][j];
      }
    };

    // Initialize with nearest neighbor heuristic
    let bestOrder = this.nearestNeighborTSP(matrix, getDistance, lockedPositions);
    let bestCost = this.calculateTourCost(bestOrder, getDistance);

    // Apply 2-opt improvement
    const maxIterations = Math.min(1000, n * n);
    let iterations = 0;
    let improved = true;

    while (improved && iterations < maxIterations) {
      improved = false;

      for (let i = 1; i < n - 1; i++) {
        if (lockedPositions.has(i)) continue;

        for (let j = i + 1; j < n; j++) {
          if (lockedPositions.has(j)) continue;

          const newOrder = this.twoOptSwap(bestOrder, i, j);
          const newCost = this.calculateTourCost(newOrder, getDistance);

          if (newCost < bestCost) {
            bestOrder = newOrder;
            bestCost = newCost;
            improved = true;
          }
        }
      }
      iterations++;
    }

    return {
      order: bestOrder,
      iterations,
      converged: !improved
    };
  }

  /**
   * Nearest neighbor TSP heuristic
   */
  private nearestNeighborTSP(
    matrix: DistanceMatrix,
    getDistance: (i: number, j: number) => number,
    _lockedPositions: Set<number>
  ): number[] {
    const n = matrix.distances.length;
    const visited = new Set<number>();
    const tour: number[] = [];

    // Start from first waypoint (usually origin)
    let current = 0;
    tour.push(current);
    visited.add(current);

    while (visited.size < n) {
      let nearest = -1;
      let minDistance = Infinity;

      for (let i = 0; i < n; i++) {
        if (!visited.has(i)) {
          const distance = getDistance(current, i);
          if (distance < minDistance) {
            minDistance = distance;
            nearest = i;
          }
        }
      }

      if (nearest !== -1) {
        tour.push(nearest);
        visited.add(nearest);
        current = nearest;
      }
    }

    return tour;
  }

  /**
   * 2-opt swap for TSP improvement
   */
  private twoOptSwap(tour: number[], i: number, j: number): number[] {
    const newTour = [...tour];

    // Reverse the segment between i and j
    while (i < j) {
      [newTour[i], newTour[j]] = [newTour[j], newTour[i]];
      i++;
      j--;
    }

    return newTour;
  }

  /**
   * Calculate total cost of a tour
   */
  private calculateTourCost(
    tour: number[],
    getDistance: (i: number, j: number) => number
  ): number {
    let totalCost = 0;

    for (let i = 0; i < tour.length - 1; i++) {
      totalCost += getDistance(tour[i], tour[i + 1]);
    }

    return totalCost;
  }

  /**
   * Reorder waypoints based on optimization result
   */
  private reorderWaypoints(
    waypoints: Waypoint[],
    order: number[],
    lockedWaypoints?: string[]
  ): Waypoint[] {
    if (lockedWaypoints && lockedWaypoints.length > 0) {
      // Complex reordering with locked waypoints
      const reordered = [...waypoints];
      const locked = new Set(lockedWaypoints);

      let orderIndex = 0;
      for (let i = 0; i < reordered.length; i++) {
        if (!locked.has(reordered[i].id)) {
          // Find next non-locked waypoint in optimized order
          while (orderIndex < order.length && locked.has(waypoints[order[orderIndex]].id)) {
            orderIndex++;
          }
          if (orderIndex < order.length) {
            reordered[i] = waypoints[order[orderIndex]];
            orderIndex++;
          }
        }
      }

      return reordered;
    }

    return order.map(index => waypoints[index]);
  }

  /**
   * Calculate route metrics for a sequence of waypoints
   */
  private async calculateRouteMetrics(
    waypoints: Waypoint[],
    vehicleProfile?: VehicleProfile
  ): Promise<{ distance: number; duration: number; cost?: number }> {
    if (waypoints.length < 2) {
      return { distance: 0, duration: 0, cost: 0 };
    }

    try {
      const routeRequest: RouteRequest = {
        waypoints,
        vehicleProfile,
        options: {
          alternatives: false,
          steps: false,
          geometries: 'geojson'
        }
      };

      const routeResponse = await this.routingService.calculateRoute(routeRequest);

      if (routeResponse.routes && routeResponse.routes.length > 0) {
        const route = routeResponse.routes[0];
        return {
          distance: route.summary.distance / 1000, // Convert to km
          duration: route.summary.duration / 60, // Convert to minutes
          cost: this.estimateRouteCost(route.summary.distance, route.summary.duration, vehicleProfile)
        };
      }
    } catch (error) {
      console.warn('Failed to calculate route metrics:', error);
    }

    // Fallback calculation
    let totalDistance = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      totalDistance += this.calculateHaversineDistance(waypoints[i], waypoints[i + 1]);
    }

    return {
      distance: totalDistance,
      duration: totalDistance * 1.2, // Estimate ~50km/h average
      cost: totalDistance * 0.5 // Rough fuel cost estimate
    };
  }

  /**
   * Calculate improvements between original and optimized routes
   */
  private calculateImprovements(
    original: { distance: number; duration: number; cost?: number },
    optimized: { distance: number; duration: number; cost?: number }
  ) {
    const distanceSaved = Math.max(0, original.distance - optimized.distance);
    const timeSaved = Math.max(0, original.duration - optimized.duration);
    const costSaved = original.cost && optimized.cost ? Math.max(0, original.cost - optimized.cost) : undefined;

    const percentageImprovement = original.distance > 0
      ? (distanceSaved / original.distance) * 100
      : 0;

    return {
      distanceSaved,
      timeSaved,
      costSaved,
      percentageImprovement
    };
  }

  /**
   * Calculate insertion efficiency score
   */
  private calculateInsertionEfficiency(
    distanceAdded: number,
    timeAdded: number,
    criteria: OptimizationCriteria
  ): number {
    // Lower impact = higher efficiency
    const maxReasonableDetour = 50; // km
    const maxReasonableTime = 60; // minutes

    const distanceScore = Math.max(0, 1 - (distanceAdded / maxReasonableDetour));
    const timeScore = Math.max(0, 1 - (timeAdded / maxReasonableTime));

    // Weight based on optimization criteria
    switch (criteria.objective) {
      case 'shortest':
        return 0.8 * distanceScore + 0.2 * timeScore;
      case 'fastest':
        return 0.2 * distanceScore + 0.8 * timeScore;
      case 'balanced':
        return 0.5 * distanceScore + 0.5 * timeScore;
      default:
        return 0.5 * distanceScore + 0.5 * timeScore;
    }
  }

  /**
   * Get locked waypoint positions
   */
  private getLockedPositions(waypoints: Waypoint[], lockedWaypoints?: string[]): Set<number> {
    const locked = new Set<number>();
    if (lockedWaypoints) {
      waypoints.forEach((waypoint, index) => {
        if (lockedWaypoints.includes(waypoint.id)) {
          locked.add(index);
        }
      });
    }
    return locked;
  }

  /**
   * Generate cache key for distance matrix
   */
  private generateMatrixCacheKey(waypoints: Waypoint[], vehicleProfile?: VehicleProfile): string {
    const waypointKey = waypoints.map(w => `${w.lat.toFixed(4)},${w.lng.toFixed(4)}`).join('|');
    const vehicleKey = vehicleProfile ? `${vehicleProfile.type}-${vehicleProfile.height}-${vehicleProfile.weight}` : 'default';
    return `${waypointKey}::${vehicleKey}`;
  }

  /**
   * Calculate straight-line distance between two waypoints (Haversine formula)
   */
  private calculateHaversineDistance(waypoint1: Waypoint, waypoint2: Waypoint): number {
    const R = 6371; // Earth's radius in km
    const dLat = (waypoint2.lat - waypoint1.lat) * Math.PI / 180;
    const dLng = (waypoint2.lng - waypoint1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(waypoint1.lat * Math.PI / 180) * Math.cos(waypoint2.lat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Estimate route cost based on distance, time, and vehicle profile
   */
  private estimateRouteCost(distance: number, _duration: number, vehicleProfile?: VehicleProfile): number {
    const distanceKm = distance / 1000;

    // Base fuel consumption (L/100km)
    let fuelConsumption = 8; // Default for car

    if (vehicleProfile) {
      switch (vehicleProfile.type) {
        case 'motorhome':
          fuelConsumption = 12 + (vehicleProfile.weight || 0) * 0.5;
          break;
        case 'caravan':
          fuelConsumption = 10 + (vehicleProfile.weight || 0) * 0.3;
          break;
        default:
          fuelConsumption = 7;
          break;
      }
    }

    const fuelPrice = 1.5; // €/L approximate European average
    const tollEstimate = distanceKm * 0.1; // Rough toll estimate

    return (distanceKm * fuelConsumption / 100 * fuelPrice) + tollEstimate;
  }

  /**
   * Clear distance matrix cache
   */
  clearCache(): void {
    this.distanceCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.distanceCache.size,
      keys: Array.from(this.distanceCache.keys())
    };
  }
}

// Export singleton instance
export const routeOptimizationService = new RouteOptimizationService();