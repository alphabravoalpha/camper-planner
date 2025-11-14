// Trip Data Types
// V1 ready, V2 extensible data structures

export interface TripData {
  id: string;
  version: string; // Schema version for migration

  // V1 Core Data
  metadata: TripMetadata;
  vehicle: VehicleProfile;
  route: RouteData;

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
  type: 'motorhome' | 'caravan' | 'campervan'; // Vehicle type
  height: number; // meters
  width: number;  // meters
  weight: number; // tonnes
  length: number; // meters
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
  type: 'start' | 'waypoint' | 'end';
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