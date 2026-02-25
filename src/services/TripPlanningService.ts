// Trip Planning Service
// Phase 5.4: Intelligent trip planning with duration estimation and feasibility analysis

import { type Waypoint } from '../store';
import { type VehicleProfile } from '../store';

export interface DrivingLimits {
  maxDailyDistance: number; // km
  maxDailyDrivingTime: number; // hours
  recommendedBreakInterval: number; // hours
  breakDuration: number; // minutes
  averageSpeed: number; // km/h (considering stops and camper limitations)
}

export interface StopDuration {
  waypointId: string;
  type: 'overnight' | 'sightseeing' | 'lunch' | 'fuel' | 'rest';
  minDuration: number; // hours
  recommendedDuration: number; // hours
  maxDuration: number; // hours
  reasoning: string;
}

export interface DailyStage {
  day: number;
  date: Date;
  startWaypoint: Waypoint;
  endWaypoint: Waypoint;
  distance: number; // km
  drivingTime: number; // hours
  stops: StopDuration[];
  accommodationType: 'campsite' | 'wild_camping' | 'hotel' | 'air_bnb' | 'parking';
  feasibility: 'excellent' | 'good' | 'challenging' | 'unrealistic';
  warnings: string[];
  recommendations: string[];
}

export interface TripPlan {
  totalDays: number;
  totalDistance: number;
  totalDrivingTime: number;
  startDate?: Date;
  endDate?: Date;
  dailyStages: DailyStage[];
  restDays: number;
  feasibilityScore: number; // 0-100
  overallFeasibility: 'excellent' | 'good' | 'challenging' | 'unrealistic';
  warnings: string[];
  recommendations: string[];
}

export interface PlanningRecommendation {
  type: 'safety' | 'comfort' | 'cost' | 'timing' | 'season' | 'route';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  impact: string;
}

export interface SeasonalFactors {
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  temperature: { min: number; max: number };
  precipitation: 'low' | 'medium' | 'high';
  touristDensity: 'low' | 'medium' | 'high';
  campsiteAvailability: 'excellent' | 'good' | 'limited' | 'poor';
  drivingConditions: 'excellent' | 'good' | 'challenging' | 'difficult';
  recommendations: string[];
  warnings: string[];
}

export interface TripMetrics {
  drivingIntensity: number; // km per day average
  restRatio: number; // rest days vs driving days
  varietyScore: number; // how diverse the route is
  difficultyScore: number; // overall trip difficulty (0-100)
  comfortLevel: 'relaxed' | 'moderate' | 'intensive' | 'extreme';
  suitability: {
    beginners: boolean;
    families: boolean;
    experienced: boolean;
    seniors: boolean;
  };
}

// Vehicle-specific driving limits based on type and experience
const VEHICLE_DRIVING_LIMITS: Record<string, DrivingLimits> = {
  motorhome: {
    maxDailyDistance: 300,
    maxDailyDrivingTime: 6,
    recommendedBreakInterval: 2,
    breakDuration: 20,
    averageSpeed: 65,
  },
  caravan: {
    maxDailyDistance: 350,
    maxDailyDrivingTime: 7,
    recommendedBreakInterval: 2.5,
    breakDuration: 15,
    averageSpeed: 70,
  },
  campervan: {
    maxDailyDistance: 400,
    maxDailyDrivingTime: 8,
    recommendedBreakInterval: 3,
    breakDuration: 15,
    averageSpeed: 75,
  },
  default: {
    maxDailyDistance: 350,
    maxDailyDrivingTime: 7,
    recommendedBreakInterval: 2.5,
    breakDuration: 15,
    averageSpeed: 70,
  },
};

// Seasonal driving adjustments
const SEASONAL_ADJUSTMENTS = {
  winter: { speedMultiplier: 0.8, distanceMultiplier: 0.7, difficultyIncrease: 30 },
  spring: { speedMultiplier: 0.95, distanceMultiplier: 0.9, difficultyIncrease: 0 },
  summer: { speedMultiplier: 1.0, distanceMultiplier: 1.0, difficultyIncrease: 0 },
  autumn: { speedMultiplier: 0.9, distanceMultiplier: 0.85, difficultyIncrease: 10 },
};

