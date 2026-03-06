// Landmass Definitions and Detection Utilities
// Polygon-based landmass classification for ferry route detection

export interface Landmass {
  id: string;
  name: string;
  polygon: [number, number][]; // [lat, lng] points, closed polygon
}

// Polygons extend slightly into sea to avoid coastline misclassification.
// Points are [lat, lng] in clockwise order.
export const LANDMASSES: Landmass[] = [
  {
    id: 'gb-mainland',
    name: 'Great Britain',
    polygon: [
      [49.8, -6.5],
      [49.8, 0.0],
      [50.6, 0.3],
      [51.2, 1.5],
      [52.0, 2.0],
      [53.5, 0.5],
      [55.8, -1.5],
      [58.7, -3.0],
      [58.7, -5.5],
      [57.0, -7.5],
      [55.5, -6.5],
      [54.0, -5.5],
      [51.5, -5.5],
      [49.8, -6.5],
    ],
  },
  {
    id: 'ireland',
    name: 'Ireland',
    polygon: [
      [51.3, -10.8],
      [51.3, -5.8],
      [53.5, -5.8],
      [55.5, -5.5],
      [55.5, -7.5],
      [54.5, -10.5],
      [51.3, -10.8],
    ],
  },
  {
    id: 'europe-mainland',
    name: 'Continental Europe',
    polygon: [
      [36.0, -10.0],
      [36.0, 40.0],
      [55.5, 40.0],
      [55.5, 28.0],
      [71.5, 32.0],
      [71.5, 5.0],
      [58.0, 5.0],
      [57.5, 8.0],
      [54.5, 8.0],
      [53.5, 3.5],
      [51.2, 2.5],
      [51.1, 1.5],
      [49.5, 0.0],
      [43.0, -2.0],
      [36.0, -10.0],
    ],
  },
  {
    id: 'scandinavia',
    name: 'Scandinavian Peninsula',
    polygon: [
      [55.3, 12.0],
      [56.0, 16.5],
      [60.0, 19.5],
      [64.0, 21.5],
      [69.0, 26.0],
      [71.5, 28.0],
      [71.5, 5.0],
      [58.0, 5.0],
      [57.5, 8.0],
      [56.0, 8.5],
      [55.3, 12.0],
    ],
  },
  {
    id: 'corsica',
    name: 'Corsica',
    polygon: [
      [41.3, 8.5],
      [41.3, 9.7],
      [43.1, 9.7],
      [43.1, 8.5],
      [41.3, 8.5],
    ],
  },
  {
    id: 'sardinia',
    name: 'Sardinia',
    polygon: [
      [38.8, 8.0],
      [38.8, 9.9],
      [41.3, 9.9],
      [41.3, 8.0],
      [38.8, 8.0],
    ],
  },
  {
    id: 'sicily',
    name: 'Sicily',
    polygon: [
      [36.5, 12.3],
      [36.5, 15.8],
      [38.4, 15.8],
      [38.4, 12.3],
      [36.5, 12.3],
    ],
  },
  {
    id: 'balearics-mallorca',
    name: 'Mallorca',
    polygon: [
      [39.2, 2.2],
      [39.2, 3.6],
      [40.0, 3.6],
      [40.0, 2.2],
      [39.2, 2.2],
    ],
  },
  {
    id: 'balearics-ibiza',
    name: 'Ibiza',
    polygon: [
      [38.6, 1.1],
      [38.6, 1.7],
      [39.2, 1.7],
      [39.2, 1.1],
      [38.6, 1.1],
    ],
  },
  {
    id: 'balearics-menorca',
    name: 'Menorca',
    polygon: [
      [39.7, 3.7],
      [39.7, 4.5],
      [40.2, 4.5],
      [40.2, 3.7],
      [39.7, 3.7],
    ],
  },
  {
    id: 'crete',
    name: 'Crete',
    polygon: [
      [34.8, 23.4],
      [34.8, 26.4],
      [35.7, 26.4],
      [35.7, 23.4],
      [34.8, 23.4],
    ],
  },
  {
    id: 'orkney',
    name: 'Orkney',
    polygon: [
      [58.6, -3.5],
      [58.6, -2.3],
      [59.5, -2.3],
      [59.5, -3.5],
      [58.6, -3.5],
    ],
  },
  {
    id: 'shetland',
    name: 'Shetland',
    polygon: [
      [59.7, -2.0],
      [59.7, -0.5],
      [60.9, -0.5],
      [60.9, -2.0],
      [59.7, -2.0],
    ],
  },
  {
    id: 'mull',
    name: 'Mull',
    polygon: [
      [56.2, -6.5],
      [56.2, -5.5],
      [56.7, -5.5],
      [56.7, -6.5],
      [56.2, -6.5],
    ],
  },
  {
    id: 'morocco',
    name: 'Morocco',
    polygon: [
      [27.0, -14.0],
      [27.0, -1.0],
      [36.0, -1.0],
      [36.0, -14.0],
      [27.0, -14.0],
    ],
  },
];

/**
 * Road/bridge connections between landmasses.
 * If two landmasses appear in each other's list, driving between them
 * is possible without a ferry.
 */
export const ROAD_CONNECTIONS: Record<string, string[]> = {
  'europe-mainland': ['scandinavia', 'sicily'],
  scandinavia: ['europe-mainland'],
  sicily: ['europe-mainland'],
};

/**
 * Ray-casting point-in-polygon test.
 * Returns true if [lat, lng] is inside the polygon.
 */
export function pointInPolygon(lat: number, lng: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [yi, xi] = polygon[i];
    const [yj, xj] = polygon[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Classify a point to a landmass. Returns the landmass ID, or null if
 * the point is in the sea / not matched.
 *
 * Check smaller/island landmasses first (they may overlap with larger
 * bounding polygons like europe-mainland).
 */
export function classifyLandmass(lat: number, lng: number): string | null {
  // Check islands before continents — smaller polygons take priority
  const priorityOrder = [
    'corsica',
    'sardinia',
    'sicily',
    'balearics-mallorca',
    'balearics-ibiza',
    'balearics-menorca',
    'crete',
    'orkney',
    'shetland',
    'mull',
    'ireland',
    'gb-mainland',
    'morocco',
    'scandinavia',
    'europe-mainland',
  ];

  for (const id of priorityOrder) {
    const landmass = LANDMASSES.find(l => l.id === id);
    if (landmass && pointInPolygon(lat, lng, landmass.polygon)) {
      return landmass.id;
    }
  }
  return null;
}

/**
 * BFS to check if two landmasses are road-connected (directly or transitively).
 */
export function areLandmassesConnected(a: string, b: string): boolean {
  if (a === b) return true;
  const visited = new Set<string>([a]);
  const queue = [a];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = ROAD_CONNECTIONS[current] || [];
    for (const neighbor of neighbors) {
      if (neighbor === b) return true;
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return false;
}

/**
 * Haversine distance in km between two lat/lng points.
 */
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
