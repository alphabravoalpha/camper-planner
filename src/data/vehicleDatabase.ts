// Vehicle Database for European Campervans and Motorhomes
// Contains dimensions and fuel consumption for common base vehicles used in campervan conversions
// Data sourced from manufacturer specifications

export interface VehicleVariant {
  id: string;
  name: string; // e.g., "L2H2 Medium"
  height: number; // meters
  width: number; // meters (body width, not including mirrors)
  length: number; // meters
  weight: number; // tonnes (typical GVW)
  fuelConsumption?: number; // L/100km (typical diesel consumption)
  internalHeight?: number; // meters (cargo area)
  internalWidth?: number; // meters (cargo area)
  internalLength?: number; // meters (cargo area)
}

export interface VehicleModel {
  id: string;
  name: string;
  variants: VehicleVariant[];
}

export interface VehicleMake {
  id: string;
  name: string;
  country: string;
  models: VehicleModel[];
}

// Comprehensive database of European campervan base vehicles
export const VEHICLE_DATABASE: VehicleMake[] = [
  // ===================
  // FIAT / SEVEL PLATFORM
  // ===================
  {
    id: 'fiat',
    name: 'Fiat',
    country: 'Italy',
    models: [
      {
        id: 'ducato',
        name: 'Ducato',
        variants: [
          // Short wheelbase
          { id: 'l1h1', name: 'L1H1 (Short/Low)', height: 2.25, width: 2.05, length: 4.96, weight: 3.3, fuelConsumption: 9.5, internalHeight: 1.66, internalWidth: 1.87, internalLength: 2.67 },
          { id: 'l1h2', name: 'L1H2 (Short/Medium)', height: 2.52, width: 2.05, length: 4.96, weight: 3.5, fuelConsumption: 10.0, internalHeight: 1.93, internalWidth: 1.87, internalLength: 2.67 },
          // Medium wheelbase
          { id: 'l2h1', name: 'L2H1 (Medium/Low)', height: 2.25, width: 2.05, length: 5.41, weight: 3.3, fuelConsumption: 10.0, internalHeight: 1.66, internalWidth: 1.87, internalLength: 3.12 },
          { id: 'l2h2', name: 'L2H2 (Medium/Medium)', height: 2.52, width: 2.05, length: 5.41, weight: 3.5, fuelConsumption: 10.5, internalHeight: 1.93, internalWidth: 1.87, internalLength: 3.12 },
          // Long wheelbase
          { id: 'l3h2', name: 'L3H2 (Long/Medium)', height: 2.52, width: 2.05, length: 6.00, weight: 3.5, fuelConsumption: 11.5, internalHeight: 1.93, internalWidth: 1.87, internalLength: 3.71 },
          { id: 'l3h3', name: 'L3H3 (Long/High)', height: 2.76, width: 2.05, length: 6.00, weight: 4.0, fuelConsumption: 12.0, internalHeight: 2.17, internalWidth: 1.87, internalLength: 3.71 },
          // Extra long wheelbase
          { id: 'l4h2', name: 'L4H2 (XLong/Medium)', height: 2.52, width: 2.05, length: 6.36, weight: 4.0, fuelConsumption: 12.5, internalHeight: 1.93, internalWidth: 1.87, internalLength: 4.07 },
          { id: 'l4h3', name: 'L4H3 (XLong/High)', height: 2.76, width: 2.05, length: 6.36, weight: 4.25, fuelConsumption: 13.0, internalHeight: 2.17, internalWidth: 1.87, internalLength: 4.07 },
        ]
      }
    ]
  },
  {
    id: 'peugeot',
    name: 'Peugeot',
    country: 'France',
    models: [
      {
        id: 'boxer',
        name: 'Boxer',
        variants: [
          // Same platform as Ducato - SEVEL
          { id: 'l1h1', name: 'L1H1 (Short/Low)', height: 2.25, width: 2.05, length: 4.96, weight: 3.3, fuelConsumption: 9.5, internalHeight: 1.66, internalWidth: 1.87, internalLength: 2.67 },
          { id: 'l1h2', name: 'L1H2 (Short/Medium)', height: 2.52, width: 2.05, length: 4.96, weight: 3.5, fuelConsumption: 10.0, internalHeight: 1.93, internalWidth: 1.87, internalLength: 2.67 },
          { id: 'l2h2', name: 'L2H2 (Medium/Medium)', height: 2.52, width: 2.05, length: 5.41, weight: 3.5, fuelConsumption: 10.5, internalHeight: 1.93, internalWidth: 1.87, internalLength: 3.12 },
          { id: 'l3h2', name: 'L3H2 (Long/Medium)', height: 2.52, width: 2.05, length: 6.00, weight: 3.5, fuelConsumption: 11.5, internalHeight: 1.93, internalWidth: 1.87, internalLength: 3.71 },
          { id: 'l3h3', name: 'L3H3 (Long/High)', height: 2.76, width: 2.05, length: 6.00, weight: 4.0, fuelConsumption: 12.0, internalHeight: 2.17, internalWidth: 1.87, internalLength: 3.71 },
          { id: 'l4h2', name: 'L4H2 (XLong/Medium)', height: 2.52, width: 2.05, length: 6.36, weight: 4.0, fuelConsumption: 12.5, internalHeight: 1.93, internalWidth: 1.87, internalLength: 4.07 },
          { id: 'l4h3', name: 'L4H3 (XLong/High)', height: 2.76, width: 2.05, length: 6.36, weight: 4.25, fuelConsumption: 13.0, internalHeight: 2.17, internalWidth: 1.87, internalLength: 4.07 },
        ]
      }
    ]
  },
  {
    id: 'citroen',
    name: 'Citroën',
    country: 'France',
    models: [
      {
        id: 'relay',
        name: 'Relay / Jumper',
        variants: [
          // Same platform as Ducato - SEVEL
          { id: 'l1h1', name: 'L1H1 (Short/Low)', height: 2.25, width: 2.05, length: 4.96, weight: 3.3, fuelConsumption: 9.5, internalHeight: 1.66, internalWidth: 1.87, internalLength: 2.67 },
          { id: 'l1h2', name: 'L1H2 (Short/Medium)', height: 2.52, width: 2.05, length: 4.96, weight: 3.5, fuelConsumption: 10.0, internalHeight: 1.93, internalWidth: 1.87, internalLength: 2.67 },
          { id: 'l2h2', name: 'L2H2 (Medium/Medium)', height: 2.52, width: 2.05, length: 5.41, weight: 3.5, fuelConsumption: 10.5, internalHeight: 1.93, internalWidth: 1.87, internalLength: 3.12 },
          { id: 'l3h2', name: 'L3H2 (Long/Medium)', height: 2.52, width: 2.05, length: 6.00, weight: 3.5, fuelConsumption: 11.5, internalHeight: 1.93, internalWidth: 1.87, internalLength: 3.71 },
          { id: 'l3h3', name: 'L3H3 (Long/High)', height: 2.76, width: 2.05, length: 6.00, weight: 4.0, fuelConsumption: 12.0, internalHeight: 2.17, internalWidth: 1.87, internalLength: 3.71 },
          { id: 'l4h3', name: 'L4H3 (XLong/High)', height: 2.76, width: 2.05, length: 6.36, weight: 4.25, fuelConsumption: 13.0, internalHeight: 2.17, internalWidth: 1.87, internalLength: 4.07 },
        ]
      }
    ]
  },

  // ===================
  // MERCEDES-BENZ
  // ===================
  {
    id: 'mercedes',
    name: 'Mercedes-Benz',
    country: 'Germany',
    models: [
      {
        id: 'sprinter',
        name: 'Sprinter',
        variants: [
          // Compact (A0)
          { id: 'a0-standard', name: 'Compact Standard Roof', height: 2.37, width: 1.99, length: 5.27, weight: 3.5, fuelConsumption: 10.0, internalHeight: 1.56, internalWidth: 1.79, internalLength: 2.60 },
          { id: 'a0-high', name: 'Compact High Roof', height: 2.69, width: 1.99, length: 5.27, weight: 3.5, fuelConsumption: 10.5, internalHeight: 1.88, internalWidth: 1.79, internalLength: 2.60 },
          // Standard (A1)
          { id: 'a1-standard', name: 'Standard Roof (Medium)', height: 2.37, width: 1.99, length: 5.93, weight: 3.5, fuelConsumption: 10.5, internalHeight: 1.56, internalWidth: 1.79, internalLength: 3.27 },
          { id: 'a1-high', name: 'High Roof (Medium)', height: 2.69, width: 1.99, length: 5.93, weight: 3.5, fuelConsumption: 11.0, internalHeight: 1.88, internalWidth: 1.79, internalLength: 3.27 },
          { id: 'a1-superhigh', name: 'Super High Roof (Medium)', height: 2.97, width: 1.99, length: 5.93, weight: 3.5, fuelConsumption: 11.5, internalHeight: 2.14, internalWidth: 1.79, internalLength: 3.27 },
          // Long (A2)
          { id: 'a2-high', name: 'High Roof (Long)', height: 2.69, width: 1.99, length: 6.97, weight: 3.5, fuelConsumption: 12.0, internalHeight: 1.88, internalWidth: 1.79, internalLength: 4.31 },
          { id: 'a2-superhigh', name: 'Super High Roof (Long)', height: 2.97, width: 1.99, length: 6.97, weight: 4.0, fuelConsumption: 12.5, internalHeight: 2.14, internalWidth: 1.79, internalLength: 4.31 },
          // Extra Long (A3)
          { id: 'a3-high', name: 'High Roof (XLong)', height: 2.69, width: 1.99, length: 7.37, weight: 4.0, fuelConsumption: 13.0, internalHeight: 1.88, internalWidth: 1.79, internalLength: 4.71 },
          { id: 'a3-superhigh', name: 'Super High Roof (XLong)', height: 2.97, width: 1.99, length: 7.37, weight: 4.5, fuelConsumption: 13.5, internalHeight: 2.14, internalWidth: 1.79, internalLength: 4.71 },
        ]
      }
    ]
  },

  // ===================
  // VOLKSWAGEN
  // ===================
  {
    id: 'volkswagen',
    name: 'Volkswagen',
    country: 'Germany',
    models: [
      {
        id: 'crafter',
        name: 'Crafter',
        variants: [
          // Short
          { id: 'short-normal', name: 'Short Normal Roof', height: 2.35, width: 2.04, length: 5.99, weight: 3.5, fuelConsumption: 10.0, internalHeight: 1.63, internalWidth: 1.83, internalLength: 3.45 },
          { id: 'short-high', name: 'Short High Roof', height: 2.59, width: 2.04, length: 5.99, weight: 3.5, fuelConsumption: 10.5, internalHeight: 1.86, internalWidth: 1.83, internalLength: 3.45 },
          // Medium
          { id: 'medium-normal', name: 'Medium Normal Roof', height: 2.35, width: 2.04, length: 6.84, weight: 3.5, fuelConsumption: 11.0, internalHeight: 1.63, internalWidth: 1.83, internalLength: 4.30 },
          { id: 'medium-high', name: 'Medium High Roof', height: 2.59, width: 2.04, length: 6.84, weight: 3.5, fuelConsumption: 11.5, internalHeight: 1.86, internalWidth: 1.83, internalLength: 4.30 },
          // Long
          { id: 'long-normal', name: 'Long Normal Roof', height: 2.35, width: 2.04, length: 7.39, weight: 4.0, fuelConsumption: 12.0, internalHeight: 1.63, internalWidth: 1.83, internalLength: 4.85 },
          { id: 'long-high', name: 'Long High Roof', height: 2.59, width: 2.04, length: 7.39, weight: 4.0, fuelConsumption: 12.5, internalHeight: 1.86, internalWidth: 1.83, internalLength: 4.85 },
        ]
      },
      {
        id: 'transporter',
        name: 'Transporter (T6.1)',
        variants: [
          { id: 'swb', name: 'Short Wheelbase', height: 1.99, width: 1.90, length: 4.90, weight: 2.8, fuelConsumption: 8.5, internalHeight: 1.41, internalWidth: 1.70, internalLength: 2.57 },
          { id: 'lwb', name: 'Long Wheelbase', height: 1.99, width: 1.90, length: 5.30, weight: 3.0, fuelConsumption: 9.0, internalHeight: 1.41, internalWidth: 1.70, internalLength: 2.97 },
          { id: 'lwb-high', name: 'Long High Roof', height: 2.48, width: 1.90, length: 5.30, weight: 3.0, fuelConsumption: 9.5, internalHeight: 1.94, internalWidth: 1.70, internalLength: 2.97 },
        ]
      },
      {
        id: 'california',
        name: 'California',
        variants: [
          { id: 'beach', name: 'Beach', height: 1.99, width: 1.90, length: 4.90, weight: 3.0, fuelConsumption: 9.0 },
          { id: 'coast', name: 'Coast', height: 1.99, width: 1.90, length: 4.90, weight: 3.1, fuelConsumption: 9.5 },
          { id: 'ocean', name: 'Ocean', height: 1.99, width: 1.90, length: 4.90, weight: 3.1, fuelConsumption: 9.5 },
        ]
      }
    ]
  },

  // ===================
  // FORD
  // ===================
  {
    id: 'ford',
    name: 'Ford',
    country: 'USA/Europe',
    models: [
      {
        id: 'transit',
        name: 'Transit',
        variants: [
          // L2 (Short)
          { id: 'l2h2', name: 'L2H2 (Short/Medium)', height: 2.35, width: 2.06, length: 5.53, weight: 3.3, fuelConsumption: 10.0, internalHeight: 1.78, internalWidth: 1.79, internalLength: 2.90 },
          { id: 'l2h3', name: 'L2H3 (Short/High)', height: 2.55, width: 2.06, length: 5.53, weight: 3.5, fuelConsumption: 10.5, internalHeight: 1.98, internalWidth: 1.79, internalLength: 2.90 },
          // L3 (Medium)
          { id: 'l3h2', name: 'L3H2 (Medium/Medium)', height: 2.35, width: 2.06, length: 5.98, weight: 3.5, fuelConsumption: 10.5, internalHeight: 1.78, internalWidth: 1.79, internalLength: 3.34 },
          { id: 'l3h3', name: 'L3H3 (Medium/High)', height: 2.55, width: 2.06, length: 5.98, weight: 3.5, fuelConsumption: 11.0, internalHeight: 1.98, internalWidth: 1.79, internalLength: 3.34 },
          // L4 (Long)
          { id: 'l4h2', name: 'L4H2 (Long/Medium)', height: 2.35, width: 2.06, length: 6.70, weight: 4.0, fuelConsumption: 11.5, internalHeight: 1.78, internalWidth: 1.79, internalLength: 4.22 },
          { id: 'l4h3', name: 'L4H3 (Long/High)', height: 2.55, width: 2.06, length: 6.70, weight: 4.0, fuelConsumption: 12.0, internalHeight: 1.98, internalWidth: 1.79, internalLength: 4.22 },
        ]
      },
      {
        id: 'transit-custom',
        name: 'Transit Custom',
        variants: [
          { id: 'l1h1', name: 'L1H1 (Short/Low)', height: 1.98, width: 1.99, length: 4.97, weight: 2.8, fuelConsumption: 7.5, internalHeight: 1.41, internalWidth: 1.54, internalLength: 2.56 },
          { id: 'l1h2', name: 'L1H2 (Short/High)', height: 2.34, width: 1.99, length: 4.97, weight: 2.9, fuelConsumption: 8.0, internalHeight: 1.78, internalWidth: 1.54, internalLength: 2.56 },
          { id: 'l2h1', name: 'L2H1 (Long/Low)', height: 1.98, width: 1.99, length: 5.34, weight: 3.0, fuelConsumption: 8.0, internalHeight: 1.41, internalWidth: 1.54, internalLength: 2.93 },
          { id: 'l2h2', name: 'L2H2 (Long/High)', height: 2.34, width: 1.99, length: 5.34, weight: 3.1, fuelConsumption: 8.5, internalHeight: 1.78, internalWidth: 1.54, internalLength: 2.93 },
        ]
      },
      {
        id: 'nugget',
        name: 'Transit Custom Nugget',
        variants: [
          { id: 'standard', name: 'Nugget', height: 2.09, width: 1.99, length: 4.97, weight: 3.1, fuelConsumption: 8.0 },
          { id: 'plus', name: 'Nugget Plus', height: 2.09, width: 1.99, length: 5.34, weight: 3.2, fuelConsumption: 8.5 },
        ]
      }
    ]
  },

  // ===================
  // RENAULT
  // ===================
  {
    id: 'renault',
    name: 'Renault',
    country: 'France',
    models: [
      {
        id: 'master',
        name: 'Master',
        variants: [
          { id: 'l1h1', name: 'L1H1 (Short/Low)', height: 2.31, width: 2.07, length: 5.08, weight: 3.3, fuelConsumption: 10.0, internalHeight: 1.66, internalWidth: 1.77, internalLength: 2.58 },
          { id: 'l1h2', name: 'L1H2 (Short/Medium)', height: 2.50, width: 2.07, length: 5.08, weight: 3.5, fuelConsumption: 10.5, internalHeight: 1.85, internalWidth: 1.77, internalLength: 2.58 },
          { id: 'l2h2', name: 'L2H2 (Medium/Medium)', height: 2.50, width: 2.07, length: 5.55, weight: 3.5, fuelConsumption: 11.0, internalHeight: 1.85, internalWidth: 1.77, internalLength: 3.08 },
          { id: 'l3h2', name: 'L3H2 (Long/Medium)', height: 2.50, width: 2.07, length: 6.20, weight: 3.5, fuelConsumption: 11.5, internalHeight: 1.85, internalWidth: 1.77, internalLength: 3.73 },
          { id: 'l3h3', name: 'L3H3 (Long/High)', height: 2.75, width: 2.07, length: 6.20, weight: 4.0, fuelConsumption: 12.0, internalHeight: 2.10, internalWidth: 1.77, internalLength: 3.73 },
          { id: 'l4h2', name: 'L4H2 (XLong/Medium)', height: 2.50, width: 2.07, length: 6.85, weight: 4.0, fuelConsumption: 12.0, internalHeight: 1.85, internalWidth: 1.77, internalLength: 4.38 },
          { id: 'l4h3', name: 'L4H3 (XLong/High)', height: 2.75, width: 2.07, length: 6.85, weight: 4.5, fuelConsumption: 12.5, internalHeight: 2.10, internalWidth: 1.77, internalLength: 4.38 },
        ]
      },
      {
        id: 'trafic',
        name: 'Trafic',
        variants: [
          { id: 'l1h1', name: 'L1H1 (Short/Standard)', height: 1.97, width: 1.96, length: 4.99, weight: 2.7, fuelConsumption: 7.5, internalHeight: 1.39, internalWidth: 1.66, internalLength: 2.54 },
          { id: 'l1h2', name: 'L1H2 (Short/High)', height: 2.50, width: 1.96, length: 4.99, weight: 2.8, fuelConsumption: 8.0, internalHeight: 1.90, internalWidth: 1.66, internalLength: 2.54 },
          { id: 'l2h1', name: 'L2H1 (Long/Standard)', height: 1.97, width: 1.96, length: 5.40, weight: 2.9, fuelConsumption: 8.0, internalHeight: 1.39, internalWidth: 1.66, internalLength: 2.94 },
          { id: 'l2h2', name: 'L2H2 (Long/High)', height: 2.50, width: 1.96, length: 5.40, weight: 3.0, fuelConsumption: 8.5, internalHeight: 1.90, internalWidth: 1.66, internalLength: 2.94 },
        ]
      }
    ]
  },

  // ===================
  // MAN
  // ===================
  {
    id: 'man',
    name: 'MAN',
    country: 'Germany',
    models: [
      {
        id: 'tge',
        name: 'TGE',
        variants: [
          // Same as VW Crafter (joint venture)
          { id: 'short-normal', name: 'Short Normal Roof', height: 2.35, width: 2.04, length: 5.99, weight: 3.5, fuelConsumption: 10.0, internalHeight: 1.63, internalWidth: 1.83, internalLength: 3.45 },
          { id: 'short-high', name: 'Short High Roof', height: 2.59, width: 2.04, length: 5.99, weight: 3.5, fuelConsumption: 10.5, internalHeight: 1.86, internalWidth: 1.83, internalLength: 3.45 },
          { id: 'medium-high', name: 'Medium High Roof', height: 2.59, width: 2.04, length: 6.84, weight: 3.5, fuelConsumption: 11.5, internalHeight: 1.86, internalWidth: 1.83, internalLength: 4.30 },
          { id: 'long-high', name: 'Long High Roof', height: 2.59, width: 2.04, length: 7.39, weight: 4.0, fuelConsumption: 12.5, internalHeight: 1.86, internalWidth: 1.83, internalLength: 4.85 },
        ]
      }
    ]
  },

  // ===================
  // OPEL / VAUXHALL
  // ===================
  {
    id: 'opel',
    name: 'Opel / Vauxhall',
    country: 'Germany/UK',
    models: [
      {
        id: 'movano',
        name: 'Movano',
        variants: [
          // Based on Renault Master platform
          { id: 'l1h1', name: 'L1H1 (Short/Low)', height: 2.31, width: 2.07, length: 5.08, weight: 3.3, fuelConsumption: 10.0, internalHeight: 1.66, internalWidth: 1.77, internalLength: 2.58 },
          { id: 'l2h2', name: 'L2H2 (Medium/Medium)', height: 2.50, width: 2.07, length: 5.55, weight: 3.5, fuelConsumption: 11.0, internalHeight: 1.85, internalWidth: 1.77, internalLength: 3.08 },
          { id: 'l3h2', name: 'L3H2 (Long/Medium)', height: 2.50, width: 2.07, length: 6.20, weight: 3.5, fuelConsumption: 11.5, internalHeight: 1.85, internalWidth: 1.77, internalLength: 3.73 },
          { id: 'l3h3', name: 'L3H3 (Long/High)', height: 2.75, width: 2.07, length: 6.20, weight: 4.0, fuelConsumption: 12.0, internalHeight: 2.10, internalWidth: 1.77, internalLength: 3.73 },
          { id: 'l4h3', name: 'L4H3 (XLong/High)', height: 2.75, width: 2.07, length: 6.85, weight: 4.5, fuelConsumption: 12.5, internalHeight: 2.10, internalWidth: 1.77, internalLength: 4.38 },
        ]
      },
      {
        id: 'vivaro',
        name: 'Vivaro',
        variants: [
          { id: 'l1', name: 'L1 Standard', height: 1.90, width: 1.92, length: 4.96, weight: 2.7, fuelConsumption: 7.5 },
          { id: 'l2', name: 'L2 Long', height: 1.90, width: 1.92, length: 5.31, weight: 2.9, fuelConsumption: 8.0 },
        ]
      }
    ]
  },

  // ===================
  // IVECO
  // ===================
  {
    id: 'iveco',
    name: 'Iveco',
    country: 'Italy',
    models: [
      {
        id: 'daily',
        name: 'Daily',
        variants: [
          { id: '7.2', name: '7.2m³ (Short)', height: 2.30, width: 2.01, length: 5.00, weight: 3.5, fuelConsumption: 10.5, internalHeight: 1.55, internalWidth: 1.80, internalLength: 2.61 },
          { id: '10.8', name: '10.8m³ (Medium)', height: 2.55, width: 2.01, length: 5.55, weight: 3.5, fuelConsumption: 11.5, internalHeight: 1.80, internalWidth: 1.80, internalLength: 3.16 },
          { id: '12', name: '12m³ (Medium/High)', height: 2.70, width: 2.01, length: 5.55, weight: 3.5, fuelConsumption: 12.0, internalHeight: 1.95, internalWidth: 1.80, internalLength: 3.16 },
          { id: '15.6', name: '15.6m³ (Long)', height: 2.55, width: 2.01, length: 6.50, weight: 4.0, fuelConsumption: 12.5, internalHeight: 1.80, internalWidth: 1.80, internalLength: 4.68 },
          { id: '18', name: '18m³ (Long/High)', height: 2.70, width: 2.01, length: 6.50, weight: 4.5, fuelConsumption: 13.0, internalHeight: 1.95, internalWidth: 1.80, internalLength: 4.68 },
        ]
      }
    ]
  },
];