export class TripPlanningService {
  /**
   * Create a comprehensive trip plan with daily stages
   */
  static createTripPlan(
    waypoints: Waypoint[],
    vehicleProfile?: VehicleProfile,
    startDate?: Date,
    season: 'spring' | 'summer' | 'autumn' | 'winter' = 'summer'
  ): TripPlan {
    if (waypoints.length < 2) {
      throw new Error('At least 2 waypoints required for trip planning');
    }

    const drivingLimits = this.getDrivingLimits(vehicleProfile, season);
    const segments = this.calculateRouteSegments(waypoints);
    const dailyStages = this.planDailyStages(segments, drivingLimits, startDate, season);
    const feasibilityAnalysis = this.analyzeFeasibility(dailyStages, drivingLimits);

    const totalDistance = segments.reduce((sum, seg) => sum + seg.distance, 0);
    const totalDrivingTime = segments.reduce((sum, seg) => sum + seg.drivingTime, 0);
    const restDays = this.calculateRestDays(dailyStages);

    return {
      totalDays: dailyStages.length + restDays,
      totalDistance,
      totalDrivingTime,
      startDate,
      endDate: startDate
        ? new Date(startDate.getTime() + (dailyStages.length + restDays - 1) * 24 * 60 * 60 * 1000)
        : undefined,
      dailyStages,
      restDays,
      feasibilityScore: feasibilityAnalysis.score,
      overallFeasibility: feasibilityAnalysis.overall,
      warnings: feasibilityAnalysis.warnings,
      recommendations: feasibilityAnalysis.recommendations,
    };
  }

  /**
   * Get driving limits adjusted for vehicle and season
   */
  static getDrivingLimits(
    vehicleProfile?: VehicleProfile,
    season: string = 'summer'
  ): DrivingLimits {
    const baseType = vehicleProfile?.type || 'default';
    const baseLimits = VEHICLE_DRIVING_LIMITS[baseType] || VEHICLE_DRIVING_LIMITS.default;
    const seasonalAdj =
      SEASONAL_ADJUSTMENTS[season as keyof typeof SEASONAL_ADJUSTMENTS] ||
      SEASONAL_ADJUSTMENTS.summer;

    // Adjust for vehicle size/weight
    let sizeMultiplier = 1.0;
    if (vehicleProfile) {
      const length = vehicleProfile.length || 6;
      const weight = vehicleProfile.weight || 3000;

      if (length > 8 || weight > 4000)
        sizeMultiplier = 0.8; // Large vehicles
      else if (length > 7 || weight > 3500) sizeMultiplier = 0.9; // Medium vehicles
    }

    return {
      maxDailyDistance: Math.round(
        baseLimits.maxDailyDistance * seasonalAdj.distanceMultiplier * sizeMultiplier
      ),
      maxDailyDrivingTime:
        Math.round(
          baseLimits.maxDailyDrivingTime * seasonalAdj.speedMultiplier * sizeMultiplier * 10
        ) / 10,
      recommendedBreakInterval: baseLimits.recommendedBreakInterval,
      breakDuration: baseLimits.breakDuration,
      averageSpeed: Math.round(baseLimits.averageSpeed * seasonalAdj.speedMultiplier),
    };
  }

  /**
   * Calculate route segments between waypoints
   */
  static calculateRouteSegments(waypoints: Waypoint[]): Array<{
    startWaypoint: Waypoint;
    endWaypoint: Waypoint;
    distance: number;
    drivingTime: number;
  }> {
    const segments = [];

    for (let i = 0; i < waypoints.length - 1; i++) {
      const start = waypoints[i];
      const end = waypoints[i + 1];
      const distance = this.calculateDistance(start, end);
      const drivingTime = distance / 70; // Rough estimate

      segments.push({
        startWaypoint: start,
        endWaypoint: end,
        distance,
        drivingTime,
      });
    }

    return segments;
  }

