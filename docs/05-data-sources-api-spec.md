# European Camper Trip Planner - Data Sources & API Specification

## API Overview & Integration Strategy

### Primary Services (Free Tiers)
1. **OpenRouteService** - Routing with vehicle restrictions
2. **Overpass API** - OSM campsite and POI data
3. **Nominatim** - Geocoding and address search
4. **OpenStreetMap** - Map tiles and base data

### Backup Services (Fallback)
1. **OSRM** - Backup routing service
2. **OpenCampingMap** - Backup campsite data
3. **Alternative tile servers** - Map tile fallbacks

### Rate Limiting Strategy
- **Client-side throttling** - Prevent API abuse
- **Intelligent caching** - Reduce API calls
- **Progressive data loading** - Load as needed
- **Graceful degradation** - Continue working with limited data

---

## 1. Routing Services

### 1.1 OpenRouteService (Primary)

**Base URL:** `https://api.openrouteservice.org/v2`

**API Key:** Required (Free tier: 2,000 requests/day)
**Registration:** https://openrouteservice.org/dev/#/signup

#### Directions API
```javascript
// Endpoint
GET /directions/{profile}/geojson

// Profiles for campers
- driving-hgv: Heavy goods vehicle (best for large campers)
- driving-car: Standard car routing (smaller campers)

// Example Request
https://api.openrouteservice.org/v2/directions/driving-hgv/geojson?
coordinates=8.681495,49.41461|8.687872,49.420318&
height=3.2&width=2.1&weight=3.5&length=7.5&
hazmat=false&avoid_polygons=[]

// Required Headers
{
  "Authorization": "Bearer YOUR_API_KEY",
  "Content-Type": "application/json"
}
```

#### Vehicle Restrictions Parameters
```javascript
const vehicleParams = {
  height: 3.2,        // meters, max vehicle height
  width: 2.1,         // meters, max vehicle width
  weight: 3.5,        // tonnes, max vehicle weight
  length: 7.5,        // meters, max vehicle length
  axleload: 2.0,      // tonnes, max axle load
  hazmat: false,      // hazardous materials
  surface_type: 'any' // road surface requirements
};
```

#### Response Format
```javascript
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "properties": {
      "segments": [...],
      "summary": {
        "distance": 12345.67,    // meters
        "duration": 1234.56      // seconds
      },
      "way_points": [0, 15, 25]  // waypoint indices
    },
    "geometry": {
      "coordinates": [[lng, lat], ...],
      "type": "LineString"
    }
  }],
  "metadata": {
    "attribution": "openrouteservice.org",
    "service": "routing",
    "timestamp": 1234567890,
    "query": {...}
  }
}
```

#### Error Handling
```javascript
// Common errors and responses
const errorHandling = {
  400: "Bad Request - Invalid parameters",
  401: "Unauthorized - Invalid API key",
  403: "Forbidden - Rate limit exceeded",
  404: "Not Found - No route possible",
  413: "Request too large - Too many waypoints",
  500: "Server Error - Try backup service",
  503: "Service Unavailable - Temporary outage"
};
```

### 1.2 OSRM (Backup Routing)

**Base URL:** `https://router.project-osrm.org`
**API Key:** Not required
**Rate Limit:** Fair use policy

#### Route API
```javascript
// Endpoint
GET /route/v1/{profile}/{coordinates}

// Profiles
- driving: Car routing (no vehicle restrictions)

// Example Request
https://router.project-osrm.org/route/v1/driving/
8.681495,49.41461;8.687872,49.420318?
overview=full&geometries=geojson&steps=true

// Response includes waypoints, distance, duration
// Note: No vehicle restriction support
```

---

## 2. Campsite Data Services

### 2.1 Overpass API (Primary)

**Base URL:** `https://overpass-api.de/api/interpreter`
**API Key:** Not required
**Rate Limit:** Fair use (typical: 2 queries/second)

#### Campsite Query (Overpass QL)
```javascript
// Query for campsites in bounding box
const campsiteQuery = `
[out:json][timeout:25];
(
  node["tourism"="camp_site"](${south},${west},${north},${east});
  way["tourism"="camp_site"](${south},${west},${north},${east});
  node["tourism"="caravan_site"](${south},${west},${north},${east});
  way["tourism"="caravan_site"](${south},${west},${north},${east});
);
out center meta;
`;

// POST request with query in body
fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  body: campsiteQuery,
  headers: { 'Content-Type': 'text/plain' }
});
```

