// Trip Data Types
// V1 ready, V2 extensible data structures

export interface TripData {
  id: string;
  version: string; // Schema version for migration

  // V1 Core Data
  metadata: TripMetadata;
  vehicle: VehicleProfile;
  route: RouteData;

  // Optional top-level properties for compatibility
  name?: string;
  description?: string;

  // V2 Data Structures (optional, added later)
  preferences?: UserPreferences;
  community?: CommunityData;
}

export interface TripMetadata {
  name: string;
  created: number; // timestamp
  modified: number; // timestamp
  description?: string;
  author?: string;
}

export interface VehicleProfile {
  type: 'motorhome' | 'caravan' | 'campervan'; // Vehicle type
  height: number; // meters
  width: number;  // meters
  weight: number; // tonnes
  length: number; // meters
  fuelType?: 'petrol' | 'diesel' | 'lpg' | 'electric';
  fuelCapacity?: number; // liters
}

export interface RouteData {
  waypoints: Waypoint[];
  optimized: boolean;
  totalDistance?: number; // meters
  estimatedTime?: number; // seconds
  distance?: number;    // meters (alias for compatibility)
  duration?: number;    // seconds (alias for compatibility)
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
  address?: string;     // formatted address

  // Campsite data (Phase 5: for cost calculation)
  campsiteData?: {
    id: number;
    type: 'campsite' | 'aire' | 'parking' | 'caravan_site';
    fee?: string;       // e.g., "€15", "free", "donation"
    nights?: number;    // planned nights at this campsite
  };
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