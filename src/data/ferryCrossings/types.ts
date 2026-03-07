// Ferry Crossing Types
// Comprehensive European ferry and tunnel crossing data model

export interface CrossingTerminal {
  name: string;
  lat: number;
  lng: number;
  country: string; // ISO 3166-1 alpha-2
}

export type FerryCrossingRegion =
  | 'english-channel'
  | 'uk-western'
  | 'uk-northern'
  | 'uk-spain'
  | 'uk-ireland'
  | 'ireland-france'
  | 'scottish-islands'
  | 'scandinavia-baltic'
  | 'mediterranean-west'
  | 'adriatic'
  | 'baltic-east'
  | 'north-africa';

export interface FerryCrossing {
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
  region: FerryCrossingRegion;
  overnightCrossing: boolean;
  mandatory: boolean; // true = no road/bridge alternative exists
}

/** Human-readable labels for each region */
export const REGION_LABELS: Record<FerryCrossingRegion, { title: string; description: string }> = {
  'english-channel': {
    title: 'English Channel',
    description: 'Dover & Folkestone — quickest crossings to France',
  },
  'uk-western': {
    title: 'Western Channel',
    description: 'Portsmouth, Plymouth & Poole — arrive further south/west in France',
  },
  'uk-northern': {
    title: 'North Sea',
    description: 'Harwich, Hull & Newcastle — best for Netherlands & northern routes',
  },
  'uk-spain': {
    title: 'UK to Spain Direct',
    description: 'Portsmouth & Plymouth — skip France entirely',
  },
  'uk-ireland': {
    title: 'UK to Ireland',
    description: 'Wales, Liverpool & Scotland — Irish Sea crossings',
  },
  'ireland-france': {
    title: 'Ireland to France',
    description: 'Dublin, Rosslare & Cork — direct to France or Spain',
  },
  'scottish-islands': {
    title: 'Scottish Islands',
    description: 'Orkney, Shetland, Mull & other island ferries',
  },
  'scandinavia-baltic': {
    title: 'Scandinavia & Baltic',
    description: 'Germany, Denmark, Sweden, Finland, Estonia & more',
  },
  'mediterranean-west': {
    title: 'Western Mediterranean',
    description: 'Corsica, Sardinia, Sicily, Balearics & North Africa',
  },
  adriatic: {
    title: 'Adriatic & Eastern Mediterranean',
    description: 'Italy to Greece, Croatia, Albania & Greek islands',
  },
  'baltic-east': {
    title: 'Eastern Baltic',
    description: 'Finland, Estonia, Latvia & Lithuania connections',
  },
  'north-africa': {
    title: 'North Africa',
    description: 'Spain & France to Morocco',
  },
};