// Popular motorhome manufacturers (built on above bases)
export const MOTORHOME_PRESETS = [
  // Compact Class B (Campervans)
  { id: 'vw-california', name: 'VW California', make: 'Volkswagen', base: 'T6.1 California', height: 1.99, width: 1.90, length: 4.90, weight: 3.0, fuelConsumption: 9.5 },
  { id: 'ford-nugget', name: 'Ford Nugget', make: 'Ford', base: 'Transit Custom', height: 2.09, width: 1.99, length: 4.97, weight: 3.1, fuelConsumption: 8.0 },
  { id: 'mercedes-marco-polo', name: 'Mercedes Marco Polo', make: 'Mercedes-Benz', base: 'V-Class', height: 2.00, width: 1.93, length: 5.14, weight: 3.1, fuelConsumption: 9.5 },

  // Medium Motorhomes (Based on Ducato/Sprinter)
  { id: 'hymer-camper-van', name: 'Hymer Camper Van', make: 'Hymer', base: 'Fiat Ducato L2H2', height: 2.65, width: 2.05, length: 5.99, weight: 3.5, fuelConsumption: 12.0 },
  { id: 'adria-twin', name: 'Adria Twin', make: 'Adria', base: 'Fiat Ducato L2H2', height: 2.58, width: 2.05, length: 5.99, weight: 3.3, fuelConsumption: 11.5 },
  { id: 'possl-summit', name: 'Pössl Summit', make: 'Pössl', base: 'Fiat Ducato L3H2', height: 2.65, width: 2.05, length: 6.36, weight: 3.5, fuelConsumption: 12.5 },

  // Large Motorhomes (Class A/Coachbuilt)
  { id: 'hymer-b-class', name: 'Hymer B-Class', make: 'Hymer', base: 'Mercedes Sprinter', height: 2.95, width: 2.30, length: 7.49, weight: 4.5, fuelConsumption: 15.0 },
  { id: 'burstner-elegance', name: 'Bürstner Elegance', make: 'Bürstner', base: 'Fiat Ducato', height: 2.96, width: 2.32, length: 7.42, weight: 4.4, fuelConsumption: 14.5 },
  { id: 'carthago-c-tourer', name: 'Carthago C-Tourer', make: 'Carthago', base: 'Fiat Ducato', height: 2.90, width: 2.30, length: 6.99, weight: 4.0, fuelConsumption: 14.0 },

  // Car + Caravan combinations
  { id: 'car-small-caravan', name: 'Car + Small Caravan', make: 'Various', base: '2-berth caravan', height: 2.60, width: 2.30, length: 10.0, weight: 3.5, fuelConsumption: 10.0 },
  { id: 'car-medium-caravan', name: 'Car + Medium Caravan', make: 'Various', base: '4-berth caravan', height: 2.65, width: 2.30, length: 12.0, weight: 4.0, fuelConsumption: 11.5 },
  { id: 'car-large-caravan', name: 'Car + Large Caravan', make: 'Various', base: 'Twin-axle caravan', height: 2.70, width: 2.50, length: 14.0, weight: 5.0, fuelConsumption: 13.0 },
];

// Helper function to get all makes
export function getAllMakes(): VehicleMake[] {
  return VEHICLE_DATABASE;
}

// Helper function to get models for a make
export function getModelsForMake(makeId: string): VehicleModel[] {
  const make = VEHICLE_DATABASE.find(m => m.id === makeId);
  return make?.models || [];
}

// Helper function to get variants for a model
export function getVariantsForModel(makeId: string, modelId: string): VehicleVariant[] {
  const make = VEHICLE_DATABASE.find(m => m.id === makeId);
  const model = make?.models.find(m => m.id === modelId);
  return model?.variants || [];
}

// Helper function to find a specific variant
export function findVariant(makeId: string, modelId: string, variantId: string): VehicleVariant | undefined {
  return getVariantsForModel(makeId, modelId).find(v => v.id === variantId);
}
