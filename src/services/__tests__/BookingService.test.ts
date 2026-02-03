import { describe, it, expect, beforeEach, vi } from 'vitest';
import BookingService, { type BookingSearchOptions } from '../BookingService';
import { type Campsite } from '../CampsiteService';

// Mock environment variables
vi.stubGlobal('import', {
  meta: {
    env: {
      VITE_BOOKING_AFFILIATE_ID: 'test-booking-123',
      VITE_PITCHUP_AFFILIATE_ID: 'test-pitchup-456',
      VITE_ACSI_AFFILIATE_CODE: 'test-acsi-789',
    },
  },
});

describe('BookingService', () => {
  let service: BookingService;
  let mockCampsite: Campsite;

  beforeEach(() => {
    service = new BookingService();

    mockCampsite = {
      id: 12345,
      type: 'campsite',
      name: 'Test Campsite',
      lat: 48.8566,
      lng: 2.3522,
      amenities: {
        toilets: true,
        showers: true,
        drinking_water: true,
        electricity: true,
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
        tent: true,
      },
      contact: {},
      source: 'openstreetmap',
      last_updated: Date.now(),
      address: 'Paris, France',
    };
  });

  describe('Provider Management', () => {
    it('should return all providers', () => {
      const providers = service.getProviders();

      expect(providers).toHaveLength(3);
      expect(providers.some(p => p.id === 'booking')).toBe(true);
      expect(providers.some(p => p.id === 'pitchup')).toBe(true);
      expect(providers.some(p => p.id === 'acsi')).toBe(true);
    });

    it('should return enabled providers only', () => {
      const enabledProviders = service.getEnabledProviders();

      // All should be enabled since we mocked the env vars
      expect(enabledProviders.length).toBeGreaterThan(0);
      enabledProviders.forEach(provider => {
        expect(provider.enabled).toBe(true);
      });
    });

    it('should get provider by ID', () => {
      const booking = service.getProvider('booking');

      expect(booking).toBeDefined();
      expect(booking?.id).toBe('booking');
      expect(booking?.name).toBe('Booking.com');
    });

    it('should return null for unknown provider', () => {
      const unknown = service.getProvider('unknown-provider');

      expect(unknown).toBeNull();
    });

    it('should have correct provider details', () => {
      const pitchup = service.getProvider('pitchup');

      expect(pitchup?.name).toBe('Pitchup');
      expect(pitchup?.baseUrl).toBe('https://www.pitchup.com');
      expect(pitchup?.searchCapabilities.campsiteTypeFilter).toBe(true);
      expect(pitchup?.searchCapabilities.amenityFilter).toBe(true);
    });
  });

  describe('Booking Link Generation', () => {
    it('should generate links for all enabled providers', () => {
      const links = service.generateBookingLinks(mockCampsite);

      expect(links.length).toBeGreaterThan(0);
      links.forEach(link => {
        expect(link.url).toBeDefined();
        expect(link.provider).toBeDefined();
        expect(link.searchParams).toBeDefined();
        expect(link.description).toBeDefined();
      });
    });

    it('should include campsite location in search params', () => {
      const links = service.generateBookingLinks(mockCampsite);

      links.forEach(link => {
        expect(link.searchParams.lat).toBe('48.8566');
        expect(link.searchParams.lng).toBe('2.3522');
      });
    });

    it('should include check-in and check-out dates when provided', () => {
      const checkIn = new Date('2025-07-01');
      const checkOut = new Date('2025-07-07');

      const options: BookingSearchOptions = {
        checkIn,
        checkOut,
      };

      const links = service.generateBookingLinks(mockCampsite, options);
      const bookingLink = links.find(l => l.provider.id === 'booking');

      expect(bookingLink?.searchParams.checkin).toBe('2025-07-01');
      expect(bookingLink?.searchParams.checkout).toBe('2025-07-07');
    });

    it('should include number of guests when provided', () => {
      const options: BookingSearchOptions = {
        guests: 4,
      };

      const links = service.generateBookingLinks(mockCampsite, options);
      const bookingLink = links.find(l => l.provider.id === 'booking');

      expect(bookingLink?.searchParams.group_adults).toBe('4');
    });

    it('should include vehicle type when provided', () => {
      const options: BookingSearchOptions = {
        vehicleType: 'motorhome',
      };

      const links = service.generateBookingLinks(mockCampsite, options);
      const pitchupLink = links.find(l => l.provider.id === 'pitchup');

      expect(pitchupLink?.searchParams.accommodation_type).toBe('motorhome');
    });

    it('should generate valid URLs', () => {
      const links = service.generateBookingLinks(mockCampsite);

      links.forEach(link => {
        expect(() => new URL(link.url)).not.toThrow();
        expect(link.url).toMatch(/^https:\/\//);
      });
    });

    it('should include affiliate parameters', () => {
      const links = service.generateBookingLinks(mockCampsite);

      const bookingLink = links.find(l => l.provider.id === 'booking');
      expect(bookingLink?.url).toContain('utm_source=camper-planner');

      const pitchupLink = links.find(l => l.provider.id === 'pitchup');
      expect(pitchupLink?.url).toContain('utm_source=camper-planner');
    });

    it('should generate description with location', () => {
      const links = service.generateBookingLinks(mockCampsite);

      links.forEach(link => {
        expect(link.description).toContain('Test Campsite');
        expect(link.description).toMatch(/Search .* for camping near/);
      });
    });

    it('should include dates in description when provided', () => {
      const checkIn = new Date('2025-07-01');
      const checkOut = new Date('2025-07-07');

      const options: BookingSearchOptions = {
        checkIn,
        checkOut,
      };

      const links = service.generateBookingLinks(mockCampsite, options);

      links.forEach(link => {
        expect(link.description).toMatch(/for \d+\/\d+\/\d+ - \d+\/\d+\/\d+/);
      });
    });

    it('should use address if name not available', () => {
      const campsiteWithoutName = {
        ...mockCampsite,
        name: '',
      };

      const links = service.generateBookingLinks(campsiteWithoutName);
      const bookingLink = links.find(l => l.provider.id === 'booking');

      expect(bookingLink?.searchParams.ss).toBe('Paris, France');
    });
  });

  describe('Provider-Specific URLs', () => {
    it('should generate correct Booking.com URL', () => {
      const link = service.generateProviderLink(
        service.getProvider('booking')!,
        mockCampsite
      );

      expect(link).toContain('https://www.booking.com/searchresults.html');
      expect(link).toContain('accommodation_type=camping');
    });

    it('should generate correct Pitchup URL', () => {
      const link = service.generateProviderLink(
        service.getProvider('pitchup')!,
        mockCampsite
      );

      expect(link).toContain('https://www.pitchup.com/search');
    });

    it('should generate correct ACSI URL', () => {
      const link = service.generateProviderLink(
        service.getProvider('acsi')!,
        mockCampsite
      );

      expect(link).toContain('https://www.acsi.eu/en/search-and-book');
      expect(link).toContain('lon=2.3522'); // ACSI uses 'lon' not 'lng'
    });

    it('should return null for disabled provider', () => {
      const disabledProvider = {
        ...service.getProvider('booking')!,
        enabled: false,
      };

      const link = service.generateProviderLink(disabledProvider, mockCampsite);

      expect(link).toBeNull();
    });
  });

  describe('Search Parameters', () => {
    it('should format dates correctly', () => {
      const checkIn = new Date('2025-07-01T12:00:00Z');
      const checkOut = new Date('2025-07-07T12:00:00Z');

      const options: BookingSearchOptions = {
        checkIn,
        checkOut,
      };

      const links = service.generateBookingLinks(mockCampsite, options);
      const bookingLink = links.find(l => l.provider.id === 'booking');

      expect(bookingLink?.searchParams.checkin).toBe('2025-07-01');
      expect(bookingLink?.searchParams.checkout).toBe('2025-07-07');
    });

    it('should handle vehicle length option', () => {
      const options: BookingSearchOptions = {
        vehicleLength: 7.5,
      };

      const links = service.generateBookingLinks(mockCampsite, options);

      // Service should handle this gracefully even if not all providers support it
      expect(links.length).toBeGreaterThan(0);
    });

    it('should handle required amenities option', () => {
      const options: BookingSearchOptions = {
        requiredAmenities: ['wifi', 'electricity'],
      };

      const links = service.generateBookingLinks(mockCampsite, options);

      expect(links.length).toBeGreaterThan(0);
    });
  });

  describe('Provider Statistics', () => {
    it('should return provider stats', () => {
      const stats = service.getProviderStats();

      expect(stats.totalProviders).toBeGreaterThan(0);
      expect(stats.enabledProviders).toBeGreaterThanOrEqual(0);
      expect(stats.enabledProviders).toBeLessThanOrEqual(stats.totalProviders);
    });
  });

  describe('Edge Cases', () => {
    it('should handle campsite without name or address', () => {
      const minimalCampsite = {
        ...mockCampsite,
        name: '',
        address: undefined,
      };

      const links = service.generateBookingLinks(minimalCampsite);

      expect(links.length).toBeGreaterThan(0);
      links.forEach(link => {
        expect(link.description).toContain('this location');
      });
    });

    it('should handle empty booking options', () => {
      const links = service.generateBookingLinks(mockCampsite, {});

      expect(links.length).toBeGreaterThan(0);
    });

    it('should handle campsite with extreme coordinates', () => {
      const extremeCampsite = {
        ...mockCampsite,
        lat: 89.9,
        lng: 179.9,
      };

      const links = service.generateBookingLinks(extremeCampsite);

      links.forEach(link => {
        expect(link.searchParams.lat).toBe('89.9');
        expect(link.searchParams.lng).toBe('179.9');
      });
    });

    it('should handle same check-in and check-out dates', () => {
      const sameDate = new Date('2025-07-01');

      const options: BookingSearchOptions = {
        checkIn: sameDate,
        checkOut: sameDate,
      };

      const links = service.generateBookingLinks(mockCampsite, options);

      expect(links.length).toBeGreaterThan(0);
    });

    it('should handle zero guests', () => {
      const options: BookingSearchOptions = {
        guests: 0,
      };

      const links = service.generateBookingLinks(mockCampsite, options);
      const bookingLink = links.find(l => l.provider.id === 'booking');

      // Zero guests is falsy, so parameter won't be included
      expect(bookingLink?.searchParams.group_adults).toBeUndefined();
    });
  });
});
