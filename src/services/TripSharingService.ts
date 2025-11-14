// Trip Sharing Service
// Phase 6.2: Privacy-first trip sharing with URL generation and validation

import type { Waypoint, TripData, VehicleProfile } from '../types';

// Interfaces for sharing functionality
export interface ShareableTrip {
  id: string;
  name: string;
  description?: string;
  waypoints: Waypoint[];
  vehicle?: VehicleProfile;
  metadata: {
    created: string;
    version: string;
    totalDistance?: number;
    estimatedTime?: number;
    author?: string;
  };
}

export interface ShareOptions {
  includeVehicle: boolean;
  includeMetadata: boolean;
  includeDescription: boolean;
  customName?: string;
  expirationDays?: number;
}

export interface ShareResult {
  success: boolean;
  shareUrl: string;
  shareCode: string;
  expiresAt?: string;
  errors: string[];
  warnings: string[];
}

export interface ShareAnalytics {
  shareId: string;
  method: 'url' | 'qr' | 'social' | 'email' | 'print';
  platform?: string;
  timestamp: string;
  // No personal data - only anonymous usage stats
}

// URL validation result
export interface ValidationResult {
  isValid: boolean;
  tripData?: ShareableTrip;
  errors: string[];
  warnings: string[];
}

export class TripSharingService {
  private static readonly VERSION = '1.0';
  private static readonly BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';
  private static readonly MAX_URL_LENGTH = 2048; // Browser URL limit
  private static readonly COMPRESSION_THRESHOLD = 1000; // Compress if data > 1KB

