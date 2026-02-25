// Trip Wizard Service
// Orchestrates route calculation, daily stage splitting, and campsite suggestions
// to generate a complete multi-day trip itinerary from minimal user inputs

import { routingService } from './RoutingService';
import { campsiteService, type Campsite, type BoundingBox } from './CampsiteService';
import {
  type ChannelCrossing,
  needsChannelCrossing,
  getRecommendedCrossings,
  isUKOrIreland,
} from '../data/channelCrossings';
import { type Waypoint, type VehicleProfile } from '../types';

// ============================================
// Types
// ============================================

export type DrivingStyle = 'relaxed' | 'moderate' | 'intensive';

export interface TripWizardInput {
  start: { name: string; lat: number; lng: number };
  end: { name: string; lat: number; lng: number };
  startDate: Date;
  endDate?: Date;
  drivingStyle: DrivingStyle;
  crossing?: ChannelCrossing;
  restDayFrequency: number; // 0 = no rest days, 3 = every 3 driving days
  vehicleProfile?: VehicleProfile;
}

export interface CampsiteOption {
  campsite: Campsite;
  distanceFromRoute: number; // km from the split point
  suitabilityScore: number; // 0-100
  amenitySummary: string[]; // e.g. ["showers", "electricity", "wifi"]
}

export interface ItineraryDay {
  dayNumber: number;
  date: Date;
  type: 'driving' | 'rest' | 'crossing';
  start: { name: string; lat: number; lng: number };
  end: { name: string; lat: number; lng: number };
  distance: number; // km
  drivingTime: number; // hours
  overnightOptions: CampsiteOption[];
  selectedOvernight?: CampsiteOption;
  crossing?: ChannelCrossing;
  notes: string[];
}

export interface TripItinerary {
  days: ItineraryDay[];
  crossing?: ChannelCrossing;
  totalDistance: number; // km
  totalDrivingTime: number; // hours
  totalDays: number;
  routeGeometry: [number, number][]; // full polyline
  warnings: string[];
}

// ============================================
// Driving Style Configuration
// ============================================

interface DrivingLimits {
  maxDailyHours: number;
  maxDailyDistance: number; // km
  description: string;
  shortDescription: string;
}

export const DRIVING_STYLE_LIMITS: Record<DrivingStyle, DrivingLimits> = {
  relaxed: {
    maxDailyHours: 4,
    maxDailyDistance: 250,
    description:
      'Take it easy. Short drives with plenty of time to explore, arrive early and enjoy your campsite.',
    shortDescription: '~4 hours / ~250 km per day',
  },
  moderate: {
    maxDailyHours: 6,
    maxDailyDistance: 350,
    description:
      'A good balance. Enough driving to make progress, with time to stop and explore along the way.',
    shortDescription: '~6 hours / ~350 km per day',
  },
  intensive: {
    maxDailyHours: 8,
    maxDailyDistance: 450,
    description:
      'Cover ground efficiently. Longer driving days for experienced road-trippers who want to reach their destination faster.',
    shortDescription: '~8 hours / ~450 km per day',
  },
};

