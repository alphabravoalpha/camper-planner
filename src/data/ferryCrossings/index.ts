// European Ferry Crossings — Barrel Index
// Combines all regional data, provides detection and ranking functions

export type { FerryCrossing, FerryCrossingRegion, CrossingTerminal } from './types';
export { REGION_LABELS } from './types';

import { type FerryCrossing } from './types';
import {
  classifyLandmass,
  areLandmassesConnected,
  haversineDistance,
  LANDMASSES,
} from './landmasses';
export { classifyLandmass, haversineDistance } from './landmasses';

import { ENGLISH_CHANNEL_CROSSINGS } from './english-channel';
import { UK_WESTERN_CROSSINGS } from './uk-western';
import { UK_NORTHERN_CROSSINGS } from './uk-northern';
import { UK_SPAIN_CROSSINGS } from './uk-spain';
import { UK_IRELAND_CROSSINGS } from './uk-ireland';
import { IRELAND_FRANCE_CROSSINGS } from './ireland-france';
import { SCOTTISH_ISLANDS_CROSSINGS } from './scottish-islands';
import { SCANDINAVIA_BALTIC_CROSSINGS } from './scandinavia-baltic';
import { MEDITERRANEAN_WEST_CROSSINGS } from './mediterranean-west';
import { ADRIATIC_CROSSINGS } from './adriatic';
import { BALTIC_EAST_CROSSINGS } from './baltic-east';
import { NORTH_AFRICA_CROSSINGS } from './north-africa';

export const ALL_FERRY_CROSSINGS: FerryCrossing[] = [
  ...ENGLISH_CHANNEL_CROSSINGS,
  ...UK_WESTERN_CROSSINGS,
  ...UK_NORTHERN_CROSSINGS,
  ...UK_SPAIN_CROSSINGS,
  ...UK_IRELAND_CROSSINGS,
  ...IRELAND_FRANCE_CROSSINGS,
  ...SCOTTISH_ISLANDS_CROSSINGS,
  ...SCANDINAVIA_BALTIC_CROSSINGS,
  ...MEDITERRANEAN_WEST_CROSSINGS,
  ...ADRIATIC_CROSSINGS,
  ...BALTIC_EAST_CROSSINGS,
  ...NORTH_AFRICA_CROSSINGS,
];

/**
 * Get all crossings that connect two specific landmasses (in either direction).
 */
function getCrossingsForLandmassPair(landmassA: string, landmassB: string): FerryCrossing[] {
  return ALL_FERRY_CROSSINGS.filter(crossing => {
    const depLandmass = classifyLandmass(crossing.departure.lat, crossing.departure.lng);
    const arrLandmass = classifyLandmass(crossing.arrival.lat, crossing.arrival.lng);
    return (
      (depLandmass === landmassA && arrLandmass === landmassB) ||
      (depLandmass === landmassB && arrLandmass === landmassA)
    );
  });
}

/**
 * BFS to find a ferry path between two disconnected landmasses.
 * Returns an ordered list of landmass-pair segments that need crossings.
 * E.g. gb-mainland → corsica returns [['gb-mainland','europe-mainland'], ['europe-mainland','corsica']]
 */
