// Data Validation Utilities
// Validation functions for user input and API responses

export const validators = {
  coordinates: (lat: number, lng: number): boolean => {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  },

  vehicleDimensions: (dimensions: {
    height?: number;
    width?: number;
    weight?: number;
    length?: number;
  }): boolean => {
    const { height, width, weight, length } = dimensions;

    if (height !== undefined && (height <= 0 || height > 4.5)) return false;
    if (width !== undefined && (width <= 0 || width > 3.0)) return false;
    if (weight !== undefined && (weight <= 0 || weight > 40)) return false;
    if (length !== undefined && (length <= 0 || length > 20)) return false;

    return true;
  },

  routeWaypoints: (waypoints: unknown[]): boolean => {
    return waypoints.length >= 2 && waypoints.length <= 50;
  },
};