#### Aires Query (Motorhome Service Areas)
```javascript
const airesQuery = `
[out:json][timeout:25];
(
  node["amenity"="parking"]["motorhome"="yes"](${bbox});
  node["amenity"="parking"]["caravan"="yes"](${bbox});
  node["tourism"="wilderness_hut"](${bbox});
  node["highway"="services"]["motorhome"="yes"](${bbox});
);
out center meta;
`;
```

#### Response Format
```javascript
{
  "version": 0.6,
  "generator": "Overpass API",
  "elements": [
    {
      "type": "node",
      "id": 123456789,
      "lat": 49.4146100,
      "lon": 8.6814950,
      "tags": {
        "tourism": "camp_site",
        "name": "Camping Am Rhein",
        "amenity": "toilets",
        "drinking_water": "yes",
        "electricity": "yes",
        "internet_access": "wifi",
        "motorhome": "yes",
        "opening_hours": "Mar-Oct",
        "phone": "+49 123 456789",
        "website": "https://example.com"
      }
    }
  ]
}
```

#### Campsite Data Schema
```javascript
const campsiteSchema = {
  id: 'number',           // OSM element ID
  type: 'string',         // 'campsite', 'aire', 'parking'
  name: 'string',         // Display name
  lat: 'number',          // Latitude
  lng: 'number',          // Longitude

  // Amenities
  amenities: {
    toilets: 'boolean',
    showers: 'boolean',
    drinking_water: 'boolean',
    electricity: 'boolean',
    wifi: 'boolean',
    restaurant: 'boolean',
    shop: 'boolean',
    playground: 'boolean'
  },

  // Vehicle access
  access: {
    motorhome: 'boolean',
    caravan: 'boolean',
    tent: 'boolean',
    max_height: 'number',   // meters
    max_length: 'number',   // meters
    max_weight: 'number'    // tonnes
  },

  // Contact & info
  contact: {
    phone: 'string',
    website: 'string',
    email: 'string'
  },

  // Operational
  opening_hours: 'string',
  fee: 'string',
  reservation: 'string',

  // Metadata
  source: 'openstreetmap',
  last_updated: 'timestamp'
};
```

### 2.2 OpenCampingMap (Backup)

**Base URL:** `https://opencampingmap.org/api`
**API Key:** Not required
**Rate Limit:** Fair use

```javascript
// Campsite data endpoint
GET /campsites?bbox={west},{south},{east},{north}

// Response format similar to Overpass but pre-processed
// Use as fallback when Overpass fails or is slow
```

---

## 3. Geocoding Services

### 3.1 Nominatim (OpenStreetMap)

**Base URL:** `https://nominatim.openstreetmap.org`
**API Key:** Not required
**Rate Limit:** 1 request/second, User-Agent required

#### Search API
```javascript
// Forward geocoding (address to coordinates)
GET /search?q={query}&format=json&limit=5&countrycodes=eu

// Example
https://nominatim.openstreetmap.org/search?
q=Berlin,Germany&format=json&limit=5&
addressdetails=1&countrycodes=de

// Required Headers
{
  "User-Agent": "EuropeanCamperPlanner/1.0"
}
```

#### Reverse Geocoding
```javascript
// Coordinates to address
GET /reverse?lat={lat}&lon={lon}&format=json

// Example
https://nominatim.openstreetmap.org/reverse?
lat=52.5170365&lon=13.3888599&format=json&
addressdetails=1
```

#### Response Format
```javascript
{
  "place_id": 123456,
  "licence": "Data © OpenStreetMap contributors",
  "osm_type": "way",
  "osm_id": 123456789,
  "lat": "52.5170365",
  "lon": "13.3888599",
  "display_name": "Berlin, Deutschland",
  "address": {
    "city": "Berlin",
    "country": "Deutschland",
    "country_code": "de"
  },
  "boundingbox": ["52.33", "52.68", "13.09", "13.76"]
}
```

---

## 4. Map Tile Services

### 4.1 OpenStreetMap (Primary)