function findFerryPath(startLandmass: string, endLandmass: string): [string, string][] | null {
  // Build a graph of which landmasses are ferry-reachable
  const ferryGraph = new Map<string, Set<string>>();
  for (const crossing of ALL_FERRY_CROSSINGS) {
    const dep = classifyLandmass(crossing.departure.lat, crossing.departure.lng);
    const arr = classifyLandmass(crossing.arrival.lat, crossing.arrival.lng);
    if (dep && arr && dep !== arr) {
      if (!ferryGraph.has(dep)) ferryGraph.set(dep, new Set());
      if (!ferryGraph.has(arr)) ferryGraph.set(arr, new Set());
      ferryGraph.get(dep)!.add(arr);
      ferryGraph.get(arr)!.add(dep);
    }
  }

  const allLandmassIds = LANDMASSES.map(l => l.id);
  for (const id of allLandmassIds) {
    if (!ferryGraph.has(id)) ferryGraph.set(id, new Set());
  }

  // Road-connected landmasses are treated as one "component" for BFS
  const roadComponent = (id: string): string => {
    if (['europe-mainland', 'scandinavia', 'sicily'].includes(id)) {
      return 'europe-mainland'; // canonical component
    }
    return id;
  };

  const startComponent = roadComponent(startLandmass);
  const endComponent = roadComponent(endLandmass);

  if (startComponent === endComponent) return []; // road-connected, no ferries

  // BFS on ferry graph between road components
  const visited = new Map<string, string | null>(); // component → previous component
  visited.set(startComponent, null);
  const queue: string[] = [startComponent];

  while (queue.length > 0) {
    const current = queue.shift()!;

    // Get all landmasses in this road component
    const componentMembers = allLandmassIds.filter(id => roadComponent(id) === current);

    // Find all ferry-reachable landmasses from any member
    for (const member of componentMembers) {
      const ferryNeighbors = ferryGraph.get(member) || new Set();
      for (const neighbor of ferryNeighbors) {
        const neighborComponent = roadComponent(neighbor);
        if (!visited.has(neighborComponent)) {
          visited.set(neighborComponent, current);
          if (neighborComponent === endComponent) {
            // Reconstruct path
            const path: [string, string][] = [];
            let curr: string | null = endComponent;
            while (curr && visited.get(curr) !== null) {
              const prev = visited.get(curr)!;
              path.unshift([prev, curr]);
              curr = prev;
            }
            // Convert component IDs back to specific landmass pairs
            return path.map(([fromComp, toComp]) => {
              const fromMembers = allLandmassIds.filter(id => roadComponent(id) === fromComp);
              const toMembers = allLandmassIds.filter(id => roadComponent(id) === toComp);
              // Find which specific pair has crossings
              for (const f of fromMembers) {
                for (const t of toMembers) {
                  if (getCrossingsForLandmassPair(f, t).length > 0) {
                    return [f, t] as [string, string];
                  }
                }
              }
              return [fromComp, toComp] as [string, string];
            });
          }
          queue.push(neighborComponent);
        }
      }
    }
  }

  return null; // No ferry path exists
}

/**
 * Rank crossings for a given segment by estimated total travel time.
 * Takes into account drive-to-port + crossing + drive-from-port.
 */
export function rankCrossingsForSegment(
  crossings: FerryCrossing[],
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): FerryCrossing[] {
  return [...crossings]
    .map(crossing => {
      // Try both directions and pick the one that makes geographic sense
      const d1 =
        haversineDistance(fromLat, fromLng, crossing.departure.lat, crossing.departure.lng) +
        haversineDistance(crossing.arrival.lat, crossing.arrival.lng, toLat, toLng);
      const d2 =
        haversineDistance(fromLat, fromLng, crossing.arrival.lat, crossing.arrival.lng) +
        haversineDistance(crossing.departure.lat, crossing.departure.lng, toLat, toLng);
      const driveDistance = Math.min(d1, d2);
      const totalTime = driveDistance / 80 + crossing.duration / 60; // hours
      return { crossing, totalTime };
    })
    .sort((a, b) => a.totalTime - b.totalTime)
    .map(({ crossing }) => crossing);
}

export interface DetectedCrossings {
  mandatory: {
    segment: [string, string]; // [fromLandmass, toLandmass]
    crossings: FerryCrossing[]; // ranked, best first
    recommended: FerryCrossing; // top pick
  }[];
  optional: {
    crossing: FerryCrossing;
    estimatedSavingsKm: number;
  }[];
}

/**
 * Main detection function. Given start and end coordinates, detect:
 * - Mandatory crossings (different disconnected landmasses)
 * - Optional crossings (ferry alternatives that save driving)
 */
