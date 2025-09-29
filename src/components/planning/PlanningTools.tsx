// Planning Tools Component
// Phase 5.4: Comprehensive trip planning with intelligent recommendations

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar, Clock, MapPin, AlertTriangle, CheckCircle, Info, TrendingUp,
  Route, Users, Thermometer, Cloud, Car, Bed, Coffee, Camera, Fuel,
  Navigation, Target, BarChart3, Settings, ChevronDown, ChevronUp
} from 'lucide-react';
import { useRouteStore } from '../../store';
import { useVehicleStore } from '../../store';
import {
  TripPlanningService,
  TripPlan,
  DailyStage,
  TripMetrics,
  PlanningRecommendation,
  SeasonalFactors,
  DrivingLimits
} from '../../services/TripPlanningService';

interface PlanningToolsProps {
  className?: string;
  onPlanUpdate?: (plan: TripPlan) => void;
  isVisible?: boolean;
}

type Season = 'spring' | 'summer' | 'autumn' | 'winter';
type ViewMode = 'overview' | 'calendar' | 'recommendations' | 'metrics';

const PlanningTools: React.FC<PlanningToolsProps> = ({
  className = '',
  onPlanUpdate,
  isVisible = true
}) => {
  // Store hooks
  const { waypoints } = useRouteStore();
  const { selectedProfile } = useVehicleStore();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [season, setSeason] = useState<Season>('summer');
  const [startDate, setStartDate] = useState<string>('');
  const [tripPlan, setTripPlan] = useState<TripPlan | null>(null);
  const [metrics, setMetrics] = useState<TripMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<PlanningRecommendation[]>([]);
  const [seasonalFactors, setSeasonalFactors] = useState<SeasonalFactors | null>(null);
  const [drivingLimits, setDrivingLimits] = useState<DrivingLimits | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedStages, setExpandedStages] = useState<Set<number>>(new Set());

  // Calculate plan whenever inputs change
  useEffect(() => {
    if (waypoints.length >= 2) {
      calculateTripPlan();
    } else {
      setTripPlan(null);
      setMetrics(null);
      setRecommendations([]);
    }
  }, [waypoints, selectedProfile, season, startDate]);

  const calculateTripPlan = async () => {
    setIsCalculating(true);
    setError(null);

    try {
      const startDateTime = startDate ? new Date(startDate) : undefined;

      // Create trip plan
      const plan = TripPlanningService.createTripPlan(
        waypoints,
        selectedProfile || undefined,
        startDateTime,
        season
      );

      // Calculate metrics
      const tripMetrics = TripPlanningService.calculateTripMetrics(plan, selectedProfile || undefined);

      // Get driving limits
      const limits = TripPlanningService.getDrivingLimits(selectedProfile || undefined, season);

      // Generate recommendations
      const planningRecs = TripPlanningService.generatePlanningRecommendations(
        plan,
        tripMetrics,
        season,
        selectedProfile || undefined
      );

      // Get seasonal factors
      const countries = [...new Set(plan.dailyStages.map(s =>
        TripPlanningService.getCountryFromWaypoint(s.endWaypoint)
      ))];
      const seasonal = TripPlanningService.getSeasonalFactors(season, countries);

      setTripPlan(plan);
      setMetrics(tripMetrics);
      setRecommendations(planningRecs);
      setSeasonalFactors(seasonal);
      setDrivingLimits(limits);

      if (onPlanUpdate) {
        onPlanUpdate(plan);
      }

    } catch (err) {
      console.error('Trip planning error:', err);
      setError('Failed to calculate trip plan. Please check your route.');
    } finally {
      setIsCalculating(false);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const getFeasibilityColor = (feasibility: DailyStage['feasibility']): string => {
    switch (feasibility) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'challenging': return 'text-yellow-600 bg-yellow-100';
      case 'unrealistic': return 'text-red-600 bg-red-100';
    }
  };

  const getPriorityColor = (priority: PlanningRecommendation['priority']): string => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
    }
  };

  const getTypeIcon = (type: PlanningRecommendation['type']) => {
    switch (type) {
      case 'safety': return <AlertTriangle className="w-4 h-4" />;
      case 'comfort': return <Users className="w-4 h-4" />;
      case 'cost': return <TrendingUp className="w-4 h-4" />;
      case 'timing': return <Clock className="w-4 h-4" />;
      case 'season': return <Thermometer className="w-4 h-4" />;
      case 'route': return <Route className="w-4 h-4" />;
    }
  };

  const getStopIcon = (type: string) => {
    switch (type) {
      case 'overnight': return <Bed className="w-4 h-4" />;
      case 'sightseeing': return <Camera className="w-4 h-4" />;
      case 'lunch': return <Coffee className="w-4 h-4" />;
      case 'fuel': return <Fuel className="w-4 h-4" />;
      case 'rest': return <Clock className="w-4 h-4" />;
    }
  };

  const toggleStageExpansion = (day: number) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(day)) {
      newExpanded.delete(day);
    } else {
      newExpanded.add(day);
    }
    setExpandedStages(newExpanded);
  };

  if (!isVisible) return null;

  return (
    <div className={`bg-white rounded-lg shadow-lg border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-800">Trip Planning Tools</h3>
        </div>
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Planning Controls */}
      <div className="p-4 border-b bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Season Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Travel Season
            </label>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value as Season)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="spring">Spring (Mar-May)</option>
              <option value="summer">Summer (Jun-Aug)</option>
              <option value="autumn">Autumn (Sep-Nov)</option>
              <option value="winter">Winter (Dec-Feb)</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date (Optional)
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          {/* Vehicle Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle Type
            </label>
            <div className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg text-sm">
              <Car className="w-4 h-4 text-gray-400" />
              <span className="capitalize">
                {selectedProfile?.type || 'Default'}
                {selectedProfile?.length && ` (${selectedProfile.length}m)`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b bg-gray-50">
        {[
          { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'calendar', label: 'Daily Plan', icon: <Calendar className="w-4 h-4" /> },
          { id: 'recommendations', label: 'Tips', icon: <CheckCircle className="w-4 h-4" /> },
          { id: 'metrics', label: 'Analysis', icon: <TrendingUp className="w-4 h-4" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id as ViewMode)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              viewMode === tab.id
                ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="p-4">
        {isCalculating ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-gray-600">Calculating trip plan...</span>
          </div>
        ) : waypoints.length < 2 ? (
          <div className="text-center py-8 text-gray-500">
            <Navigation className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Add at least 2 waypoints to your route to start planning.</p>
          </div>
        ) : !tripPlan ? (
          <div className="text-center py-8 text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Unable to create trip plan. Please check your route.</p>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {viewMode === 'overview' && (
              <div className="space-y-4">
                {/* Trip Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-600 font-medium">Duration</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-800">{tripPlan.totalDays}</div>
                    <div className="text-sm text-blue-600">days total</div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Route className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">Distance</span>
                    </div>
                    <div className="text-2xl font-bold text-green-800">
                      {Math.round(tripPlan.totalDistance)}
                    </div>
                    <div className="text-sm text-green-600">km total</div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span className="text-sm text-purple-600 font-medium">Driving</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-800">
                      {Math.round(tripPlan.totalDrivingTime)}
                    </div>
                    <div className="text-sm text-purple-600">hours total</div>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-orange-600" />
                      <span className="text-sm text-orange-600 font-medium">Feasibility</span>
                    </div>
                    <div className="text-xl font-bold text-orange-800 capitalize">
                      {tripPlan.overallFeasibility}
                    </div>
                    <div className="text-sm text-orange-600">{tripPlan.feasibilityScore}% score</div>
                  </div>
                </div>

                {/* Driving Limits Display */}
                {drivingLimits && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-3">Daily Driving Limits (Based on Vehicle & Season)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Max Distance:</span>
                        <div className="font-semibold">{drivingLimits.maxDailyDistance}km</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Max Time:</span>
                        <div className="font-semibold">{drivingLimits.maxDailyDrivingTime}h</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Break Every:</span>
                        <div className="font-semibold">{drivingLimits.recommendedBreakInterval}h</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Average Speed:</span>
                        <div className="font-semibold">{drivingLimits.averageSpeed}km/h</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Seasonal Information */}
                {seasonalFactors && (
                  <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Thermometer className="w-4 h-4 text-blue-600" />
                      <h4 className="font-medium text-gray-800 capitalize">{season} Travel Conditions</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600 mb-2">Expected Conditions:</div>
                        <div className="space-y-1 text-sm">
                          <div>Temperature: {seasonalFactors.temperature.min}°C - {seasonalFactors.temperature.max}°C</div>
                          <div>Tourist Density: <span className="capitalize">{seasonalFactors.touristDensity}</span></div>
                          <div>Campsite Availability: <span className="capitalize">{seasonalFactors.campsiteAvailability}</span></div>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-2">Top Recommendations:</div>
                        <ul className="space-y-1 text-sm">
                          {seasonalFactors.recommendations.slice(0, 3).map((rec, index) => (
                            <li key={index} className="flex items-start gap-1">
                              <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Warnings */}
                {tripPlan.warnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <h4 className="font-medium text-yellow-800">Important Warnings</h4>
                    </div>
                    <ul className="space-y-1">
                      {tripPlan.warnings.slice(0, 3).map((warning, index) => (
                        <li key={index} className="text-sm text-yellow-700">• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Calendar/Daily Plan Tab */}
            {viewMode === 'calendar' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-800">Daily Itinerary</h4>
                  <div className="text-sm text-gray-600">
                    {tripPlan.dailyStages.length} driving days + {tripPlan.restDays} rest days
                  </div>
                </div>

                {tripPlan.dailyStages.map((stage, index) => (
                  <div key={stage.day} className="border rounded-lg overflow-hidden">
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleStageExpansion(stage.day)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-semibold">
                            {stage.day}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">
                              {stage.startWaypoint.name} → {stage.endWaypoint.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {stage.date && formatDate(stage.date)} • {Math.round(stage.distance)}km • {formatDuration(stage.drivingTime)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFeasibilityColor(stage.feasibility)}`}>
                            {stage.feasibility}
                          </span>
                          {expandedStages.has(stage.day) ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {expandedStages.has(stage.day) && (
                      <div className="px-4 pb-4 border-t bg-gray-50">
                        {/* Stage Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Accommodation</div>
                            <div className="flex items-center gap-1 text-sm">
                              <Bed className="w-4 h-4 text-gray-400" />
                              <span className="capitalize">{stage.accommodationType.replace('_', ' ')}</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Average Speed</div>
                            <div className="text-sm">{Math.round(stage.distance / stage.drivingTime)}km/h</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Stops Planned</div>
                            <div className="text-sm">{stage.stops.length} stops</div>
                          </div>
                        </div>

                        {/* Planned Stops */}
                        {stage.stops.length > 0 && (
                          <div className="mb-4">
                            <div className="text-sm text-gray-600 mb-2">Planned Stops:</div>
                            <div className="space-y-2">
                              {stage.stops.map((stop, stopIndex) => (
                                <div key={stopIndex} className="flex items-center gap-2 text-sm">
                                  {getStopIcon(stop.type)}
                                  <span className="capitalize">{stop.type.replace('_', ' ')}</span>
                                  <span className="text-gray-600">({formatDuration(stop.recommendedDuration)})</span>
                                  <span className="text-gray-500">- {stop.reasoning}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Stage Warnings */}
                        {stage.warnings.length > 0 && (
                          <div className="mb-3">
                            <div className="text-sm text-red-600 font-medium mb-1">Warnings:</div>
                            <ul className="space-y-1">
                              {stage.warnings.map((warning, wIndex) => (
                                <li key={wIndex} className="text-sm text-red-700 flex items-start gap-1">
                                  <AlertTriangle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                                  {warning}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Stage Recommendations */}
                        {stage.recommendations.length > 0 && (
                          <div>
                            <div className="text-sm text-blue-600 font-medium mb-1">Recommendations:</div>
                            <ul className="space-y-1">
                              {stage.recommendations.map((rec, rIndex) => (
                                <li key={rIndex} className="text-sm text-blue-700 flex items-start gap-1">
                                  <Info className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Recommendations Tab */}
            {viewMode === 'recommendations' && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-800 mb-4">
                  Planning Recommendations ({recommendations.length})
                </h4>

                {recommendations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No specific recommendations - your trip plan looks great!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recommendations.map((rec, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full ${getPriorityColor(rec.priority)}`}>
                            {getTypeIcon(rec.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h5 className="font-medium text-gray-800">{rec.title}</h5>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                                {rec.priority} priority
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                            <div className="text-sm">
                              <span className="font-medium text-gray-700">Action: </span>
                              <span className="text-gray-600">{rec.action}</span>
                            </div>
                            <div className="text-sm mt-1">
                              <span className="font-medium text-gray-700">Impact: </span>
                              <span className="text-gray-600">{rec.impact}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Seasonal Warnings */}
                {seasonalFactors && seasonalFactors.warnings.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Cloud className="w-4 h-4 text-orange-600" />
                      <h5 className="font-medium text-orange-800">Seasonal Considerations</h5>
                    </div>
                    <ul className="space-y-1">
                      {seasonalFactors.warnings.map((warning, index) => (
                        <li key={index} className="text-sm text-orange-700 flex items-start gap-1">
                          <AlertTriangle className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Metrics Tab */}
            {viewMode === 'metrics' && metrics && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-800 mb-4">Trip Analysis & Metrics</h4>

                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Route className="w-4 h-4 text-blue-600" />
                      <h5 className="font-medium text-blue-800">Driving Intensity</h5>
                    </div>
                    <div className="text-2xl font-bold text-blue-800 mb-1">
                      {metrics.drivingIntensity}km
                    </div>
                    <div className="text-sm text-blue-600">average per day</div>
                    <div className="text-sm text-gray-600 mt-2">
                      Comfort Level: <span className="font-medium capitalize">{metrics.comfortLevel}</span>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <h5 className="font-medium text-green-800">Trip Variety</h5>
                    </div>
                    <div className="text-2xl font-bold text-green-800 mb-1">
                      {metrics.varietyScore}
                    </div>
                    <div className="text-sm text-green-600">variety score</div>
                    <div className="text-sm text-gray-600 mt-2">
                      Rest Ratio: {(metrics.restRatio * 100).toFixed(0)}%
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-purple-600" />
                      <h5 className="font-medium text-purple-800">Difficulty Score</h5>
                    </div>
                    <div className="text-2xl font-bold text-purple-800 mb-1">
                      {metrics.difficultyScore}
                    </div>
                    <div className="text-sm text-purple-600">out of 100</div>
                    <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${Math.min(100, metrics.difficultyScore)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4 text-orange-600" />
                      <h5 className="font-medium text-orange-800">Trip Suitability</h5>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Beginners:</span>
                        <span className={metrics.suitability.beginners ? 'text-green-600' : 'text-red-600'}>
                          {metrics.suitability.beginners ? '✓ Suitable' : '✗ Not recommended'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Families:</span>
                        <span className={metrics.suitability.families ? 'text-green-600' : 'text-red-600'}>
                          {metrics.suitability.families ? '✓ Suitable' : '✗ Not recommended'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Seniors:</span>
                        <span className={metrics.suitability.seniors ? 'text-green-600' : 'text-red-600'}>
                          {metrics.suitability.seniors ? '✓ Suitable' : '✗ Not recommended'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Analysis */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-800 mb-3">Detailed Analysis</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600 mb-2">Trip Characteristics:</div>
                      <ul className="space-y-1">
                        <li>• Total driving days: {tripPlan.dailyStages.length}</li>
                        <li>• Recommended rest days: {tripPlan.restDays}</li>
                        <li>• Average daily distance: {metrics.drivingIntensity}km</li>
                        <li>• Total driving time: {Math.round(tripPlan.totalDrivingTime)}h</li>
                      </ul>
                    </div>
                    <div>
                      <div className="text-gray-600 mb-2">Planning Insights:</div>
                      <ul className="space-y-1">
                        <li>• Comfort level: {metrics.comfortLevel}</li>
                        <li>• Difficulty: {metrics.difficultyScore}/100</li>
                        <li>• Route variety: {metrics.varietyScore}/100</li>
                        <li>• Feasibility: {tripPlan.feasibilityScore}%</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PlanningTools;