**Base URL:** `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
**Subdomains:** a, b, c
**Rate Limit:** Fair use, not for production at scale

```javascript
// Leaflet configuration
const osmTiles = L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c']
  }
);
```

### 4.2 Alternative Tile Servers

#### OpenTopoMap (Topographic)
```javascript
const topoTiles = L.tileLayer(
  'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  {
    attribution: 'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)',
    maxZoom: 15
  }
);
```

#### CyclOSM (Cycling-focused)
```javascript
const cycleTiles = L.tileLayer(
  'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
  {
    attribution: '© OpenStreetMap contributors. Tiles style by CyclOSM hosted by OpenStreetMap France',
    maxZoom: 19
  }
);
```

---

## 5. Affiliate Integration Endpoints

### 5.1 Booking.com Partner API

**Authentication:** Partner ID in URL
**Commission:** 3-5% typical

```javascript
// Campsite search and booking links
const bookingUrl = `https://www.booking.com/searchresults.html?
aid=${PARTNER_ID}&
latitude=${lat}&longitude=${lng}&
radius=10&
accommodation_type=campsite`;
```

### 5.2 Pitchup.com Affiliate

**Authentication:** Affiliate ID in URL
**Commission:** Up to 8%

```javascript
const pitchupUrl = `https://www.pitchup.com/campsites/search?
location=${encodeURIComponent(location)}&
affiliate=${AFFILIATE_ID}`;
```

### 5.3 ACSI (Camping Card)

**Integration:** Deep links to campsite pages
**Commission:** Membership referrals

```javascript
const acsiUrl = `https://www.acsi.eu/en/search-campsites?
country=${country}&region=${region}&
ref=${AFFILIATE_CODE}`;
```

---

## 6. Error Handling & Fallback Strategy

### 6.1 Service Availability Matrix

```javascript
const serviceMatrix = {
  routing: {
    primary: 'openrouteservice',
    backup: 'osrm',
    offline: 'basic_calculation'
  },
  campsites: {
    primary: 'overpass',
    backup: 'opencampingmap',
    offline: 'cached_data'
  },
  geocoding: {
    primary: 'nominatim',
    backup: 'mapbox_free_tier',
    offline: 'coordinates_only'
  },
  tiles: {
    primary: 'openstreetmap',
    backup: 'opentopomap',
    offline: 'cached_tiles'
  }
};
```

### 6.2 Rate Limiting Implementation

```javascript
class APIRateLimiter {
  constructor() {
    this.limits = {
      openrouteservice: { requests: 2000, period: 86400000 }, // per day
      nominatim: { requests: 1, period: 1000 },              // per second
      overpass: { requests: 2, period: 1000 }                // per second
    };
    this.usage = new Map();
  }