export function detectFerryCrossings(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): DetectedCrossings {
  const startLandmass = classifyLandmass(start.lat, start.lng);
  const endLandmass = classifyLandmass(end.lat, end.lng);

  const result: DetectedCrossings = { mandatory: [], optional: [] };

  // If we can't classify either point, return empty (let ORS handle it)
  if (!startLandmass || !endLandmass) return result;

  // Check if mandatory crossings needed
  if (!areLandmassesConnected(startLandmass, endLandmass)) {
    const path = findFerryPath(startLandmass, endLandmass);
    if (path && path.length > 0) {
      for (const [fromLm, toLm] of path) {
        const crossings = getCrossingsForLandmassPair(fromLm, toLm);
        if (crossings.length > 0) {
          const ranked = rankCrossingsForSegment(crossings, start.lat, start.lng, end.lat, end.lng);
          result.mandatory.push({
            segment: [fromLm, toLm],
            crossings: ranked,
            recommended: ranked[0],
          });
        }
      }
    }
  }

  // Find optional crossings: ferries near the route corridor
  // that are not mandatory and could save significant driving
  const directDistance = haversineDistance(start.lat, start.lng, end.lat, end.lng);
  const corridorWidth = 200; // km from straight-line path

  const optionalCandidates = ALL_FERRY_CROSSINGS.filter(crossing => {
    if (crossing.mandatory) return false; // only non-mandatory routes

    // Skip if this crossing is already in the mandatory list
    if (result.mandatory.some(m => m.crossings.some(c => c.id === crossing.id))) return false;

    // Check if terminals are near the route corridor
    const depDist = distanceToLine(
      crossing.departure.lat,
      crossing.departure.lng,
      start.lat,
      start.lng,
      end.lat,
      end.lng
    );
    const arrDist = distanceToLine(
      crossing.arrival.lat,
      crossing.arrival.lng,
      start.lat,
      start.lng,
      end.lat,
      end.lng
    );

    if (depDist > corridorWidth || arrDist > corridorWidth) return false;

    // Check terminals are on the correct landmasses (or road-connected)
    const depLm = classifyLandmass(crossing.departure.lat, crossing.departure.lng);
    const arrLm = classifyLandmass(crossing.arrival.lat, crossing.arrival.lng);
    if (!depLm || !arrLm) return false;

    // At least one terminal should be on/connected to start landmass,
    // and the other on/connected to end landmass
    const depConnectedToStart =
      startLandmass === depLm || areLandmassesConnected(startLandmass, depLm);
    const arrConnectedToEnd = endLandmass === arrLm || areLandmassesConnected(endLandmass, arrLm);
    const depConnectedToEnd = endLandmass === depLm || areLandmassesConnected(endLandmass, depLm);
    const arrConnectedToStart =
      startLandmass === arrLm || areLandmassesConnected(startLandmass, arrLm);

    return (depConnectedToStart && arrConnectedToEnd) || (depConnectedToEnd && arrConnectedToStart);
  });

  for (const crossing of optionalCandidates) {
    // Estimate driving savings
    const viaFerryDistance = Math.min(
      haversineDistance(start.lat, start.lng, crossing.departure.lat, crossing.departure.lng) +
        haversineDistance(crossing.arrival.lat, crossing.arrival.lng, end.lat, end.lng),
      haversineDistance(start.lat, start.lng, crossing.arrival.lat, crossing.arrival.lng) +
        haversineDistance(crossing.departure.lat, crossing.departure.lng, end.lat, end.lng)
    );

    const savings = directDistance - viaFerryDistance;
    if (savings > 100) {
      // Only suggest if saves > 100km
      result.optional.push({
        crossing,
        estimatedSavingsKm: Math.round(savings),
      });
    }
  }

  // Sort optional by savings descending
  result.optional.sort((a, b) => b.estimatedSavingsKm - a.estimatedSavingsKm);

  return result;
}

/**
 * Approximate perpendicular distance from a point to a line segment (km).
 * Used for corridor checking.
 */
function distanceToLine(
  pointLat: number,
  pointLng: number,
  lineLat1: number,
  lineLng1: number,
  lineLat2: number,
  lineLng2: number
): number {
  const A = haversineDistance(lineLat1, lineLng1, pointLat, pointLng);
  const B = haversineDistance(lineLat2, lineLng2, pointLat, pointLng);
  const C = haversineDistance(lineLat1, lineLng1, lineLat2, lineLng2);

  if (C === 0) return A;

  // If the projection falls outside the segment, return distance to nearest endpoint
  const s = (A * A + C * C - B * B) / (2 * C);
  if (s < 0) return A;
  if (s > C) return B;

  // Perpendicular distance
  return Math.sqrt(Math.max(0, A * A - s * s));
}

/**
 * Backward-compatible wrapper. Returns true if any mandatory crossing detected.
 */
export function needsFerryCrossing(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): boolean {
  const result = detectFerryCrossings(
    { lat: startLat, lng: startLng },
    { lat: endLat, lng: endLng }
  );
  return result.mandatory.length > 0;
}