  /**
   * Plan daily stages with intelligent stop allocation
   */
  static planDailyStages(
    segments: Array<{
      startWaypoint: Waypoint;
      endWaypoint: Waypoint;
      distance: number;
      drivingTime: number;
    }>,
    limits: DrivingLimits,
    startDate?: Date,
    season: string = 'summer'
  ): DailyStage[] {
    const stages: DailyStage[] = [];
    let currentDay = 1;
    let currentDate = startDate || new Date();
    let dailyDistance = 0;
    let dailyTime = 0;
    let currentStageSegments: typeof segments = [];

    segments.forEach((segment, index) => {
      // Check if adding this segment would exceed daily limits
      if (
        dailyDistance + segment.distance > limits.maxDailyDistance ||
        dailyTime + segment.drivingTime > limits.maxDailyDrivingTime
      ) {
        // Finish current day if we have segments
        if (currentStageSegments.length > 0) {
          stages.push(
            this.createDailyStage(
              currentDay,
              currentDate,
              currentStageSegments,
              dailyDistance,
              dailyTime,
              limits,
              season
            )
          );

          currentDay++;
          currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
          dailyDistance = 0;
          dailyTime = 0;
          currentStageSegments = [];
        }
      }

      // Add current segment to the day
      currentStageSegments.push(segment);
      dailyDistance += segment.distance;
      dailyTime += segment.drivingTime;

      // If this is the last segment, finish the day
      if (index === segments.length - 1 && currentStageSegments.length > 0) {
        stages.push(
          this.createDailyStage(
            currentDay,
            currentDate,
            currentStageSegments,
            dailyDistance,
            dailyTime,
            limits,
            season
          )
        );
      }
    });

    return stages;
  }

  /**
   * Create a daily stage with stops and feasibility analysis
   */
  static createDailyStage(
    day: number,
    date: Date,
    segments: Array<{
      startWaypoint: Waypoint;
      endWaypoint: Waypoint;
      distance: number;
      drivingTime: number;
    }>,
    totalDistance: number,
    totalTime: number,
    limits: DrivingLimits,
    season: string
  ): DailyStage {
    const startWaypoint = segments[0].startWaypoint;
    const endWaypoint = segments[segments.length - 1].endWaypoint;

    // Plan stops
    const stops = this.planStopsForDay(segments, totalTime, limits);

    // Determine accommodation type
    const accommodationType = this.determineAccommodationType(endWaypoint, season);

    // Assess feasibility
    const feasibility = this.assessDayFeasibility(totalDistance, totalTime, limits);

    // Generate warnings and recommendations
    const warnings = this.generateDayWarnings(totalDistance, totalTime, limits, season);
    const recommendations = this.generateDayRecommendations(
      totalDistance,
      totalTime,
      limits,
      season
    );

    return {
      day,
      date,
      startWaypoint,
      endWaypoint,
      distance: totalDistance,
      drivingTime: totalTime,
      stops,
      accommodationType,
      feasibility,
      warnings,
      recommendations,
    };
  }

  /**
   * Plan stops for a day's driving
   */
  static planStopsForDay(
    segments: Array<{
      startWaypoint: Waypoint;
      endWaypoint: Waypoint;
      distance: number;
      drivingTime: number;
    }>,
    totalTime: number,
    limits: DrivingLimits
  ): StopDuration[] {
    const stops: StopDuration[] = [];

    // Add breaks based on driving time
    const numBreaks = Math.floor(totalTime / limits.recommendedBreakInterval);
    for (let i = 0; i < numBreaks; i++) {
      stops.push({
        waypointId: `break_${i}`,
        type: 'rest',
        minDuration: limits.breakDuration / 60,
        recommendedDuration: limits.breakDuration / 60,
        maxDuration: 1,
        reasoning: `Mandatory rest break after ${limits.recommendedBreakInterval} hours of driving`,
      });
    }

    // Add sightseeing stops for interesting waypoints
    segments.forEach(segment => {
      if (this.isPointOfInterest(segment.endWaypoint)) {
        stops.push({
          waypointId: segment.endWaypoint.id,
          type: 'sightseeing',
          minDuration: 1,
          recommendedDuration: 2,
          maxDuration: 4,
          reasoning: 'Recommended sightseeing stop at point of interest',
        });
      }
    });

    // Add lunch stop for long days
    if (totalTime > 4) {
      stops.push({
        waypointId: 'lunch',
        type: 'lunch',
        minDuration: 0.5,
        recommendedDuration: 1,
        maxDuration: 2,
        reasoning: 'Lunch break for long driving day',
      });
    }

    return stops;
  }

