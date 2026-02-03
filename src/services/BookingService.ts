// Booking Service
// Phase 1.3: Campsite booking integration with affiliate platforms

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
      description: 'World\'s largest accommodation booking platform',
      baseUrl: 'https://www.booking.com',
      commissionRate: '3-5%',
      features: ['Instant booking', 'Free cancellation', 'Reviews', 'Mobile app'],
      searchCapabilities: {
        locationSearch: true,
        campsiteTypeFilter: true,
        amenityFilter: false,
        availabilityCheck: true
      },
      enabled: !!import.meta.env.VITE_BOOKING_AFFILIATE_ID
    },
    pitchup: {
      id: 'pitchup',
      name: 'Pitchup',
      description: 'Specialist camping and glamping booking platform',
      baseUrl: 'https://www.pitchup.com',
      commissionRate: 'Up to 8%',
      features: ['Camping specialist', 'Pitch selection', 'Local recommendations', 'Family-friendly'],
      searchCapabilities: {
        locationSearch: true,
        campsiteTypeFilter: true,
        amenityFilter: true,
        availabilityCheck: true
      },
      enabled: !!import.meta.env.VITE_PITCHUP_AFFILIATE_ID
    },
    acsi: {
      id: 'acsi',
      name: 'ACSI Camping Card',
      description: 'European camping discount card and booking platform',
      baseUrl: 'https://www.acsi.eu',
      commissionRate: 'Variable',
      features: ['Discount rates', 'European focus', 'Quality assured', 'Inspection reports'],
      searchCapabilities: {
        locationSearch: true,
        campsiteTypeFilter: true,
        amenityFilter: true,
        availabilityCheck: false
      },
      enabled: !!import.meta.env.VITE_ACSI_AFFILIATE_CODE
    }
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
  generateBookingLinks(
    campsite: Campsite,
    options: BookingSearchOptions = {}
  ): BookingLink[] {
    const enabledProviders = this.getEnabledProviders();
    const links: BookingLink[] = [];

    enabledProviders.forEach(provider => {
      const url = this.generateProviderLink(provider, campsite, options);
      if (url) {
        links.push({
          provider,
          url,
          searchParams: this.getSearchParams(provider, campsite, options),
          description: this.getSearchDescription(provider, campsite, options)
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
          utm_medium: 'affiliate'
        };

      case 'pitchup':
        return {
          affiliate_id: import.meta.env.VITE_PITCHUP_AFFILIATE_ID || '',
          utm_source: 'camper-planner',
          utm_medium: 'referral',
          utm_campaign: 'campsite-search'
        };

      case 'acsi':
        return {
          ref: import.meta.env.VITE_ACSI_AFFILIATE_CODE || '',
          utm_source: 'camper-planner',
          partner: 'camper-planner'
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

      case 'pitchup':
        // Pitchup parameters
        if (campsite.address) {
          params.location = campsite.address;
        }
        if (options.vehicleType) {
          params.accommodation_type = options.vehicleType;
        }
        if (options.checkIn && options.checkOut) {
          params.start_date = options.checkIn.toISOString().split('T')[0];
          params.end_date = options.checkOut.toISOString().split('T')[0];
        }
        if (options.guests) {
          params.guests = options.guests.toString();
        }
        break;

      case 'acsi':
        // ACSI parameters
        if (campsite.address) {
          params.search_location = campsite.address;
        }
        params.lon = campsite.lng.toString(); // ACSI uses 'lon' instead of 'lng'

        // ACSI focuses on dates for discount eligibility
        if (options.checkIn) {
          params.arrival_date = options.checkIn.toISOString().split('T')[0];
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
      case 'pitchup':
        return '/search';
      case 'acsi':
        return '/en/search-and-book';
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
    const dates = options.checkIn && options.checkOut
      ? ` for ${options.checkIn.toLocaleDateString()} - ${options.checkOut.toLocaleDateString()}`
      : '';

    return `Search ${provider.name} for camping near ${location}${dates}`;
  }

  /**
   * Get booking statistics and analytics
   */
  getProviderStats(): Record<string, any> {
    const stats = {
      totalProviders: Object.keys(this.providers).length,
      enabledProviders: this.getEnabledProviders().length,
      coverageByRegion: {
        europe: ['acsi', 'pitchup', 'booking'],
        worldwide: ['booking', 'pitchup'],
        discount: ['acsi']
      },
      features: {
        instantBooking: this.getProvidersByFeature('Instant booking'),
        freeCancellation: this.getProvidersByFeature('Free cancellation'),
        mobileApp: this.getProvidersByFeature('Mobile app'),
        specialist: this.getProvidersByFeature('Camping specialist')
      }
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
      const approvedDomains = [
        'booking.com',
        'pitchup.com',
        'acsi.eu'
      ];

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
    // Analytics tracking would go here
    // For now, just log to console in development
    if (import.meta.env.VITE_APP_ENV === 'development') {
      console.log('Booking click tracked:', { providerId, campsiteId, timestamp: new Date() });
    }

    // Could integrate with analytics services like Google Analytics, Mixpanel, etc.
    // Example: gtag('event', 'booking_click', { provider: providerId, campsite: campsiteId });
  }
}

// Export singleton instance
export const bookingService = new BookingService();
export default BookingService;