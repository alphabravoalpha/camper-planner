// Booking Service
// Campsite booking integration with affiliate platforms

import { type Campsite } from './CampsiteService';

export interface BookingProvider {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  logoUrl?: string;
  commissionRate?: string;
  features: string[];
  searchCapabilities: {
    locationSearch: boolean;
    campsiteTypeFilter: boolean;
    amenityFilter: boolean;
    availabilityCheck: boolean;
  };
  enabled: boolean;
}

export interface BookingLink {
  provider: BookingProvider;
  url: string;
  searchParams: Record<string, string>;
  description: string;
}

export interface BookingSearchOptions {
  checkIn?: Date;
  checkOut?: Date;
  guests?: number;
  vehicleType?: 'motorhome' | 'caravan' | 'tent';
  vehicleLength?: number;
  requiredAmenities?: string[];
}

class BookingService {
  private providers: Record<string, BookingProvider> = {
    booking: {
      id: 'booking',
      name: 'Booking.com',
      description: "World's largest accommodation booking platform",
      baseUrl: 'https://www.booking.com',
      commissionRate: '3-5%',
      features: ['Instant booking', 'Free cancellation', 'Reviews', 'Mobile app'],
      searchCapabilities: {
        locationSearch: true,
        campsiteTypeFilter: true,
        amenityFilter: false,
        availabilityCheck: true,
      },
      enabled: !!import.meta.env.VITE_BOOKING_AFFILIATE_ID,
    },
    eurocampings: {
      id: 'eurocampings',
      name: 'Eurocampings',
      description: "Europe's largest campsite search and booking platform",
      baseUrl: 'https://www.eurocampings.co.uk',
      commissionRate: '3%',
      features: ['European focus', 'Campsite reviews', 'Detailed filters', 'Booking integration'],
      searchCapabilities: {
        locationSearch: true,
        campsiteTypeFilter: true,
        amenityFilter: true,
        availabilityCheck: true,
      },
      enabled: !!import.meta.env.VITE_EUROCAMPINGS_AFFILIATE_ID,
    },
    campinginfo: {
      id: 'campinginfo',
      name: 'camping.info',
      description: 'European campsite directory with online booking',
      baseUrl: 'https://www.camping.info',
      commissionRate: '5.8%',
      features: ['European directory', 'Online booking', 'Campsite ratings', 'Mobile app'],
      searchCapabilities: {
        locationSearch: true,
        campsiteTypeFilter: true,
        amenityFilter: true,
        availabilityCheck: true,
      },
      enabled: !!import.meta.env.VITE_CAMPINGINFO_AFFILIATE_ID,
    },
  };

  /**
   * Get all available booking providers
   */
  getProviders(): BookingProvider[] {
    return Object.values(this.providers);
  }

  /**
   * Get enabled booking providers only
   */
  getEnabledProviders(): BookingProvider[] {
    return Object.values(this.providers).filter(provider => provider.enabled);
  }

  /**
   * Get a specific provider by ID
   */
  getProvider(providerId: string): BookingProvider | null {
    return this.providers[providerId] || null;
  }

  /**
   * Generate booking links for a campsite
   */
  generateBookingLinks(campsite: Campsite, options: BookingSearchOptions = {}): BookingLink[] {
    const enabledProviders = this.getEnabledProviders();
    const links: BookingLink[] = [];

    enabledProviders.forEach(provider => {
      const url = this.generateProviderLink(provider, campsite, options);
      if (url) {
        links.push({
          provider,
          url,
          searchParams: this.getSearchParams(provider, campsite, options),
          description: this.getSearchDescription(provider, campsite, options),
        });
      }
    });

    return links;
  }

  /**
   * Generate a booking link for a specific provider
   */
  generateProviderLink(
    provider: BookingProvider,
    campsite: Campsite,
    options: BookingSearchOptions = {}
  ): string | null {
    if (!provider.enabled) return null;

    const baseParams = this.getAffiliateParams(provider.id);
    const searchParams = this.getSearchParams(provider, campsite, options);

    const allParams = { ...baseParams, ...searchParams };
    const params = new URLSearchParams(allParams);

    // Provider-specific URL paths
    const searchPath = this.getSearchPath(provider.id);
    return `${provider.baseUrl}${searchPath}?${params.toString()}`;
  }

  /**
   * Get affiliate tracking parameters for a provider
   */
  private getAffiliateParams(providerId: string): Record<string, string> {
    switch (providerId) {
      case 'booking':
        return {
          aid: import.meta.env.VITE_BOOKING_AFFILIATE_ID || '',
          label: 'camper-planner-search',
          utm_source: 'camper-planner',
          utm_medium: 'affiliate',
        };

      case 'eurocampings':
        return {
          utm_source: 'camper-planner',
          utm_medium: 'affiliate',
          utm_campaign: 'campsite-search',
        };

      case 'campinginfo':
        return {
          utm_source: 'camper-planner',
          utm_medium: 'affiliate',
          utm_campaign: 'campsite-search',
        };

      default:
        return {};
    }
  }

