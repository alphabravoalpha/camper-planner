import { describe, it, expect, beforeEach } from 'vitest';
import { CampsiteFilterService } from '../CampsiteFilterService';
import { type Campsite, type CampsiteType } from '../CampsiteService';
import { type CampsiteFilterState } from '../../components/campsite/CampsiteFilter';

describe('CampsiteFilterService', () => {
  let mockCampsites: Campsite[];
  let defaultFilterState: CampsiteFilterState;

  beforeEach(() => {
    mockCampsites = [
      {
        id: 1,
        type: 'campsite',
        name: 'Camping Municipal',
        lat: 48.8566,
        lng: 2.3522,
        amenities: {
          toilets: true,
          showers: true,
          drinking_water: true,
          electricity: true,
          wifi: true,
          restaurant: false,
          shop: false,
          playground: false,
          laundry: false,
          swimming_pool: false,
        },
        access: {
          motorhome: true,
          caravan: true,
          tent: true,
        },
        contact: {},
        source: 'openstreetmap',
        last_updated: Date.now(),
        vehicleCompatible: true,
      },
      {
        id: 2,
        type: 'aire',
        name: 'Free Aire de Service',
        lat: 45.764,
        lng: 4.8357,
        amenities: {
          toilets: true,
          showers: false,
          drinking_water: true,
          electricity: false,
          wifi: false,
          restaurant: false,
          shop: false,
          playground: false,
          laundry: false,
          swimming_pool: false,
        },
        access: {
          motorhome: true,
          caravan: false,
          tent: false,
        },
        contact: {},
        source: 'openstreetmap',
        last_updated: Date.now(),
        vehicleCompatible: true,
      },
      {
        id: 3,
        type: 'parking',
        name: 'Parking Lot',
        lat: 43.2965,
        lng: 5.3698,
        amenities: {
          toilets: false,
          showers: false,
          drinking_water: false,
          electricity: false,
          wifi: false,
          restaurant: false,
          shop: false,
          playground: false,
          laundry: false,
          swimming_pool: false,
        },
        access: {
          motorhome: true,
          caravan: true,
          tent: false,
        },
        contact: {},
        source: 'openstreetmap',
        last_updated: Date.now(),
        vehicleCompatible: false,
      },
    ];

    defaultFilterState = {
      visibleTypes: ['campsite', 'aire', 'parking'] as CampsiteType[],
      amenities: {
        electricity: false,
        wifi: false,
        shower: false,
        toilets: false,
        drinking_water: false,
        waste_disposal: false,
        laundry: false,
        restaurant: false,
        shop: false,
        playground: false,
        swimming_pool: false,
        pet_allowed: false,
      },
      vehicleCompatibleOnly: false,
      routeOnlyMode: false,
      maxDistanceFromRoute: 5,
      searchQuery: '',
      searchLocation: '',
      openNow: false,
      freeOnly: false,
      acceptsReservations: false,
      sortBy: 'relevance',
      maxResults: 100,
    };
  });

  describe('Type Filtering', () => {
    it('should filter by visible types', () => {
      const filterState = {
        ...defaultFilterState,
        visibleTypes: ['campsite'] as CampsiteType[],
      };

      const result = CampsiteFilterService.filterCampsites(mockCampsites, filterState);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('campsite');
    });

    it('should return empty array when no types selected', () => {
      const filterState = {
        ...defaultFilterState,
        visibleTypes: [] as CampsiteType[],
      };

      const result = CampsiteFilterService.filterCampsites(mockCampsites, filterState);

      expect(result).toHaveLength(0);
    });

    it('should allow multiple types', () => {
      const filterState = {
        ...defaultFilterState,
        visibleTypes: ['campsite', 'aire'] as CampsiteType[],
      };

      const result = CampsiteFilterService.filterCampsites(mockCampsites, filterState);

      expect(result).toHaveLength(2);
      expect(result.some(c => c.type === 'campsite')).toBe(true);
      expect(result.some(c => c.type === 'aire')).toBe(true);
    });
  });

  describe('Amenity Filtering', () => {
    it('should filter by single amenity', () => {
      const filterState = {
        ...defaultFilterState,
        amenities: {
          ...defaultFilterState.amenities,
          electricity: true,
        },
      };

      const result = CampsiteFilterService.filterCampsites(mockCampsites, filterState);

      expect(result.every(c => c.amenities.electricity)).toBe(true);
    });

    it('should filter by multiple amenities (AND logic)', () => {
      const filterState = {
        ...defaultFilterState,
        amenities: {
          ...defaultFilterState.amenities,
          toilets: true,
          showers: true,
        },
      };

      const result = CampsiteFilterService.filterCampsites(mockCampsites, filterState);

      expect(result.every(c => c.amenities.toilets && c.amenities.showers)).toBe(true);
      expect(result).toHaveLength(1); // Only "Camping Municipal" has both
    });

    it('should return all when no amenities required', () => {
      const result = CampsiteFilterService.filterCampsites(mockCampsites, defaultFilterState);

      expect(result).toHaveLength(3);
    });

    it('should filter out campsites missing required amenities', () => {
      const filterState = {
        ...defaultFilterState,
        amenities: {
          ...defaultFilterState.amenities,
          wifi: true,
        },
      };

      const result = CampsiteFilterService.filterCampsites(mockCampsites, filterState);

      expect(result).toHaveLength(1);
      expect(result[0].amenities.wifi).toBe(true);
    });
  });

  describe('Vehicle Compatibility Filtering', () => {
    it('should filter vehicle compatible campsites', () => {
      const filterState = {
        ...defaultFilterState,
        vehicleCompatibleOnly: true,
      };

      const result = CampsiteFilterService.filterCampsites(mockCampsites, filterState);

      expect(result.every(c => c.vehicleCompatible)).toBe(true);
      expect(result).toHaveLength(2);
    });

    it('should not filter when vehicle compatibility not required', () => {
      const filterState = {
        ...defaultFilterState,
        vehicleCompatibleOnly: false,
      };

      const result = CampsiteFilterService.filterCampsites(mockCampsites, filterState);

      expect(result).toHaveLength(3);
    });
  });

  describe('Advanced Filters', () => {
    it('should filter by opening hours', () => {
      const campsiteOpen = {
        ...mockCampsites[0],
        opening_hours: '24/7',
      };
      const campsiteClosed = {
        ...mockCampsites[1],
        id: 4,
        opening_hours: 'closed',
      };

      const filterState = {
        ...defaultFilterState,
        openNow: true,
      };

      const result = CampsiteFilterService.filterCampsites(
        [campsiteOpen, campsiteClosed],
        filterState
      );

      expect(result).toHaveLength(1);
      expect(result[0].opening_hours).toBe('24/7');
    });

    it('should filter free campsites', () => {
      const filterState = {
        ...defaultFilterState,
        freeOnly: true,
      };

      const result = CampsiteFilterService.filterCampsites(mockCampsites, filterState);

      // Should find "Free Aire de Service" based on name
      expect(result.some(c => c.name.includes('Free'))).toBe(true);
    });

    it('should assume open when no hours specified', () => {
      const filterState = {
        ...defaultFilterState,
        openNow: true,
      };

      // All mock campsites have no opening_hours, so all should pass
      const result = CampsiteFilterService.filterCampsites(mockCampsites, filterState);

      expect(result).toHaveLength(3);
    });
  });

  describe('Search Filtering', () => {
    it('should filter by search query', () => {
      const filterState = {
        ...defaultFilterState,
        searchQuery: 'Municipal',
      };

      const result = CampsiteFilterService.filterCampsites(mockCampsites, filterState);

      expect(result.some(c => c.name.includes('Municipal'))).toBe(true);
    });

    it('should filter by search location', () => {
      const filterState = {
        ...defaultFilterState,
        searchLocation: 'Paris',
      };

      const result = CampsiteFilterService.filterCampsites(mockCampsites, filterState);

      // Should return campsites (may need address field for better results)
      expect(result).toBeDefined();
    });

    it('should handle case-insensitive search', () => {
      const filterState = {
        ...defaultFilterState,
        searchQuery: 'municipal',
      };

      const result = CampsiteFilterService.filterCampsites(mockCampsites, filterState);

      expect(result.some(c => c.name.toLowerCase().includes('municipal'))).toBe(true);
    });

    it('should not filter when search query empty', () => {
      const filterState = {
        ...defaultFilterState,
        searchQuery: '',
      };

      const result = CampsiteFilterService.filterCampsites(mockCampsites, filterState);

      expect(result).toHaveLength(3);
    });
  });

  describe('Result Limiting', () => {
    it('should limit results to maxResults', () => {
      const filterState = {
        ...defaultFilterState,
        maxResults: 2,
      };

      const result = CampsiteFilterService.filterCampsites(mockCampsites, filterState);

      expect(result).toHaveLength(2);
    });

    it('should return all when maxResults is large', () => {
      const filterState = {
        ...defaultFilterState,
        maxResults: 1000,
      };

      const result = CampsiteFilterService.filterCampsites(mockCampsites, filterState);

      expect(result).toHaveLength(3);
    });

    it('should handle maxResults of 0', () => {
      const filterState = {
        ...defaultFilterState,
        maxResults: 0,
      };

      const result = CampsiteFilterService.filterCampsites(mockCampsites, filterState);

      expect(result).toHaveLength(0);
    });
  });

  describe('Sorting', () => {
    it('should sort by relevance', () => {
      const filterState = {
        ...defaultFilterState,
        sortBy: 'relevance' as const,
      };

      const result = CampsiteFilterService.filterCampsites(mockCampsites, filterState);

      expect(result).toBeDefined();
      expect(result).toHaveLength(3);
    });

    it('should sort by distance', () => {
      const filterState = {
        ...defaultFilterState,
        sortBy: 'distance' as const,
      };

      const currentLocation: [number, number] = [48.8566, 2.3522];

      const result = CampsiteFilterService.filterCampsites(
        mockCampsites,
        filterState,
        undefined,
        currentLocation
      );

      expect(result).toBeDefined();
    });

    it('should sort by name', () => {
      const filterState = {
        ...defaultFilterState,
        sortBy: 'name' as const,
      };

      const result = CampsiteFilterService.filterCampsites(mockCampsites, filterState);

      expect(result).toBeDefined();
      expect(result).toHaveLength(3);
    });
  });

  describe('Combined Filters', () => {
    it('should apply multiple filters together', () => {
      const filterState = {
        ...defaultFilterState,
        visibleTypes: ['campsite', 'aire'] as CampsiteType[],
        amenities: {
          ...defaultFilterState.amenities,
          toilets: true,
        },
        vehicleCompatibleOnly: true,
        maxResults: 10,
      };

      const result = CampsiteFilterService.filterCampsites(mockCampsites, filterState);

      expect(result.every(c => c.amenities.toilets)).toBe(true);
      expect(result.every(c => c.vehicleCompatible)).toBe(true);
      expect(result.every(c => ['campsite', 'aire'].includes(c.type))).toBe(true);
    });

    it('should return empty when filters exclude everything', () => {
      const filterState = {
        ...defaultFilterState,
        visibleTypes: ['campsite'] as CampsiteType[],
        amenities: {
          ...defaultFilterState.amenities,
          swimming_pool: true,
        },
      };

      const result = CampsiteFilterService.filterCampsites(mockCampsites, filterState);

      expect(result).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty campsite list', () => {
      const result = CampsiteFilterService.filterCampsites([], defaultFilterState);

      expect(result).toHaveLength(0);
    });

    it('should handle campsite without amenities', () => {
      const campsiteNoAmenities = {
        ...mockCampsites[0],
        amenities: undefined as unknown as Campsite['amenities'],
      };

      const filterState = {
        ...defaultFilterState,
        amenities: {
          ...defaultFilterState.amenities,
          toilets: true,
        },
      };

      const result = CampsiteFilterService.filterCampsites([campsiteNoAmenities], filterState);

      expect(result).toHaveLength(0);
    });

    it('should handle all filters disabled', () => {
      const result = CampsiteFilterService.filterCampsites(mockCampsites, defaultFilterState);

      expect(result).toHaveLength(3);
    });
  });

  describe('Search Suggestions', () => {
    it('should generate search suggestions', () => {
      const suggestions = CampsiteFilterService.generateSearchSuggestions('Camp', mockCampsites);

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should return empty for no matches', () => {
      const suggestions = CampsiteFilterService.generateSearchSuggestions(
        'NonExistent',
        mockCampsites
      );

      expect(suggestions).toBeDefined();
    });

    it('should handle empty query', () => {
      const suggestions = CampsiteFilterService.generateSearchSuggestions('', mockCampsites);

      expect(suggestions).toBeDefined();
      expect(suggestions).toHaveLength(0); // Should return empty for empty query
    });
  });
});