  /**
   * Determine accommodation type for waypoint
   */
  static determineAccommodationType(
    waypoint: Waypoint,
    season: string
  ): DailyStage['accommodationType'] {
    if (!waypoint) return 'campsite';
    if (waypoint.type === 'campsite') return 'campsite';
    if (waypoint.type === 'accommodation') return 'hotel';

    // Default recommendations based on season
    if (season === 'winter') return 'hotel';
    if (season === 'summer') return 'campsite';
    return 'campsite';
  }

  /**
   * Assess feasibility of a daily stage
   */
  static assessDayFeasibility(
    distance: number,
    drivingTime: number,
    limits: DrivingLimits
  ): DailyStage['feasibility'] {
    const distanceRatio = distance / limits.maxDailyDistance;
    const timeRatio = drivingTime / limits.maxDailyDrivingTime;
    const maxRatio = Math.max(distanceRatio, timeRatio);

    if (maxRatio <= 0.7) return 'excellent';
    if (maxRatio <= 0.9) return 'good';
    if (maxRatio <= 1.1) return 'challenging';
    return 'unrealistic';
  }

  /**
   * Generate warnings for daily stages
   */
  static generateDayWarnings(
    distance: number,
    drivingTime: number,
    limits: DrivingLimits,
    season: string
  ): string[] {
    const warnings: string[] = [];

    if (distance > limits.maxDailyDistance) {
      warnings.push(
        `Daily distance of ${distance.toFixed(0)}km exceeds recommended limit of ${limits.maxDailyDistance}km`
      );
    }

    if (drivingTime > limits.maxDailyDrivingTime) {
      warnings.push(
        `Driving time of ${drivingTime.toFixed(1)}h exceeds recommended limit of ${limits.maxDailyDrivingTime}h`
      );
    }

    if (distance > limits.maxDailyDistance * 1.2) {
      warnings.push('This is a very long driving day - consider splitting into multiple days');
    }

    if (season === 'winter' && distance > limits.maxDailyDistance * 0.8) {
      warnings.push('Winter driving conditions - allow extra time and reduce daily distance');
    }

    return warnings;
  }

  /**
   * Generate recommendations for daily stages
   */
  static generateDayRecommendations(
    distance: number,
    drivingTime: number,
    limits: DrivingLimits,
    season: string
  ): string[] {
    const recommendations: string[] = [];

    if (drivingTime > 4) {
      recommendations.push('Plan multiple rest stops for this long driving day');
    }

    if (distance < limits.maxDailyDistance * 0.5) {
      recommendations.push('Light driving day - perfect opportunity for sightseeing');
    }

    if (season === 'summer' && distance > limits.maxDailyDistance * 0.8) {
      recommendations.push('Start early to avoid afternoon heat and traffic');
    }

    if (season === 'winter') {
      recommendations.push('Check weather conditions and road status before departure');
    }

    return recommendations;
  }

