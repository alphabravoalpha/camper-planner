// Channel Crossing Data
// Static data for UK ↔ Europe ferry and tunnel crossings
// Used by the Trip Planning Wizard to route UK-based travelers to mainland Europe

export interface CrossingTerminal {
  name: string;
  lat: number;
  lng: number;
  country: string;
}

export interface ChannelCrossing {
  id: string;
  name: string;
  type: 'ferry' | 'tunnel';
  departure: CrossingTerminal;
  arrival: CrossingTerminal;
  duration: number; // minutes (crossing time only)
  frequency: string;
  operators: string[];
  bookingUrls: string[];
  vehicleTypes: ('motorhome' | 'caravan' | 'campervan')[];
  maxVehicleLength?: number; // meters
  notes: string;
  estimatedCost: { low: number; high: number; currency: string };
  region: 'short' | 'western' | 'northern';
  overnightCrossing: boolean; // true if crossing is typically overnight
}

export const CHANNEL_CROSSINGS: ChannelCrossing[] = [
  // ============================================
  // SHORT CROSSINGS (Dover / Folkestone area)
  // ============================================
  {
    id: 'dover-calais',
    name: 'Dover → Calais',
    type: 'ferry',
    departure: { name: 'Dover', lat: 51.1279, lng: 1.3134, country: 'GB' },
    arrival: { name: 'Calais', lat: 50.9513, lng: 1.8587, country: 'FR' },
    duration: 90,
    frequency: 'Up to 30 sailings per day',
    operators: ['P&O Ferries', 'DFDS'],
    bookingUrls: [
      'https://www.poferries.com/en/dover-calais',
      'https://www.dfds.com/en-gb/passenger-ferries/dover-calais',
    ],
    vehicleTypes: ['motorhome', 'caravan', 'campervan'],
    notes: 'Most popular crossing. Frequent sailings, short crossing time.',
    estimatedCost: { low: 100, high: 300, currency: 'GBP' },
    region: 'short',
    overnightCrossing: false,
  },
  {
    id: 'dover-dunkirk',
    name: 'Dover → Dunkirk',
    type: 'ferry',
    departure: { name: 'Dover', lat: 51.1279, lng: 1.3134, country: 'GB' },
    arrival: { name: 'Dunkirk', lat: 51.0486, lng: 2.3767, country: 'FR' },
    duration: 120,
    frequency: 'Up to 12 sailings per day',
    operators: ['DFDS'],
    bookingUrls: ['https://www.dfds.com/en-gb/passenger-ferries/dover-dunkirk'],
    vehicleTypes: ['motorhome', 'caravan', 'campervan'],
    notes: 'Good alternative to Calais. Often cheaper, slightly longer crossing.',
    estimatedCost: { low: 80, high: 250, currency: 'GBP' },
    region: 'short',
    overnightCrossing: false,
  },
  {
    id: 'eurotunnel',
    name: 'Folkestone → Calais',
    type: 'tunnel',
    departure: { name: 'Folkestone', lat: 51.0947, lng: 1.1354, country: 'GB' },
    arrival: { name: 'Calais (Coquelles)', lat: 50.9268, lng: 1.8134, country: 'FR' },
    duration: 35,
    frequency: 'Up to 4 departures per hour',
    operators: ['Eurotunnel Le Shuttle'],
    bookingUrls: ['https://www.eurotunnel.com/uk/travelling-with-us/motorhomes-caravans/'],
    vehicleTypes: ['motorhome', 'campervan'],
    maxVehicleLength: 18,
    notes:
      'Fastest crossing. Drive on, drive off. Caravans accepted on some services — check height restrictions (max 2.85m for standard, 3.95m for high-loader).',
    estimatedCost: { low: 120, high: 400, currency: 'GBP' },
    region: 'short',
    overnightCrossing: false,
  },

  // ============================================
  // WESTERN CROSSINGS (Portsmouth / Plymouth area)
  // ============================================
  {
    id: 'portsmouth-caen',
    name: 'Portsmouth → Caen (Ouistreham)',
    type: 'ferry',
    departure: { name: 'Portsmouth', lat: 50.7989, lng: -1.0872, country: 'GB' },
    arrival: { name: 'Caen (Ouistreham)', lat: 49.283, lng: -0.2488, country: 'FR' },
    duration: 360,
    frequency: 'Up to 3 sailings per day',
    operators: ['Brittany Ferries'],
    bookingUrls: ['https://www.brittany-ferries.co.uk/routes/portsmouth-caen'],
    vehicleTypes: ['motorhome', 'caravan', 'campervan'],
    notes:
      'Arrives in Normandy. Good for western France, Spain, and Portugal routes. Day and overnight sailings available.',
    estimatedCost: { low: 150, high: 450, currency: 'GBP' },
    region: 'western',
    overnightCrossing: true,
  },
  {
    id: 'portsmouth-lehavre',
    name: 'Portsmouth → Le Havre',
    type: 'ferry',
    departure: { name: 'Portsmouth', lat: 50.7989, lng: -1.0872, country: 'GB' },
    arrival: { name: 'Le Havre', lat: 49.4872, lng: 0.1063, country: 'FR' },
    duration: 330,
    frequency: '1-2 sailings per day',
    operators: ['Brittany Ferries'],
    bookingUrls: ['https://www.brittany-ferries.co.uk/routes/portsmouth-le-havre'],
    vehicleTypes: ['motorhome', 'caravan', 'campervan'],
    notes: 'Overnight crossing. Arrives early morning, good for heading south through France.',
    estimatedCost: { low: 150, high: 400, currency: 'GBP' },
    region: 'western',
    overnightCrossing: true,
  },
  {
    id: 'portsmouth-stmalo',
    name: 'Portsmouth → St Malo',
    type: 'ferry',
    departure: { name: 'Portsmouth', lat: 50.7989, lng: -1.0872, country: 'GB' },
    arrival: { name: 'St Malo', lat: 48.6493, lng: -2.007, country: 'FR' },
    duration: 540,
    frequency: '1 sailing per day (seasonal)',
    operators: ['Brittany Ferries'],
    bookingUrls: ['https://www.brittany-ferries.co.uk/routes/portsmouth-st-malo'],
    vehicleTypes: ['motorhome', 'caravan', 'campervan'],
    notes: 'Overnight crossing to Brittany. Longer but arrives further west. Seasonal service.',
    estimatedCost: { low: 180, high: 500, currency: 'GBP' },
    region: 'western',
    overnightCrossing: true,
  },
  {
    id: 'plymouth-roscoff',
    name: 'Plymouth → Roscoff',
    type: 'ferry',
    departure: { name: 'Plymouth', lat: 50.366, lng: -4.1422, country: 'GB' },
    arrival: { name: 'Roscoff', lat: 48.7267, lng: -3.981, country: 'FR' },
    duration: 360,
    frequency: '1-2 sailings per day (seasonal)',
    operators: ['Brittany Ferries'],
    bookingUrls: ['https://www.brittany-ferries.co.uk/routes/plymouth-roscoff'],
    vehicleTypes: ['motorhome', 'caravan', 'campervan'],
    notes:
      'Best for travelers from the West Country. Arrives in Brittany. Seasonal service (March-November).',
    estimatedCost: { low: 150, high: 450, currency: 'GBP' },
    region: 'western',
    overnightCrossing: true,
  },
  {
    id: 'poole-cherbourg',
    name: 'Poole → Cherbourg',
    type: 'ferry',
    departure: { name: 'Poole', lat: 50.7076, lng: -1.987, country: 'GB' },
    arrival: { name: 'Cherbourg', lat: 49.6386, lng: -1.6163, country: 'FR' },
    duration: 270,
    frequency: '1-2 sailings per day',
    operators: ['Brittany Ferries'],
    bookingUrls: ['https://www.brittany-ferries.co.uk/routes/poole-cherbourg'],
    vehicleTypes: ['motorhome', 'caravan', 'campervan'],
    notes: 'Shorter western crossing. Good for Normandy and heading south.',
    estimatedCost: { low: 130, high: 380, currency: 'GBP' },
    region: 'western',
    overnightCrossing: false,
  },
  {
    id: 'newhaven-dieppe',
    name: 'Newhaven → Dieppe',
    type: 'ferry',
    departure: { name: 'Newhaven', lat: 50.7924, lng: 0.0613, country: 'GB' },
    arrival: { name: 'Dieppe', lat: 49.9266, lng: 1.077, country: 'FR' },
    duration: 240,
    frequency: 'Up to 3 sailings per day',
    operators: ['DFDS'],
    bookingUrls: ['https://www.dfds.com/en-gb/passenger-ferries/newhaven-dieppe'],
    vehicleTypes: ['motorhome', 'caravan', 'campervan'],
    notes: 'Arrives in upper Normandy. Good alternative to Dover for London/South East travelers.',
    estimatedCost: { low: 90, high: 280, currency: 'GBP' },
    region: 'short',
    overnightCrossing: false,
  },

  // ============================================
  // NORTHERN CROSSINGS (Harwich / Hull / Newcastle)
  // ============================================
  {
    id: 'harwich-hookofholland',
    name: 'Harwich → Hook of Holland',
    type: 'ferry',
    departure: { name: 'Harwich', lat: 51.9461, lng: 1.2474, country: 'GB' },
    arrival: { name: 'Hook of Holland', lat: 51.9811, lng: 4.123, country: 'NL' },
    duration: 420,
    frequency: '2 sailings per day',
    operators: ['Stena Line'],
    bookingUrls: ['https://www.stenaline.co.uk/routes/harwich-hook-of-holland'],
    vehicleTypes: ['motorhome', 'caravan', 'campervan'],
    notes:
      'Overnight crossing to the Netherlands. Best for Germany, Benelux, and Scandinavia routes.',
    estimatedCost: { low: 120, high: 350, currency: 'GBP' },
    region: 'northern',
    overnightCrossing: true,
  },
  {
    id: 'hull-rotterdam',
    name: 'Hull → Rotterdam (Europoort)',
    type: 'ferry',
    departure: { name: 'Hull', lat: 53.7383, lng: -0.2903, country: 'GB' },
    arrival: { name: 'Rotterdam (Europoort)', lat: 51.9546, lng: 4.1452, country: 'NL' },
    duration: 660,
    frequency: '1 sailing per day (overnight)',
    operators: ['P&O Ferries'],
    bookingUrls: ['https://www.poferries.com/en/hull-rotterdam'],
    vehicleTypes: ['motorhome', 'caravan', 'campervan'],
    notes:
      'Overnight crossing. Best for travelers from the North of England. Arrives early morning.',
    estimatedCost: { low: 130, high: 380, currency: 'GBP' },
    region: 'northern',
    overnightCrossing: true,
  },
  {
    id: 'newcastle-amsterdam',
    name: 'Newcastle → Amsterdam (IJmuiden)',
    type: 'ferry',
    departure: { name: 'Newcastle', lat: 54.996, lng: -1.4402, country: 'GB' },
    arrival: { name: 'Amsterdam (IJmuiden)', lat: 52.4614, lng: 4.602, country: 'NL' },
    duration: 960,
    frequency: '1 sailing per day (overnight)',
    operators: ['DFDS'],
    bookingUrls: ['https://www.dfds.com/en-gb/passenger-ferries/newcastle-amsterdam'],
    vehicleTypes: ['motorhome', 'caravan', 'campervan'],
    notes:
      'Overnight crossing from the North East. Mini-cruise experience. Best for Netherlands, Germany, and beyond.',
    estimatedCost: { low: 150, high: 400, currency: 'GBP' },
    region: 'northern',
    overnightCrossing: true,
  },
];

