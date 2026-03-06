import { describe, it, expect } from 'vitest';
import {
  classifyLandmass,
  areLandmassesConnected,
  pointInPolygon,
  haversineDistance,
} from '../landmasses';

describe('pointInPolygon', () => {
  const square: [number, number][] = [
    [0, 0],
    [0, 10],
    [10, 10],
    [10, 0],
    [0, 0],
  ];

  it('returns true for point inside', () => {
    expect(pointInPolygon(5, 5, square)).toBe(true);
  });

  it('returns false for point outside', () => {
    expect(pointInPolygon(15, 5, square)).toBe(false);
  });
});

describe('classifyLandmass', () => {
  it('classifies London as gb-mainland', () => {
    expect(classifyLandmass(51.5074, -0.1278)).toBe('gb-mainland');
  });

  it('classifies Edinburgh as gb-mainland', () => {
    expect(classifyLandmass(55.9533, -3.1883)).toBe('gb-mainland');
  });

  it('classifies Dublin as ireland', () => {
    expect(classifyLandmass(53.3498, -6.2603)).toBe('ireland');
  });

  it('classifies Cork as ireland', () => {
    expect(classifyLandmass(51.8969, -8.4863)).toBe('ireland');
  });

  it('classifies Paris as europe-mainland', () => {
    expect(classifyLandmass(48.8566, 2.3522)).toBe('europe-mainland');
  });

  it('classifies Berlin as europe-mainland', () => {
    expect(classifyLandmass(52.52, 13.405)).toBe('europe-mainland');
  });

  it('classifies Stockholm as scandinavia', () => {
    expect(classifyLandmass(59.3293, 18.0686)).toBe('scandinavia');
  });

  it('classifies Oslo as scandinavia', () => {
    expect(classifyLandmass(59.9139, 10.7522)).toBe('scandinavia');
  });

  it('classifies Bastia as corsica', () => {
    expect(classifyLandmass(42.6973, 9.4509)).toBe('corsica');
  });

  it('classifies Olbia as sardinia', () => {
    expect(classifyLandmass(40.9157, 9.5017)).toBe('sardinia');
  });

  it('classifies Palermo as sicily', () => {
    expect(classifyLandmass(38.1157, 13.3615)).toBe('sicily');
  });

  it('classifies Palma as balearics-mallorca', () => {
    expect(classifyLandmass(39.5696, 2.6502)).toBe('balearics-mallorca');
  });

  it('classifies Heraklion as crete', () => {
    expect(classifyLandmass(35.3387, 25.1442)).toBe('crete');
  });

  it('classifies Kirkwall as orkney', () => {
    expect(classifyLandmass(58.981, -2.96)).toBe('orkney');
  });

  it('classifies Lerwick as shetland', () => {
    expect(classifyLandmass(60.155, -1.145)).toBe('shetland');
  });

  it('classifies Tangier as morocco', () => {
    expect(classifyLandmass(35.7595, -5.834)).toBe('morocco');
  });

  it('returns null for mid-ocean point', () => {
    expect(classifyLandmass(45.0, -20.0)).toBeNull();
  });

  // Priority: islands before continents
  it('classifies Corsica point as corsica, not europe-mainland', () => {
    expect(classifyLandmass(42.15, 9.1)).toBe('corsica');
  });

  it('classifies Sardinia point as sardinia, not europe-mainland', () => {
    expect(classifyLandmass(40.0, 9.0)).toBe('sardinia');
  });
});

describe('areLandmassesConnected', () => {
  it('same landmass is connected', () => {
    expect(areLandmassesConnected('gb-mainland', 'gb-mainland')).toBe(true);
  });

  it('europe-mainland and scandinavia are connected (bridges)', () => {
    expect(areLandmassesConnected('europe-mainland', 'scandinavia')).toBe(true);
  });

  it('scandinavia and sicily are connected (via europe-mainland)', () => {
    expect(areLandmassesConnected('scandinavia', 'sicily')).toBe(true);
  });

  it('gb-mainland and europe-mainland are NOT connected', () => {
    expect(areLandmassesConnected('gb-mainland', 'europe-mainland')).toBe(false);
  });

  it('gb-mainland and ireland are NOT connected', () => {
    expect(areLandmassesConnected('gb-mainland', 'ireland')).toBe(false);
  });

  it('corsica and europe-mainland are NOT connected', () => {
    expect(areLandmassesConnected('corsica', 'europe-mainland')).toBe(false);
  });

  it('sardinia and europe-mainland are NOT connected', () => {
    expect(areLandmassesConnected('sardinia', 'europe-mainland')).toBe(false);
  });
});

describe('haversineDistance', () => {
  it('returns ~0 for same point', () => {
    expect(haversineDistance(51.5, -0.1, 51.5, -0.1)).toBeCloseTo(0, 0);
  });

  it('London to Paris is ~340 km', () => {
    const d = haversineDistance(51.5074, -0.1278, 48.8566, 2.3522);
    expect(d).toBeGreaterThan(330);
    expect(d).toBeLessThan(350);
  });

  it('Dover to Calais is ~40 km', () => {
    const d = haversineDistance(51.1279, 1.3134, 50.9513, 1.8587);
    expect(d).toBeGreaterThan(35);
    expect(d).toBeLessThan(50);
  });
});