  /**
   * Analyze overall trip feasibility
   */
  static analyzeFeasibility(
    stages: DailyStage[],
    limits: DrivingLimits
  ): {
    score: number;
    overall: TripPlan['overallFeasibility'];
    warnings: string[];
    recommendations: string[];
  } {
    let totalScore = 0;
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Analyze individual stages
    stages.forEach((stage, _index) => {
      let stageScore = 100;

      if (stage.feasibility === 'excellent') stageScore = 100;
      else if (stage.feasibility === 'good') stageScore = 80;
      else if (stage.feasibility === 'challenging') stageScore = 60;
      else if (stage.feasibility === 'unrealistic') stageScore = 30;

      totalScore += stageScore;

      // Add stage-specific warnings
      if (stage.feasibility === 'unrealistic') {
        warnings.push(`Day ${stage.day}: Unrealistic driving distance/time`);
      }
    });

    // Analyze overall patterns
    const avgDistance = stages.reduce((sum, s) => sum + s.distance, 0) / stages.length;
    const consecutiveIntensiveDays = this.findConsecutiveIntensiveDays(stages);

    if (avgDistance > limits.maxDailyDistance * 0.9) {
      warnings.push('Overall trip intensity is very high - consider adding rest days');
      totalScore *= 0.9;
    }

    if (consecutiveIntensiveDays >= 3) {
      warnings.push('Multiple consecutive intensive driving days detected');
      recommendations.push('Consider adding rest days between intensive driving periods');
      totalScore *= 0.85;
    }

    if (stages.length > 14) {
      recommendations.push('Long trip - ensure adequate rest and recovery time');
    }

    // Calculate final score
    const finalScore = (totalScore / stages.length) * (stages.length <= 21 ? 1 : 0.9);

    let overall: TripPlan['overallFeasibility'];
    if (finalScore >= 85) overall = 'excellent';
    else if (finalScore >= 70) overall = 'good';
    else if (finalScore >= 50) overall = 'challenging';
    else overall = 'unrealistic';

    return {
      score: Math.round(finalScore),
      overall,
      warnings,
      recommendations,
    };
  }

  /**
   * Get seasonal factors for planning
   */
  static getSeasonalFactors(
    season: 'spring' | 'summer' | 'autumn' | 'winter',
    countries: string[]
  ): SeasonalFactors {
    const baseFactors = {
      spring: {
        season: 'spring' as const,
        temperature: { min: 8, max: 18 },
        precipitation: 'medium' as const,
        touristDensity: 'medium' as const,
        campsiteAvailability: 'good' as const,
        drivingConditions: 'good' as const,
        recommendations: [
          'Perfect weather for touring, but pack layers',
          'Some mountain passes may still be closed',
          'Booking campsite in advance recommended',
        ],
        warnings: [
          'Variable weather conditions possible',
          'Some seasonal businesses may not be open yet',
        ],
      },
      summer: {
        season: 'summer' as const,
        temperature: { min: 15, max: 28 },
        precipitation: 'low' as const,
        touristDensity: 'high' as const,
        campsiteAvailability: 'limited' as const,
        drivingConditions: 'excellent' as const,
        recommendations: [
          'Book accommodations well in advance',
          'Start driving early to avoid heat and traffic',
          'Stay hydrated and use sun protection',
        ],
        warnings: [
          'Peak tourist season - expect crowds and higher prices',
          'Extreme heat possible in southern regions',
        ],
      },
      autumn: {
        season: 'autumn' as const,
        temperature: { min: 5, max: 15 },
        precipitation: 'medium' as const,
        touristDensity: 'low' as const,
        campsiteAvailability: 'good' as const,
        drivingConditions: 'good' as const,
        recommendations: [
          'Beautiful fall colors and fewer crowds',
          'Pack warm clothing for cooler evenings',
          'Great time for wine regions',
        ],
        warnings: ['Some campsites may close for winter', 'Daylight hours are decreasing'],
      },
      winter: {
        season: 'winter' as const,
        temperature: { min: -5, max: 8 },
        precipitation: 'high' as const,
        touristDensity: 'low' as const,
        campsiteAvailability: 'poor' as const,
        drivingConditions: 'challenging' as const,
        recommendations: [
          'Focus on southern routes and cities',
          'Book heated accommodations',
          'Carry winter driving equipment',
        ],
        warnings: [
          'Many campsites closed in northern regions',
          'Snow and ice possible - check road conditions',
          'Shorter daylight hours limit driving time',
        ],
      },
    };

    const factors = baseFactors[season];

    // Adjust based on countries
    if (countries.some(c => ['Norway', 'Sweden', 'Finland'].includes(c))) {
      if (season === 'winter') {
        return {
          ...factors,
          temperature: { min: -15, max: 0 },
          drivingConditions: 'challenging' as const,
          warnings: [...factors.warnings, 'Arctic conditions possible', 'Winter tires mandatory'],
        } as typeof factors;
      }
    }

    if (countries.some(c => ['Spain', 'Portugal', 'Italy', 'Greece'].includes(c))) {
      if (season === 'summer') {
        return {
          ...factors,
          temperature: { min: 20, max: 40 },
          warnings: [
            ...factors.warnings,
            'Extreme heat in inland areas',
            'Air conditioning essential',
          ],
        } as typeof factors;
      }
    }

    return factors;
  }

