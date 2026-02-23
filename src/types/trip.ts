// Trip Data Types
// V1 ready, V2 extensible data structures

import { type TripSettings } from './tripSettings';

export interface TripData {
  id: string;
  version: string; // Schema version for migration

  // V1 Core Data
  metadata: TripMetadata;
  vehicle: VehicleProfile;
  route: RouteData;
  settings?: TripSettings; // Trip settings (dates, driving style, budget, fuel)

  // V2 Data Structures (optional, added later)
  preferences?: UserPreferences;
  community?: CommunityData;
}

export interface TripMetadata {
  name: string;
  created: number; // timestamp
  modified: number; // timestamp
}

export interface VehicleProfile {
  id?: string;
  name?: string;
  createdAt?: string;
  type?: string;
  height: number; // meters
  width: number;  // meters
  weight: number; // tonnes
  length: number; // meters
  fuelType?: string;
}

export interface RouteData {
  waypoints: Waypoint[];
  optimized: boolean;
  totalDistance?: number; // meters
  estimatedTime?: number; // seconds
}

export interface Waypoint {
  id: string;
  lat: number;
  lng: number;
  type: 'start' | 'waypoint' | 'end' | 'campsite' | 'accommodation';
  name: string;

  // V2 fields (optional, added later)
  visitDate?: string;   // ISO date string
  duration?: number;    // planned stay duration in hours
  notes?: string;       // user notes
}

// V2 Data Structures (future)
export interface UserPreferences {
  campsiteTypes: string[];
  budgetLimits: Record<string, number>;
  travelStyle: string;
}

export interface CommunityData {
  shared: boolean;
  reviews: string[];
  bookmarks: string[];
}