// ============================================
// Haversine distance helper
// ============================================

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ============================================
// Reverse geocoding (Nominatim)
// ============================================

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10&accept-language=en`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'EuropeanCamperPlanner/1.0' },
    });

    if (!response.ok) return `${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E`;

    const data = await response.json();
    const addr = data.address;

    // Build a nice location name
    if (addr) {
      const city = addr.city || addr.town || addr.village || addr.hamlet || '';
      const state = addr.state || addr.county || '';
      const country = addr.country || '';

      if (city && country) return `${city}, ${country}`;
      if (state && country) return `${state}, ${country}`;
      if (country) return country;
    }

    return (
      data.display_name?.split(',').slice(0, 2).join(',').trim() ||
      `${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E`
    );
  } catch {
    return `${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E`;
  }
}

// ============================================
// Main Service
// ============================================

export class TripWizardService {
  /**
   * Generate a complete trip itinerary from wizard inputs
   */
  static async generateItinerary(input: TripWizardInput): Promise<TripItinerary> {
    const limits = DRIVING_STYLE_LIMITS[input.drivingStyle];
    const warnings: string[] = [];

    // Step 1: Build the list of waypoints for routing
    const routeWaypoints = this.buildRouteWaypoints(input);

    // Step 2: Calculate the full route via OpenRouteService
    const routeResponse = await routingService.calculateRoute({
      waypoints: routeWaypoints,
      vehicleProfile: input.vehicleProfile,
      options: {
        geometry: true,
        instructions: true,
      },
    });

    if (routeResponse.status === 'error' || routeResponse.routes.length === 0) {
      throw new Error(routeResponse.errors?.join(', ') || 'Failed to calculate route');
    }

    const route = routeResponse.routes[0];
    const routeGeometry = route.geometry.coordinates;
    const totalDistanceKm = route.summary.distance / 1000;
    const totalDurationHrs = route.summary.duration / 3600;

    // Step 3: Split the route into daily segments
    const splitPoints = this.splitRouteIntoDays(
      routeGeometry,
      limits.maxDailyDistance,
      totalDistanceKm
    );

    // Step 4: Reverse geocode split points to get place names
    // Rate-limit Nominatim calls (1 per second)
    const namedSplitPoints: Array<{
      lat: number;
      lng: number;
      name: string;
      distanceFromStart: number;
    }> = [];

    // Add start point
    const startCoord = routeGeometry[0];
    namedSplitPoints.push({
      lat: startCoord[1],
      lng: startCoord[0],
      name: input.start.name,
      distanceFromStart: 0,
    });

    // Add intermediate split points
    for (let i = 0; i < splitPoints.length; i++) {
      const sp = splitPoints[i];
      // Rate limit: wait 1 second between Nominatim requests
      if (i > 0) await this.delay(1100);
      const name = await reverseGeocode(sp.lat, sp.lng);
      namedSplitPoints.push({ ...sp, name });
    }

    // Add end point
    const endCoord = routeGeometry[routeGeometry.length - 1];
    namedSplitPoints.push({
      lat: endCoord[1],
      lng: endCoord[0],
      name: input.end.name,
      distanceFromStart: totalDistanceKm,
    });

    // Step 5: Find campsites near each overnight stop
    const days: ItineraryDay[] = [];
    let dayNumber = 1;
    let currentDate = new Date(input.startDate);
    let drivingDaysSinceRest = 0;
    let crossingAssigned = false;

    for (let i = 0; i < namedSplitPoints.length - 1; i++) {
      const dayStart = namedSplitPoints[i];
      const dayEnd = namedSplitPoints[i + 1];
      const segmentDistance = dayEnd.distanceFromStart - dayStart.distanceFromStart;
      const segmentTime = segmentDistance * (totalDurationHrs / totalDistanceKm);

      // Check if this day involves a channel crossing (only tag one day)
      const isCrossingDay =
        !crossingAssigned &&
        !!(input.crossing && this.isPointNearCrossing(dayStart, dayEnd, input.crossing));
      if (isCrossingDay) crossingAssigned = true;

      // Find campsite options for this overnight stop (not for the final destination)
      let overnightOptions: CampsiteOption[] = [];
      const isLastDay = i === namedSplitPoints.length - 2;

      if (!isLastDay) {
        overnightOptions = await this.findCampsitesNearPoint(
          dayEnd.lat,
          dayEnd.lng,
          input.vehicleProfile
        );
      }

      const day: ItineraryDay = {
        dayNumber,
        date: new Date(currentDate),
        type: isCrossingDay ? 'crossing' : 'driving',
        start: { name: dayStart.name, lat: dayStart.lat, lng: dayStart.lng },
        end: { name: dayEnd.name, lat: dayEnd.lat, lng: dayEnd.lng },
        distance: Math.round(segmentDistance),
        drivingTime: Math.round(segmentTime * 10) / 10,
        overnightOptions,
        selectedOvernight: overnightOptions[0] || undefined,
        crossing: isCrossingDay ? input.crossing : undefined,
        notes: this.generateDayNotes(
          segmentDistance,
          segmentTime,
          limits,
          isCrossingDay,
          isLastDay
        ),
      };

      days.push(day);
      dayNumber++;
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
      drivingDaysSinceRest++;

      // Insert rest day if needed
      if (
        input.restDayFrequency > 0 &&
        drivingDaysSinceRest >= input.restDayFrequency &&
        !isLastDay
      ) {
        days.push({
          dayNumber,
          date: new Date(currentDate),
          type: 'rest',
          start: { name: dayEnd.name, lat: dayEnd.lat, lng: dayEnd.lng },
          end: { name: dayEnd.name, lat: dayEnd.lat, lng: dayEnd.lng },
          distance: 0,
          drivingTime: 0,
          overnightOptions: day.overnightOptions, // Same campsite as previous night
          selectedOvernight: day.selectedOvernight,
          notes: ['Rest day — explore the area, relax, or do laundry!'],
        });
        dayNumber++;
        currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
        drivingDaysSinceRest = 0;
      }
    }

    // Add warnings
    if (totalDistanceKm > 2500) {
      warnings.push('This is a long trip. Consider adding rest days for comfort.');
    }

    if (input.crossing?.overnightCrossing) {
      warnings.push(
        `The ${input.crossing.name} is an overnight crossing — you'll sleep on the ferry.`
      );
    }

    return {
      days,
      crossing: input.crossing,
      totalDistance: Math.round(totalDistanceKm),
      totalDrivingTime: Math.round(totalDurationHrs * 10) / 10,
      totalDays: days.length,
      routeGeometry: routeGeometry.map(([lng, lat]) => [lat, lng] as [number, number]),
      warnings,
    };
  }

  /**
   * Build waypoints array, inserting crossing terminals if needed
   */
  private static buildRouteWaypoints(input: TripWizardInput): Waypoint[] {
    const waypoints: Waypoint[] = [];
    const startIsUK = isUKOrIreland(input.start.lat, input.start.lng);

    // Start point
    waypoints.push({
      id: 'wizard-start',
      lat: input.start.lat,
      lng: input.start.lng,
      type: 'start',
      name: input.start.name,
    });

    // If crossing is selected, add terminal waypoints
    if (input.crossing) {
      if (startIsUK) {
        // UK → Europe: drive to UK port, then from EU port
        waypoints.push({
          id: 'wizard-crossing-depart',
          lat: input.crossing.departure.lat,
          lng: input.crossing.departure.lng,
          type: 'waypoint',
          name: `${input.crossing.departure.name} (${input.crossing.type === 'tunnel' ? 'Tunnel' : 'Ferry'} Terminal)`,
        });
        waypoints.push({
          id: 'wizard-crossing-arrive',
          lat: input.crossing.arrival.lat,
          lng: input.crossing.arrival.lng,
          type: 'waypoint',
          name: `${input.crossing.arrival.name} (Arrival)`,
        });
      } else {
        // Europe → UK: drive to EU port, then from UK port
        waypoints.push({
          id: 'wizard-crossing-depart',
          lat: input.crossing.arrival.lat,
          lng: input.crossing.arrival.lng,
          type: 'waypoint',
          name: `${input.crossing.arrival.name} (${input.crossing.type === 'tunnel' ? 'Tunnel' : 'Ferry'} Terminal)`,
        });
        waypoints.push({
          id: 'wizard-crossing-arrive',
          lat: input.crossing.departure.lat,
          lng: input.crossing.departure.lng,
          type: 'waypoint',
          name: `${input.crossing.departure.name} (Arrival)`,
        });
      }
    }

    // End point
    waypoints.push({
      id: 'wizard-end',
      lat: input.end.lat,
      lng: input.end.lng,
      type: 'end',
      name: input.end.name,
    });

    return waypoints;
  }

  /**
   * Walk the route polyline and find points where daily distance limits are reached
   */
  private static splitRouteIntoDays(
    geometry: [number, number][], // [lng, lat] from ORS
    maxDailyDistanceKm: number,
    totalDistanceKm: number
  ): Array<{ lat: number; lng: number; distanceFromStart: number }> {
    const splitPoints: Array<{ lat: number; lng: number; distanceFromStart: number }> = [];

    if (geometry.length < 2) return splitPoints;

    let accumulatedDistance = 0; // total from start
    let dailyDistance = 0; // distance today

    for (let i = 1; i < geometry.length; i++) {
      const prevLng = geometry[i - 1][0];
      const prevLat = geometry[i - 1][1];
      const currLng = geometry[i][0];
      const currLat = geometry[i][1];

      const segmentDist = haversine(prevLat, prevLng, currLat, currLng);
      accumulatedDistance += segmentDist;
      dailyDistance += segmentDist;

      // When we've exceeded the daily limit, mark this as a split point
      if (dailyDistance >= maxDailyDistanceKm) {
        // Don't add a split point too close to the end
        const remainingDistance = totalDistanceKm - accumulatedDistance;
        if (remainingDistance > maxDailyDistanceKm * 0.3) {
          splitPoints.push({
            lat: currLat,
            lng: currLng,
            distanceFromStart: accumulatedDistance,
          });
          dailyDistance = 0; // Reset for next day
        }
      }
    }

    return splitPoints;
  }

  /**
   * Find top 3 campsites near a given point
   */
  private static async findCampsitesNearPoint(
    lat: number,
    lng: number,
    vehicleProfile?: VehicleProfile
  ): Promise<CampsiteOption[]> {
    const searchRadiusKm = 15;
    const degreesPerKm = 1 / 111; // Approximate

    const bounds: BoundingBox = {
      south: lat - searchRadiusKm * degreesPerKm,
      north: lat + searchRadiusKm * degreesPerKm,
      west: lng - (searchRadiusKm * degreesPerKm) / Math.cos((lat * Math.PI) / 180),
      east: lng + (searchRadiusKm * degreesPerKm) / Math.cos((lat * Math.PI) / 180),
    };

    try {
      const response = await campsiteService.searchCampsites({
        bounds,
        types: ['campsite', 'caravan_site'],
        maxResults: 20,
      });

      if (!response.campsites || response.campsites.length === 0) {
        return [];
      }

      // Score and sort campsites
      const scored = response.campsites
        .map(campsite => {
          const dist = haversine(lat, lng, campsite.lat, campsite.lng);
          const amenityList = this.getAmenityList(campsite);
          const score = this.scoreCampsite(campsite, dist, vehicleProfile);

          return {
            campsite,
            distanceFromRoute: Math.round(dist * 10) / 10,
            suitabilityScore: score,
            amenitySummary: amenityList,
          };
        })
        .filter(c => c.distanceFromRoute <= searchRadiusKm)
        .sort((a, b) => b.suitabilityScore - a.suitabilityScore);

      // Return top 3
      return scored.slice(0, 3);
    } catch (error) {
      console.error('Failed to find campsites near point:', error);
      return [];
    }
  }

  /**
   * Score a campsite based on amenities, distance, and vehicle compatibility
   */
  private static scoreCampsite(
    campsite: Campsite,
    distanceKm: number,
    _vehicleProfile?: VehicleProfile
  ): number {
    let score = 50; // Base score

    // Amenity bonuses
    if (campsite.amenities.showers) score += 10;
    if (campsite.amenities.electricity) score += 10;
    if (campsite.amenities.toilets) score += 8;
    if (campsite.amenities.drinking_water) score += 5;
    if (campsite.amenities.wifi) score += 5;
    if (campsite.amenities.restaurant) score += 3;
    if (campsite.amenities.laundry) score += 3;
    if (campsite.amenities.swimming_pool) score += 2;
    if (campsite.amenities.playground) score += 2;
    if (campsite.amenities.shop) score += 2;

    // Named campsites are better than unnamed
    if (campsite.name && !campsite.name.startsWith('campsite ')) score += 5;

    // Distance penalty (closer to route = better)
    if (distanceKm < 2) score += 10;
    else if (distanceKm < 5) score += 5;
    else if (distanceKm > 10) score -= 10;

    // Campsite type bonus
    if (campsite.type === 'campsite') score += 5;
    else if (campsite.type === 'caravan_site') score += 3;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Get a human-readable list of amenities
   */
  private static getAmenityList(campsite: Campsite): string[] {
    const amenities: string[] = [];
    if (campsite.amenities.showers) amenities.push('Showers');
    if (campsite.amenities.electricity) amenities.push('Electric');
    if (campsite.amenities.toilets) amenities.push('Toilets');
    if (campsite.amenities.drinking_water) amenities.push('Water');
    if (campsite.amenities.wifi) amenities.push('WiFi');
    if (campsite.amenities.restaurant) amenities.push('Restaurant');
    if (campsite.amenities.laundry) amenities.push('Laundry');
    if (campsite.amenities.swimming_pool) amenities.push('Pool');
    if (campsite.amenities.shop) amenities.push('Shop');
    if (campsite.amenities.playground) amenities.push('Playground');
    return amenities;
  }

  /**
   * Generate helpful notes for a day
   */
  private static generateDayNotes(
    distance: number,
    drivingTime: number,
    limits: DrivingLimits,
    isCrossing: boolean,
    isLastDay: boolean
  ): string[] {
    const notes: string[] = [];

    if (isCrossing) {
      notes.push(
        'This day includes a channel crossing — allow extra time for check-in and boarding.'
      );
    }

    if (isLastDay) {
      notes.push("Arrival day! You've made it to your destination.");
    }

    if (drivingTime > limits.maxDailyHours * 0.9) {
      notes.push('Long driving day — make sure to take regular breaks.');
    }

    if (drivingTime < 2 && !isLastDay) {
      notes.push('Short driving day — plenty of time to explore the area.');
    }

    if (distance > 200) {
      const breaks = Math.floor(drivingTime / 2);
      if (breaks > 0) {
        notes.push(`Plan for ${breaks} rest stop${breaks > 1 ? 's' : ''} during the drive.`);
      }
    }

    return notes;
  }

  /**
   * Check if a day segment passes near a channel crossing terminal
   */
  private static isPointNearCrossing(
    dayStart: { lat: number; lng: number },
    dayEnd: { lat: number; lng: number },
    crossing: ChannelCrossing
  ): boolean {
    const nearDeparture =
      haversine(dayStart.lat, dayStart.lng, crossing.departure.lat, crossing.departure.lng) < 50 ||
      haversine(dayEnd.lat, dayEnd.lng, crossing.departure.lat, crossing.departure.lng) < 50;

    const nearArrival =
      haversine(dayStart.lat, dayStart.lng, crossing.arrival.lat, crossing.arrival.lng) < 50 ||
      haversine(dayEnd.lat, dayEnd.lng, crossing.arrival.lat, crossing.arrival.lng) < 50;

    return nearDeparture || nearArrival;
  }

  /**
   * Check if a channel crossing is needed between two locations
   */
  static needsCrossing(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number
  ): boolean {
    return needsChannelCrossing(startLat, startLng, endLat, endLng);
  }

  /**
   * Get recommended crossings for a given journey
   */
  static getRecommendedCrossings(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number
  ): ChannelCrossing[] {
    return getRecommendedCrossings(startLat, startLng, endLat, endLng);
  }

  /**
   * Utility: delay
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