  /**
   * Get search parameters specific to each provider
   */
  private getSearchParams(
    provider: BookingProvider,
    campsite: Campsite,
    options: BookingSearchOptions
  ): Record<string, string> {
    const params: Record<string, string> = {};

    // Common location parameters
    params.lat = campsite.lat.toString();
    params.lng = campsite.lng.toString();

    // Provider-specific parameters
    switch (provider.id) {
      case 'booking':
        // Booking.com parameters
        if (campsite.name) {
          params.ss = campsite.name;
        } else if (campsite.address) {
          params.ss = campsite.address;
        }
        params.accommodation_type = 'camping';
        params.latitude = campsite.lat.toString();
        params.longitude = campsite.lng.toString();

        if (options.checkIn) {
          params.checkin = options.checkIn.toISOString().split('T')[0];
        }
        if (options.checkOut) {
          params.checkout = options.checkOut.toISOString().split('T')[0];
        }
        if (options.guests) {
          params.group_adults = options.guests.toString();
        }
        break;

      case 'eurocampings':
        // Eurocampings parameters
        if (campsite.name) {
          params.q = campsite.name;
        } else if (campsite.address) {
          params.q = campsite.address;
        }
        if (options.checkIn) {
          params.arrival = options.checkIn.toISOString().split('T')[0];
        }
        if (options.checkOut) {
          params.departure = options.checkOut.toISOString().split('T')[0];
        }
        break;

      case 'campinginfo':
        // camping.info parameters
        if (campsite.name) {
          params.q = campsite.name;
        } else if (campsite.address) {
          params.q = campsite.address;
        }
        if (options.checkIn) {
          params.dateFrom = options.checkIn.toISOString().split('T')[0];
        }
        if (options.checkOut) {
          params.dateTo = options.checkOut.toISOString().split('T')[0];
        }
        break;
    }

    return params;
  }

  /**
   * Get the search path for each provider
   */
  private getSearchPath(providerId: string): string {
    switch (providerId) {
      case 'booking':
        return '/searchresults.html';
      case 'eurocampings':
        return '/search';
      case 'campinginfo':
        return '/en/search';
      default:
        return '/search';
    }
  }

  /**
   * Generate a description for the search
   */
  private getSearchDescription(
    provider: BookingProvider,
    campsite: Campsite,
    options: BookingSearchOptions
  ): string {
    const location = campsite.name || campsite.address || 'this location';
    const dates =
      options.checkIn && options.checkOut
        ? ` for ${options.checkIn.toLocaleDateString()} - ${options.checkOut.toLocaleDateString()}`
        : '';

    return `Search ${provider.name} for camping near ${location}${dates}`;
  }

  /**
   * Get booking statistics and analytics
   */
  getProviderStats(): Record<string, unknown> {
    const stats = {
      totalProviders: Object.keys(this.providers).length,
      enabledProviders: this.getEnabledProviders().length,
      coverageByRegion: {
        europe: ['booking', 'eurocampings', 'campinginfo'],
        worldwide: ['booking'],
        specialist: ['eurocampings', 'campinginfo'],
      },
      features: {
        instantBooking: this.getProvidersByFeature('Instant booking'),
        freeCancellation: this.getProvidersByFeature('Free cancellation'),
        mobileApp: this.getProvidersByFeature('Mobile app'),
        europeanFocus: this.getProvidersByFeature('European focus'),
      },
    };

    return stats;
  }

  /**
   * Get providers that offer a specific feature
   */
  private getProvidersByFeature(feature: string): string[] {
    return Object.values(this.providers)
      .filter(provider => provider.features.includes(feature))
      .map(provider => provider.name);
  }

  /**
   * Validate booking link before opening
   */
  async validateBookingLink(url: string): Promise<boolean> {
    try {
      // Basic URL validation
      new URL(url);

      // Check if the domain is in our approved list
      const approvedDomains = ['booking.com', 'eurocampings.co.uk', 'camping.info'];

      const domain = new URL(url).hostname.replace('www.', '');
      return approvedDomains.includes(domain);
    } catch {
      return false;
    }
  }

  /**
   * Track booking link clicks for analytics
   */
  trackBookingClick(providerId: string, campsiteId: string): void {
    // Analytics tracking stub - would integrate with analytics services
    void providerId;
    void campsiteId;
  }
}

// Export singleton instance
export const bookingService = new BookingService();
export default BookingService;