  // Generate a shareable trip URL with encoded data
  static async generateShareUrl(
    waypoints: Waypoint[],
    options: ShareOptions,
    additionalData?: {
      trip?: TripData;
      vehicle?: VehicleProfile;
      calculatedRoute?: any;
    }
  ): Promise<ShareResult> {
    try {
      // Validate input data
      if (!waypoints || waypoints.length < 2) {
        return {
          success: false,
          shareUrl: '',
          shareCode: '',
          errors: ['Trip must have at least 2 waypoints to share'],
          warnings: []
        };
      }

      // Create shareable trip object
      const shareableTrip: ShareableTrip = {
        id: this.generateShareId(),
        name: options.customName || additionalData?.trip?.name || `Trip ${new Date().toLocaleDateString()}`,
        description: options.includeDescription ? additionalData?.trip?.description : undefined,
        waypoints: this.sanitizeWaypoints(waypoints),
        vehicle: options.includeVehicle ? additionalData?.vehicle : undefined,
        metadata: {
          created: new Date().toISOString(),
          version: this.VERSION,
          totalDistance: additionalData?.calculatedRoute?.routes?.[0]?.summary?.distance,
          estimatedTime: additionalData?.calculatedRoute?.routes?.[0]?.summary?.duration,
          author: options.includeMetadata ? additionalData?.trip?.metadata?.author : undefined
        }
      };

      // Compress and encode trip data
      const encodedData = await this.encodeTrip(shareableTrip);

      // Generate share URL
      const shareUrl = `${this.BASE_URL}/shared-trip?data=${encodedData}`;

      // Check URL length constraints
      const warnings: string[] = [];
      if (shareUrl.length > this.MAX_URL_LENGTH) {
        warnings.push('Share URL is very long and may not work on all platforms');
      }

      // Track sharing analytics (anonymous)
      this.trackSharing({
        shareId: shareableTrip.id,
        method: 'url',
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        shareUrl,
        shareCode: shareableTrip.id,
        expiresAt: options.expirationDays ?
          new Date(Date.now() + options.expirationDays * 24 * 60 * 60 * 1000).toISOString() :
          undefined,
        errors: [],
        warnings
      };

    } catch (error) {
      return {
        success: false,
        shareUrl: '',
        shareCode: '',
        errors: [`Failed to generate share URL: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      };
    }
  }

  // Validate and decode a shared trip URL
  static async validateAndDecodeUrl(url: string): Promise<ValidationResult> {
    try {
      // Extract data parameter from URL
      const urlObj = new URL(url);
      const encodedData = urlObj.searchParams.get('data');

      if (!encodedData) {
        return {
          isValid: false,
          errors: ['Invalid share URL: Missing trip data'],
          warnings: []
        };
      }

      // Decode trip data
      const tripData = await this.decodeTrip(encodedData);

      // Validate decoded data
      const validation = this.validateTripData(tripData);

      if (!validation.isValid) {
        return {
          isValid: false,
          errors: validation.errors,
          warnings: validation.warnings
        };
      }

      return {
        isValid: true,
        tripData,
        errors: [],
        warnings: validation.warnings
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [`Failed to validate URL: ${error instanceof Error ? error.message : 'Invalid URL format'}`],
        warnings: []
      };
    }
  }

  // Generate QR code data for mobile sharing
  static generateQRCodeData(shareUrl: string): {
    success: boolean;
    qrData: string;
    errors: string[];
  } {
    try {
      // QR codes have size limits, so we might need to use a shorter URL
      if (shareUrl.length > 1000) {
        return {
          success: false,
          qrData: '',
          errors: ['Share URL too long for QR code generation']
        };
      }

      return {
        success: true,
        qrData: shareUrl,
        errors: []
      };
    } catch (error) {
      return {
        success: false,
        qrData: '',
        errors: [`QR code generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  // Generate social media sharing links
  static generateSocialLinks(shareUrl: string, tripName: string): {
    facebook: string;
    twitter: string;
    whatsapp: string;
    linkedin: string;
  } {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(`Check out my European camper trip: ${tripName}`);
    const hashtags = encodeURIComponent('EuropeanTravel,CamperTrip,RoadTrip');

    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}&hashtags=${hashtags}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
    };
  }

  // Generate email sharing content
  static generateEmailContent(shareUrl: string, tripData: ShareableTrip): {
    subject: string;
    body: string;
    mailtoLink: string;
  } {
    const subject = `Trip Share: ${tripData.name}`;

    let body = `Hi!\n\nI'd like to share my European camper trip with you: "${tripData.name}"\n\n`;

    if (tripData.description) {
      body += `Description: ${tripData.description}\n\n`;
    }

    body += `Trip Details:\n`;
    body += `• ${tripData.waypoints.length} destinations\n`;

    if (tripData.metadata.totalDistance) {
      body += `• ${Math.round(tripData.metadata.totalDistance / 1000)} km total distance\n`;
    }

    if (tripData.metadata.estimatedTime) {
      const hours = Math.round(tripData.metadata.estimatedTime / 3600);
      body += `• ${hours} hours estimated driving time\n`;
    }

    body += `\nDestinations:\n`;
    tripData.waypoints.forEach((waypoint, index) => {
      body += `${index + 1}. ${waypoint.name || waypoint.address}\n`;
    });

    body += `\nTo view and import this trip, click here:\n${shareUrl}\n\n`;
    body += `This link was generated by European Camper Trip Planner and contains all the trip data you need to import into your own planning session.\n\n`;
    body += `Happy travels!`;

    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    return { subject, body, mailtoLink };
  }

  // Generate print-friendly trip summary
  static generatePrintSummary(tripData: ShareableTrip, includeUrl: boolean = true, shareUrl?: string): {
    html: string;
    css: string;
  } {
    const html = `
      <div class="trip-summary-print">
        <header class="print-header">
          <h1>${tripData.name}</h1>
          ${tripData.description ? `<p class="description">${tripData.description}</p>` : ''}
          <div class="trip-meta">
            <span>Created: ${new Date(tripData.metadata.created).toLocaleDateString()}</span>
            ${tripData.metadata.author ? `<span>By: ${tripData.metadata.author}</span>` : ''}
          </div>
        </header>

        <section class="trip-overview">
          <h2>Trip Overview</h2>
          <div class="overview-grid">
            <div class="overview-item">
              <strong>Destinations:</strong> ${tripData.waypoints.length}
            </div>
            ${tripData.metadata.totalDistance ? `
              <div class="overview-item">
                <strong>Total Distance:</strong> ${Math.round(tripData.metadata.totalDistance / 1000)} km
              </div>
            ` : ''}
            ${tripData.metadata.estimatedTime ? `
              <div class="overview-item">
                <strong>Estimated Driving Time:</strong> ${Math.round(tripData.metadata.estimatedTime / 3600)} hours
              </div>
            ` : ''}
          </div>
        </section>

        <section class="waypoints-list">
          <h2>Route Details</h2>
          <ol class="waypoints">
            ${tripData.waypoints.map(waypoint => `
              <li class="waypoint">
                <div class="waypoint-header">
                  <strong>${waypoint.name || 'Waypoint'}</strong>
                  <span class="waypoint-type">${waypoint.type}</span>
                </div>
                ${waypoint.address ? `<div class="waypoint-address">${waypoint.address}</div>` : ''}
                <div class="waypoint-coords">
                  Coordinates: ${waypoint.lat.toFixed(6)}, ${waypoint.lng.toFixed(6)}
                </div>
                ${waypoint.notes ? `<div class="waypoint-notes">${waypoint.notes}</div>` : ''}
              </li>
            `).join('')}
          </ol>
        </section>

        ${tripData.vehicle ? `
          <section class="vehicle-info">
            <h2>Vehicle Information</h2>
            <div class="vehicle-details">
              <p><strong>Type:</strong> ${tripData.vehicle.type}</p>
              <p><strong>Dimensions:</strong> ${tripData.vehicle.length}m L × ${tripData.vehicle.width}m W × ${tripData.vehicle.height}m H</p>
              <p><strong>Weight:</strong> ${tripData.vehicle.weight}t</p>
              ${tripData.vehicle.fuelType ? `<p><strong>Fuel Type:</strong> ${tripData.vehicle.fuelType}</p>` : ''}
            </div>
          </section>
        ` : ''}

        ${includeUrl && shareUrl ? `
          <section class="share-info">
            <h2>Digital Trip Link</h2>
            <p>To import this trip into the European Camper Trip Planner:</p>
            <div class="share-url">${shareUrl}</div>
            <p class="share-instructions">
              Copy this link and open it in your browser to automatically import all waypoints and trip details.
            </p>
          </section>
        ` : ''}

        <footer class="print-footer">
          <p>Generated by European Camper Trip Planner on ${new Date().toLocaleDateString()}</p>
        </footer>
      </div>
    `;

    const css = `
      @media print {
        .trip-summary-print {
          font-family: Arial, sans-serif;
          max-width: 100%;
          margin: 0;
          padding: 20px;
          line-height: 1.4;
        }

        .print-header {
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }

        .print-header h1 {
          margin: 0 0 10px 0;
          font-size: 24px;
          color: #333;
        }

        .description {
          font-style: italic;
          margin: 10px 0;
          color: #666;
        }

        .trip-meta {
          font-size: 12px;
          color: #666;
        }

        .trip-meta span {
          margin-right: 20px;
        }

        .trip-overview h2,
        .waypoints-list h2,
        .vehicle-info h2,
        .share-info h2 {
          font-size: 18px;
          color: #333;
          border-bottom: 1px solid #ccc;
          padding-bottom: 5px;
          margin: 20px 0 15px 0;
        }

        .overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
          margin-bottom: 20px;
        }

        .overview-item {
          padding: 10px;
          background: #f5f5f5;
          border-radius: 4px;
        }

        .waypoints {
          list-style: none;
          counter-reset: waypoint-counter;
          padding: 0;
        }

        .waypoint {
          counter-increment: waypoint-counter;
          margin-bottom: 15px;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          position: relative;
        }

        .waypoint::before {
          content: counter(waypoint-counter);
          position: absolute;
          left: -25px;
          top: 10px;
          background: #333;
          color: white;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
        }

        .waypoint-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
        }

        .waypoint-type {
          font-size: 12px;
          background: #e0e0e0;
          padding: 2px 6px;
          border-radius: 3px;
          text-transform: capitalize;
        }

        .waypoint-address {
          color: #666;
          font-size: 14px;
          margin-bottom: 3px;
        }

        .waypoint-coords {
          font-size: 12px;
          color: #999;
          font-family: monospace;
        }

        .waypoint-notes {
          font-style: italic;
          color: #666;
          margin-top: 5px;
          font-size: 14px;
        }

        .vehicle-details p {
          margin: 5px 0;
        }

        .share-url {
          background: #f0f0f0;
          padding: 10px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
          word-break: break-all;
          margin: 10px 0;
        }

        .share-instructions {
          font-size: 12px;
          color: #666;
          font-style: italic;
        }

        .print-footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ccc;
          font-size: 12px;
          color: #999;
          text-align: center;
        }
      }

      @media screen {
        .trip-summary-print {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }
      }
    `;

    return { html, css };
  }

  // Private helper methods

  private static generateShareId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private static sanitizeWaypoints(waypoints: Waypoint[]): Waypoint[] {
    return waypoints.map(waypoint => ({
      id: waypoint.id,
      lat: waypoint.lat,
      lng: waypoint.lng,
      name: waypoint.name,
      address: waypoint.address,
      type: waypoint.type,
      notes: waypoint.notes,
      // Remove any sensitive or unnecessary data
    }));
  }

  private static async encodeTrip(trip: ShareableTrip): Promise<string> {
    try {
      const jsonString = JSON.stringify(trip);

      // Compress if data is large
      if (jsonString.length > this.COMPRESSION_THRESHOLD) {
        // For browser compatibility, we'll use base64 encoding
        // In a real implementation, you might use a compression library
        return btoa(jsonString);
      }

      // Simple base64 encoding for smaller data
      return btoa(jsonString);
    } catch (error) {
      throw new Error(`Failed to encode trip data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async decodeTrip(encodedData: string): Promise<ShareableTrip> {
    try {
      // Decode base64
      const jsonString = atob(encodedData);

      // Parse JSON
      const tripData = JSON.parse(jsonString);

      return tripData as ShareableTrip;
    } catch (error) {
      throw new Error(`Failed to decode trip data: ${error instanceof Error ? error.message : 'Invalid data format'}`);
    }
  }

  private static validateTripData(tripData: any): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!tripData.id) errors.push('Missing trip ID');
    if (!tripData.name) errors.push('Missing trip name');
    if (!tripData.waypoints || !Array.isArray(tripData.waypoints)) {
      errors.push('Missing or invalid waypoints data');
    } else if (tripData.waypoints.length < 2) {
      errors.push('Trip must have at least 2 waypoints');
    }

    // Validate waypoints
    if (tripData.waypoints) {
      tripData.waypoints.forEach((waypoint: any, index: number) => {
        if (typeof waypoint.lat !== 'number' || typeof waypoint.lng !== 'number') {
          errors.push(`Invalid coordinates for waypoint ${index + 1}`);
        }
        if (!waypoint.id) warnings.push(`Waypoint ${index + 1} missing ID`);
      });
    }

    // Check metadata
    if (!tripData.metadata) {
      warnings.push('Missing trip metadata');
    } else {
      if (!tripData.metadata.created) warnings.push('Missing creation date');
      if (!tripData.metadata.version) warnings.push('Missing version information');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private static trackSharing(analytics: ShareAnalytics): void {
    try {
      // Store anonymous sharing analytics in localStorage
      const existingAnalytics = JSON.parse(localStorage.getItem('tripSharingAnalytics') || '[]');
      existingAnalytics.push(analytics);

      // Keep only last 100 entries to prevent storage bloat
      const limitedAnalytics = existingAnalytics.slice(-100);
      localStorage.setItem('tripSharingAnalytics', JSON.stringify(limitedAnalytics));
    } catch (error) {
      // Silently fail if localStorage is not available
      console.warn('Could not track sharing analytics:', error);
    }
  }

  // Public analytics methods
  static getAnonymousAnalytics(): ShareAnalytics[] {
    try {
      return JSON.parse(localStorage.getItem('tripSharingAnalytics') || '[]');
    } catch (error) {
      return [];
    }
  }

  static clearAnalytics(): void {
    try {
      localStorage.removeItem('tripSharingAnalytics');
    } catch (error) {
      // Silently fail
    }
  }
}