  /**
   * Calculate trip metrics for analysis
   */
  static calculateTripMetrics(plan: TripPlan, _vehicleProfile?: VehicleProfile): TripMetrics {
    const avgDailyDistance = plan.totalDistance / plan.totalDays;
    const restRatio = plan.restDays / plan.totalDays;

    // Calculate variety score based on countries and waypoint types
    const countries = new Set(
      plan.dailyStages.map(s => this.getCountryFromWaypoint(s.endWaypoint))
    );
    const waypointTypes = new Set(plan.dailyStages.map(s => s.endWaypoint.type));
    const varietyScore = Math.min(100, countries.size * 20 + waypointTypes.size * 10);

    // Calculate difficulty score
    const intensiveDays = plan.dailyStages.filter(
      s => s.feasibility === 'challenging' || s.feasibility === 'unrealistic'
    ).length;
    const difficultyScore = Math.min(
      100,
      (intensiveDays / plan.dailyStages.length) * 100 + (avgDailyDistance / 500) * 50
    );

    // Determine comfort level
    let comfortLevel: TripMetrics['comfortLevel'];
    if (avgDailyDistance < 200 && plan.feasibilityScore > 80) comfortLevel = 'relaxed';
    else if (avgDailyDistance < 300 && plan.feasibilityScore > 60) comfortLevel = 'moderate';
    else if (avgDailyDistance < 400 && plan.feasibilityScore > 40) comfortLevel = 'intensive';
    else comfortLevel = 'extreme';

    return {
      drivingIntensity: Math.round(avgDailyDistance),
      restRatio: Math.round(restRatio * 100) / 100,
      varietyScore: Math.round(varietyScore),
      difficultyScore: Math.round(difficultyScore),
      comfortLevel,
      suitability: {
        beginners: comfortLevel === 'relaxed' && difficultyScore < 30,
        families: comfortLevel !== 'extreme' && difficultyScore < 50,
        experienced: true,
        seniors: comfortLevel === 'relaxed' && plan.feasibilityScore > 70,
      },
    };
  }

