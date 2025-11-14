// Map Utilities
// Helper functions for map operations and calculations

import L from 'leaflet';
import type { Waypoint } from '../types';

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface FitBoundsOptions {
  padding?: [number, number]; // [horizontal, vertical] padding in pixels
  maxZoom?: number;
  minZoom?: number;
  animate?: boolean;
  duration?: number;
}

/**
 * Calculate bounding box for a set of waypoints
 */
export const calculateWaypointBounds = (waypoints: Waypoint[]): BoundingBox | null => {
  if (waypoints.length === 0) return null;

  let north = waypoints[0].lat;
  let south = waypoints[0].lat;
  let east = waypoints[0].lng;
  let west = waypoints[0].lng;

  waypoints.forEach(waypoint => {
    north = Math.max(north, waypoint.lat);
    south = Math.min(south, waypoint.lat);
    east = Math.max(east, waypoint.lng);
    west = Math.min(west, waypoint.lng);
  });

  return { north, south, east, west };
};

/**
 * Zoom map to fit all waypoints with appropriate padding
 */
export const zoomToFitWaypoints = (
  map: any,
  waypoints: Waypoint[],
  options: FitBoundsOptions = {}
): boolean => {
  if (waypoints.length === 0) return false;

  const bounds = calculateWaypointBounds(waypoints);
  if (!bounds) return false;

  const {
    padding = [50, 50],
    maxZoom = 15,
    minZoom: _minZoom = 3,
    animate = true,
    duration = 1000
  } = options;

  try {
    if (waypoints.length === 1) {
      // Single waypoint - center and zoom to reasonable level
      const waypoint = waypoints[0];
      map.setView([waypoint.lat, waypoint.lng], 10, {
        animate,
        duration: duration / 1000
      });
    } else {
      // Multiple waypoints - fit bounds
      const leafletBounds = (L as any).latLngBounds(
        [bounds.south, bounds.west],
        [bounds.north, bounds.east]
      );

      // Add padding to bounds
      const paddedBounds = leafletBounds.pad(0.1); // 10% padding

      map.fitBounds(paddedBounds, {
        padding: padding,
        maxZoom: maxZoom,
        animate: animate,
        duration: duration / 1000
      });
    }

    return true;
  } catch (error) {
    console.error('Error fitting bounds:', error);
    return false;
  }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

/**
 * Convert degrees to radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Calculate total route distance through all waypoints
 */
export const calculateRouteDistance = (waypoints: Waypoint[]): number => {
  if (waypoints.length < 2) return 0;

  let totalDistance = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const current = waypoints[i];
    const next = waypoints[i + 1];
    totalDistance += calculateDistance(current.lat, current.lng, next.lat, next.lng);
  }

  return totalDistance;
};

/**
 * Format distance for display
 */
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  } else if (distanceKm < 100) {
    return `${distanceKm.toFixed(1)}km`;
  } else {
    return `${Math.round(distanceKm)}km`;
  }
};

/**
 * Check if coordinates are valid
 */
export const isValidCoordinates = (lat: number, lng: number): boolean => {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !isNaN(lat) &&
    !isNaN(lng)
  );
};

/**
 * Normalize coordinates to specified precision
 */
export const normalizeCoordinates = (
  lat: number,
  lng: number,
  precision: number = 6
): { lat: number; lng: number } => {
  return {
    lat: Number(lat.toFixed(precision)),
    lng: Number(lng.toFixed(precision))
  };
};

/**
 * Calculate map center from waypoints
 */
export const calculateCenterPoint = (waypoints: Waypoint[]): { lat: number; lng: number } | null => {
  if (waypoints.length === 0) return null;

  const bounds = calculateWaypointBounds(waypoints);
  if (!bounds) return null;

  return {
    lat: (bounds.north + bounds.south) / 2,
    lng: (bounds.east + bounds.west) / 2
  };
};

/**
 * Check if point is within European bounds
 */
export const isWithinEuropeanBounds = (lat: number, lng: number): boolean => {
  return lat >= 34.0 && lat <= 72.0 && lng >= -25.0 && lng <= 45.0;
};

/**
 * Generate tile URL for a specific layer
 */
export const generateTileUrl = (
  template: string,
  z: number,
  x: number,
  y: number,
  subdomains?: string[]
): string => {
  let url = template
    .replace('{z}', z.toString())
    .replace('{x}', x.toString())
    .replace('{y}', y.toString());

  if (subdomains && subdomains.length > 0) {
    const subdomain = subdomains[Math.floor(Math.random() * subdomains.length)];
    url = url.replace('{s}', subdomain);
  }

  return url;
};

/**
 * Estimate zoom level for distance
 */
export const estimateZoomLevel = (distanceKm: number): number => {
  if (distanceKm < 1) return 15;
  if (distanceKm < 5) return 13;
  if (distanceKm < 25) return 11;
  if (distanceKm < 100) return 9;
  if (distanceKm < 500) return 7;
  return 5;
};