  async checkLimit(service) {
    const limit = this.limits[service];
    const usage = this.usage.get(service) || { count: 0, resetTime: Date.now() + limit.period };

    if (Date.now() > usage.resetTime) {
      usage.count = 0;
      usage.resetTime = Date.now() + limit.period;
    }

    if (usage.count >= limit.requests) {
      throw new Error(`Rate limit exceeded for ${service}`);
    }

    usage.count++;
    this.usage.set(service, usage);
    return true;
  }
}
```

### 6.3 Caching Strategy

```javascript
const cacheConfig = {
  // Route caching
  routes: {
    ttl: 3600000,        // 1 hour
    maxSize: 100,        // 100 cached routes
    storage: 'localStorage'
  },

  // Campsite data caching
  campsites: {
    ttl: 86400000,       // 24 hours
    maxSize: 10000,      // 10k campsites
    storage: 'indexedDB'
  },

  // Geocoding cache
  geocoding: {
    ttl: 604800000,      // 7 days
    maxSize: 1000,       // 1k addresses
    storage: 'localStorage'
  },

  // Map tiles cache
  tiles: {
    ttl: 2592000000,     // 30 days
    storage: 'browser_cache'
  }
};
```

---

## 7. Data Processing & Normalization

### 7.1 Coordinate Systems

```javascript
// All coordinates in WGS84 (EPSG:4326)
const coordinateFormat = {
  latitude: 'decimal degrees, -90 to 90',
  longitude: 'decimal degrees, -180 to 180',
  precision: 6,  // ~1 meter accuracy
  format: 'number'  // not string
};
```

### 7.2 Distance Calculations

```javascript
// Haversine formula for distance between coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}
```

### 7.3 Data Validation

```javascript
const validators = {
  coordinates: (lat, lng) => {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  },

  vehicleDimensions: (dimensions) => {
    return dimensions.height > 0 && dimensions.height <= 4.5 &&
           dimensions.width > 0 && dimensions.width <= 3.0 &&
           dimensions.weight > 0 && dimensions.weight <= 40 &&
           dimensions.length > 0 && dimensions.length <= 20;
  },

  routeWaypoints: (waypoints) => {
    return waypoints.length >= 2 && waypoints.length <= 50;
  }
};
```

---

## 8. Configuration Management

### 8.1 Environment Configuration

```javascript
const config = {
  development: {
    apis: {
      openrouteservice: {
        baseUrl: 'https://api.openrouteservice.org/v2',
        apiKey: process.env.REACT_APP_ORS_API_KEY,
        timeout: 10000
      },
      overpass: {
        baseUrl: 'https://overpass-api.de/api/interpreter',
        timeout: 25000
      },
      nominatim: {
        baseUrl: 'https://nominatim.openstreetmap.org',
        timeout: 5000,
        userAgent: 'EuropeanCamperPlanner/1.0-dev'
      }
    },

    caching: {
      enabled: true,
      debug: true
    },

    features: {
      ADVANCED_ROUTING: true,
      CAMPSITE_BOOKING: false,
      WEATHER_DATA: false
    }
  },

  production: {
    apis: {
      // Same as development but with production keys
      openrouteservice: {
        baseUrl: 'https://api.openrouteservice.org/v2',
        apiKey: process.env.REACT_APP_ORS_API_KEY_PROD,
        timeout: 10000
      }
      // ... other apis
    },

    caching: {
      enabled: true,
      debug: false
    }
  }
};
```

### 8.2 API Key Management

```javascript
// Store API keys in environment variables
// .env.local (not committed to git)
REACT_APP_ORS_API_KEY=your_openrouteservice_key_here
REACT_APP_BOOKING_AFFILIATE_ID=your_booking_affiliate_id

// Access in code
const apiKeys = {
  openrouteservice: process.env.REACT_APP_ORS_API_KEY,
  booking: process.env.REACT_APP_BOOKING_AFFILIATE_ID
};
```

---

## 9. Testing & Monitoring

### 9.1 API Health Checks

```javascript
const healthChecks = {
  async checkOpenRouteService() {
    try {
      const response = await fetch(`${ORS_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  },

  async checkOverpass() {
    try {
      const response = await fetch(`${OVERPASS_BASE_URL}`, {
        method: 'POST',
        body: '[out:json];(node(1););out;'
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
};
```

### 9.2 Performance Monitoring

```javascript
const performanceMetrics = {
  trackAPICall: (service, startTime, success) => {
    const duration = Date.now() - startTime;
    console.log(`${service} API call: ${duration}ms, success: ${success}`);

    // Store metrics in localStorage for analysis
    const metrics = JSON.parse(localStorage.getItem('api_metrics') || '{}');
    if (!metrics[service]) metrics[service] = [];
    metrics[service].push({ duration, success, timestamp: Date.now() });
    localStorage.setItem('api_metrics', JSON.stringify(metrics));
  }
};
```

---

## 10. Data Migration & Versioning

### 10.1 API Version Handling

```javascript
const apiVersions = {
  openrouteservice: 'v2',
  overpass: '0.7.57',
  nominatim: '1.0'
};

// Handle API version changes gracefully
const apiRequest = async (service, endpoint, params) => {
  try {
    const response = await fetch(`${baseUrls[service]}/${apiVersions[service]}/${endpoint}`, params);
    return await response.json();
  } catch (error) {
    // Try fallback version or service
    console.warn(`${service} API failed, trying fallback...`);
    return await fallbackRequest(service, endpoint, params);
  }
};
```

---

**Implementation Priority:** Implement services in order: Map tiles → Routing → Geocoding → Campsites → Affiliates

**Testing Strategy:** Test each API integration individually before combining, implement health checks early, cache aggressively to minimize API calls during development.