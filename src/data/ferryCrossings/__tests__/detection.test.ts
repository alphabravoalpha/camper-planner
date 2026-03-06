import { describe, it, expect } from 'vitest';
import {
  detectFerryCrossings,
  needsFerryCrossing,
  rankCrossingsForSegment,
  ALL_FERRY_CROSSINGS,
} from '../index';

describe('detectFerryCrossings', () => {
  describe('mandatory crossings', () => {
    it('detects Channel crossing for London → Paris', () => {
      const result = detectFerryCrossings(
        { lat: 51.5074, lng: -0.1278 }, // London
        { lat: 48.8566, lng: 2.3522 } // Paris
      );
      expect(result.mandatory.length).toBe(1);
      expect(result.mandatory[0].segment).toEqual(['gb-mainland', 'europe-mainland']);
      expect(result.mandatory[0].crossings.length).toBeGreaterThan(0);
      expect(result.mandatory[0].recommended).toBeDefined();
    });

    it('detects mandatory crossing for Dublin → Paris', () => {
      const result = detectFerryCrossings(
        { lat: 53.3498, lng: -6.2603 }, // Dublin
        { lat: 48.8566, lng: 2.3522 } // Paris
      );
      expect(result.mandatory.length).toBeGreaterThanOrEqual(1);
    });

    it('detects two mandatory crossings for London → Bastia (Corsica)', () => {
      const result = detectFerryCrossings(
        { lat: 51.5074, lng: -0.1278 }, // London
        { lat: 42.6973, lng: 9.4509 } // Bastia
      );
      expect(result.mandatory.length).toBe(2);
    });

    it('detects mandatory crossing for Marseille → Bastia', () => {
      const result = detectFerryCrossings(
        { lat: 43.2965, lng: 5.3698 }, // Marseille
        { lat: 42.6973, lng: 9.4509 } // Bastia
      );
      expect(result.mandatory.length).toBe(1);
      expect(result.mandatory[0].segment).toEqual(
        expect.arrayContaining(['europe-mainland', 'corsica'])
      );
    });

    it('detects mandatory crossing for Barcelona → Palma', () => {
      const result = detectFerryCrossings(
        { lat: 41.3874, lng: 2.1686 }, // Barcelona
        { lat: 39.5696, lng: 2.6502 } // Palma
      );
      expect(result.mandatory.length).toBe(1);
    });
  });

  describe('no crossings needed', () => {
    it('returns empty for Paris → Berlin', () => {
      const result = detectFerryCrossings(
        { lat: 48.8566, lng: 2.3522 },
        { lat: 52.52, lng: 13.405 }
      );
      expect(result.mandatory.length).toBe(0);
    });

    it('returns empty for Stockholm → Oslo (road-connected)', () => {
      const result = detectFerryCrossings(
        { lat: 59.3293, lng: 18.0686 },
        { lat: 59.9139, lng: 10.7522 }
      );
      expect(result.mandatory.length).toBe(0);
    });

    it('returns empty for Berlin → Rome (road-connected via Sicily graph)', () => {
      const result = detectFerryCrossings(
        { lat: 52.52, lng: 13.405 },
        { lat: 41.9028, lng: 12.4964 }
      );
      expect(result.mandatory.length).toBe(0);
    });
  });

  describe('optional crossings', () => {
    it('suggests ferries for Hamburg → Stockholm corridor', () => {
      const result = detectFerryCrossings(
        { lat: 53.5511, lng: 9.9937 }, // Hamburg
        { lat: 59.3293, lng: 18.0686 } // Stockholm
      );
      expect(result.mandatory.length).toBe(0);
      expect(result.optional.length).toBeGreaterThan(0);
      expect(result.optional[0].estimatedSavingsKm).toBeGreaterThan(0);
    });

    it('returns no mandatory for Lyon → Barcelona', () => {
      const result = detectFerryCrossings(
        { lat: 45.764, lng: 4.8357 }, // Lyon
        { lat: 41.3874, lng: 2.1686 } // Barcelona
      );
      expect(result.mandatory.length).toBe(0);
    });
  });
});

describe('needsFerryCrossing', () => {
  it('returns true for London → Paris', () => {
    expect(needsFerryCrossing(51.5074, -0.1278, 48.8566, 2.3522)).toBe(true);
  });

  it('returns false for Paris → Berlin', () => {
    expect(needsFerryCrossing(48.8566, 2.3522, 52.52, 13.405)).toBe(false);
  });
});

describe('rankCrossingsForSegment', () => {
  it('ranks Dover-Calais highest for London → Paris', () => {
    const channelCrossings = ALL_FERRY_CROSSINGS.filter(c => c.region === 'english-channel');
    const ranked = rankCrossingsForSegment(
      channelCrossings,
      51.5074,
      -0.1278, // London
      48.8566,
      2.3522 // Paris
    );
    // Dover/Folkestone should rank highest for London→Paris
    expect(ranked[0].id).toMatch(/dover|eurotunnel/);
  });
});

describe('ALL_FERRY_CROSSINGS', () => {
  it('has no duplicate IDs', () => {
    const ids = ALL_FERRY_CROSSINGS.map(c => c.id);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
  });

  it('has valid coordinates for all terminals', () => {
    for (const crossing of ALL_FERRY_CROSSINGS) {
      expect(crossing.departure.lat).toBeGreaterThan(-90);
      expect(crossing.departure.lat).toBeLessThan(90);
      expect(crossing.departure.lng).toBeGreaterThan(-180);
      expect(crossing.departure.lng).toBeLessThan(180);
      expect(crossing.arrival.lat).toBeGreaterThan(-90);
      expect(crossing.arrival.lat).toBeLessThan(90);
      expect(crossing.arrival.lng).toBeGreaterThan(-180);
      expect(crossing.arrival.lng).toBeLessThan(180);
    }
  });

  it('has positive duration for all crossings', () => {
    for (const crossing of ALL_FERRY_CROSSINGS) {
      expect(crossing.duration).toBeGreaterThan(0);
    }
  });

  it('contains 85+ crossings across all regions', () => {
    expect(ALL_FERRY_CROSSINGS.length).toBeGreaterThanOrEqual(85);
  });
});
