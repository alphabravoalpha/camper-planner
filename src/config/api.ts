// API Configuration
// External service endpoints and settings

export const APIConfig = {
  routing: {
    primary: 'openrouteservice',
    fallback: 'osrm',
    endpoints: {
      openrouteservice: 'https://api.openrouteservice.org/v2',
      osrm: 'https://router.project-osrm.org'
    }
  },

  campsites: {
    primary: 'overpass',
    sources: {
      overpass: 'https://overpass-api.de/api/interpreter',
      opencampingmap: 'https://opencampingmap.org/api'
    }
  },

  geocoding: {
    primary: 'nominatim',
    endpoints: {
      nominatim: 'https://nominatim.openstreetmap.org'
    }
  },

  tiles: {
    primary: 'openstreetmap',
    sources: {
      openstreetmap: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      opentopomap: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
    }
  }
} as const;