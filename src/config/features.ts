// Feature Flags Configuration
// Controls V1/V2 feature availability

export const FeatureFlags = {
  // V1 Features (Phase-based enablement)
  BASIC_MAP_DISPLAY: true,        // Phase 1: Basic map foundation
  WAYPOINT_SYSTEM: true,          // Phase 2: Waypoint management
  BASIC_ROUTING: true,            // Phase 3: Vehicle-safe routing
  VEHICLE_PROFILES: true,         // Phase 3: Vehicle dimension input
  CAMPSITE_DISPLAY: true,         // Phase 4: Campsite integration
  ROUTE_OPTIMIZATION: true,       // Phase 5: Multi-stop optimization
  DATA_EXPORT: false,             // Phase 6: GPX/JSON export

  // Language Support
  MULTI_LANGUAGE_FRAMEWORK: true,    // Phase 1: i18n framework ready
  MULTI_LANGUAGE_COMPLETE: false,    // V2: Complete translations

  // V2 Features (Explicitly disabled in V1)
  COMMUNITY_FEATURES: false,      // User reviews, route sharing
  WEATHER_INTEGRATION: false,     // Weather along route
  ADVANCED_BOOKING: false,        // Campsite booking integration
  ROUTE_SHARING: false,           // Share routes between users
  USER_PROFILES: false,           // User accounts and profiles

  // Explicitly excluded features
  REAL_TIME_TRAFFIC: false,       // Real-time traffic data
  TURN_BY_TURN_GPS: false,        // GPS navigation
  OFFLINE_MAP_DOWNLOADS: false,   // Offline map capability
  VOICE_DIRECTIONS: false,        // Voice navigation
  LIVE_LOCATION_TRACKING: false,  // Live location tracking
} as const;

export type FeatureFlag = keyof typeof FeatureFlags;