/**
 * Check if a location is in the UK or Ireland (needs a channel crossing to reach mainland Europe)
 */
export function isUKOrIreland(lat: number, lng: number): boolean {
  // UK mainland: roughly lat 49.9-60.9, lng -8.2-1.8
  const isUK = lat >= 49.9 && lat <= 60.9 && lng >= -8.2 && lng <= 1.8;
  // Ireland: roughly lat 51.4-55.4, lng -10.5-(-5.9)
  const isIreland = lat >= 51.4 && lat <= 55.4 && lng >= -10.5 && lng <= -5.9;
  return isUK || isIreland;
}

/**
 * Check if a location is on mainland Europe (not UK/Ireland/Iceland)
 */
export function isMainlandEurope(lat: number, lng: number): boolean {
  // Mainland Europe: roughly lat 35-72, lng -10-40
  // Exclude UK/Ireland
  const isEurope = lat >= 35 && lat <= 72 && lng >= -10 && lng <= 40;
  return isEurope && !isUKOrIreland(lat, lng);
}

/**
 * Check if a channel crossing is needed between two locations
 */
export function needsChannelCrossing(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): boolean {
  const startIsUK = isUKOrIreland(startLat, startLng);
  const endIsUK = isUKOrIreland(endLat, endLng);
  const startIsEurope = isMainlandEurope(startLat, startLng);
  const endIsEurope = isMainlandEurope(endLat, endLng);

  return (startIsUK && endIsEurope) || (startIsEurope && endIsUK);
}

/**
 * Get crossing recommendations based on start location and destination
 * Returns crossings sorted by estimated total travel time
 * (drive to port + crossing + drive from port to destination)
 */
export function getRecommendedCrossings(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): ChannelCrossing[] {
  // Simple distance-based scoring
  const haversine = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const isStartUK = isUKOrIreland(startLat, startLng);

  return [...CHANNEL_CROSSINGS]
    .map(crossing => {
      const ukTerminal = isStartUK ? crossing.departure : crossing.arrival;
      const euTerminal = isStartUK ? crossing.arrival : crossing.departure;

      const driveToPort = haversine(startLat, startLng, ukTerminal.lat, ukTerminal.lng);
      const driveFromPort = haversine(euTerminal.lat, euTerminal.lng, endLat, endLng);

      // Estimate total time: drive at ~80km/h + crossing time
      const totalTime = (driveToPort + driveFromPort) / 80 + crossing.duration / 60;

      return { crossing, totalTime };
    })
    .sort((a, b) => a.totalTime - b.totalTime)
    .map(({ crossing }) => crossing);
}