  /**
   * Generate comprehensive planning recommendations
   */
  static generatePlanningRecommendations(
    plan: TripPlan,
    metrics: TripMetrics,
    season: string,
    vehicleProfile?: VehicleProfile
  ): PlanningRecommendation[] {
    const recommendations: PlanningRecommendation[] = [];

    // Safety recommendations
    if (metrics.difficultyScore > 70) {
      recommendations.push({
        type: 'safety',
        priority: 'high',
        title: 'High Difficulty Trip',
        description: 'This trip has challenging daily stages that may be tiring',
        action: 'Add rest days between intensive driving periods',
        impact: 'Improved safety and enjoyment',
      });
    }

    // Comfort recommendations
    if (metrics.comfortLevel === 'intensive' || metrics.comfortLevel === 'extreme') {
      recommendations.push({
        type: 'comfort',
        priority: 'medium',
        title: 'Intensive Driving Schedule',
        description: 'Multiple long driving days may be exhausting',
        action: 'Consider reducing daily distances or adding overnight stops',
        impact: 'More relaxed and enjoyable travel experience',
      });
    }

    // Season-specific recommendations
    if (season === 'winter') {
      recommendations.push({
        type: 'season',
        priority: 'high',
        title: 'Winter Travel Considerations',
        description: 'Winter conditions require special preparation',
        action: 'Pack winter gear, check road conditions, reduce daily distances',
        impact: 'Safe winter travel',
      });
    }

    // Vehicle-specific recommendations
    if (
      vehicleProfile &&
      vehicleProfile.type === 'motorhome' &&
      vehicleProfile.length &&
      vehicleProfile.length > 8
    ) {
      recommendations.push({
        type: 'route',
        priority: 'medium',
        title: 'Large Vehicle Considerations',
        description: 'Your large motorhome may face restrictions on some routes',
        action: 'Check height and length restrictions, avoid narrow mountain roads',
        impact: 'Avoid routing problems and damage',
      });
    }

    // Cost optimization
    if (plan.dailyStages.some(s => s.accommodationType === 'hotel')) {
      recommendations.push({
        type: 'cost',
        priority: 'low',
        title: 'Accommodation Cost Optimization',
        description: 'Hotel stays increase trip costs significantly',
        action: 'Consider campsites or wild camping where legal',
        impact: 'Reduced accommodation costs',
      });
    }

    // Timing recommendations
    if (plan.dailyStages.length > 14) {
      recommendations.push({
        type: 'timing',
        priority: 'medium',
        title: 'Extended Trip Duration',
        description: 'Long trips require careful planning and preparation',
        action: 'Plan for vehicle maintenance, ensure adequate supplies',
        impact: 'Smooth extended travel experience',
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Helper methods
   */
  static calculateRestDays(stages: DailyStage[]): number {
    // Recommend rest days based on trip intensity
    const intensiveDays = stages.filter(s => s.distance > 300 || s.drivingTime > 6).length;
    return Math.floor(intensiveDays / 3); // 1 rest day per 3 intensive days
  }

  static findConsecutiveIntensiveDays(stages: DailyStage[]): number {
    let maxConsecutive = 0;
    let currentConsecutive = 0;

    stages.forEach(stage => {
      if (stage.distance > 300 || stage.drivingTime > 6) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    });

    return maxConsecutive;
  }

  static isPointOfInterest(waypoint: Waypoint): boolean {
    if (!waypoint || !waypoint.name) return false;

    // Simple heuristic - in real implementation, would check against POI database
    const poiKeywords = ['castle', 'museum', 'cathedral', 'palace', 'historic', 'scenic'];
    return poiKeywords.some(keyword => waypoint.name.toLowerCase().includes(keyword));
  }

  static getCountryFromWaypoint(waypoint: Waypoint): string {
    // Simplified country detection - in real implementation would use reverse geocoding
    if (waypoint.lat >= 46 && waypoint.lat <= 51 && waypoint.lng >= -5 && waypoint.lng <= 10)
      return 'France';
    if (waypoint.lat >= 47 && waypoint.lat <= 55 && waypoint.lng >= 5 && waypoint.lng <= 15)
      return 'Germany';
    if (waypoint.lat >= 36 && waypoint.lat <= 47 && waypoint.lng >= 6 && waypoint.lng <= 19)
      return 'Italy';
    if (waypoint.lat >= 36 && waypoint.lat <= 44 && waypoint.lng >= -10 && waypoint.lng <= 5)
      return 'Spain';
    return 'Europe';
  }

  static calculateDistance(waypoint1: Waypoint, waypoint2: Waypoint): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((waypoint2.lat - waypoint1.lat) * Math.PI) / 180;
    const dLng = ((waypoint2.lng - waypoint1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((waypoint1.lat * Math.PI) / 180) *
        Math.cos((waypoint2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

// Export singleton instance
export const tripPlanningService = new TripPlanningService();
