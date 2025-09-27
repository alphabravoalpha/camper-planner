// API Response Types
// TypeScript definitions for external API responses

// OpenRouteService response types
export interface RouteResponse {
  type: 'FeatureCollection';
  features: RouteFeature[];
  metadata: RouteMetadata;
}

export interface RouteFeature {
  type: 'Feature';
  properties: {
    segments: RouteSegment[];
    summary: RouteSummary;
    way_points: number[];
  };
  geometry: {
    coordinates: [number, number][];
    type: 'LineString';
  };
}

export interface RouteSummary {
  distance: number; // meters
  duration: number; // seconds
}

export interface RouteSegment {
  distance: number;
  duration: number;
  steps: RouteStep[];
}

export interface RouteStep {
  distance: number;
  duration: number;
  instruction: string;
  way_points: [number, number];
}

export interface RouteMetadata {
  attribution: string;
  service: string;
  timestamp: number;
}

// Overpass API (OSM) response types
export interface OverpassResponse {
  version: number;
  generator: string;
  elements: OSMElement[];
}

export interface OSMElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  tags: Record<string, string>;
}