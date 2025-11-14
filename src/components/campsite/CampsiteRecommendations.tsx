// Campsite Recommendations Component
// Phase 4.4: Smart campsite recommendations for trip planning

import React, { useState, useMemo } from 'react';
import { FeatureFlags } from '../../config';
import type { Campsite } from '../../services/CampsiteService';
import { CampsiteRecommendationService } from '../../services/CampsiteRecommendationService';
import type { RecommendationCriteria, CampsiteRecommendation } from '../../services/CampsiteRecommendationService';
import { useRouteStore, useVehicleStore, useUIStore } from '../../store';
import { cn } from '../../utils/cn';

export interface CampsiteRecommendationsProps {
  campsites: Campsite[];
  onCampsiteSelect?: (campsite: Campsite) => void;
  onAddAsWaypoint?: (campsite: Campsite) => void;
  className?: string;
  maxRecommendations?: number;
}

const CampsiteRecommendations: React.FC<CampsiteRecommendationsProps> = ({
  campsites,
  onCampsiteSelect,
  onAddAsWaypoint,
  className,
  maxRecommendations = 5
}) => {
  const [scenario, setScenario] = useState<'tonight' | 'route-planning' | 'weekend-trip' | 'custom'>('route-planning');
  const [customCriteria, setCustomCriteria] = useState<Partial<RecommendationCriteria>>({});
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const { calculatedRoute, addWaypoint, waypoints } = useRouteStore();
  const { profile } = useVehicleStore();
  const { addNotification } = useUIStore();

  // Generate recommendations based on current criteria
  const recommendations = useMemo(() => {
    if (campsites.length === 0) return [];

    const routeGeometry = calculatedRoute?.routes?.[0]?.geometry;
    const baseCriteria: RecommendationCriteria = {
      routeGeometry,
      vehicleProfile: profile || undefined,
      maxDistanceFromRoute: 20,
      ...customCriteria
    };

    if (scenario === 'custom') {
      return CampsiteRecommendationService.generateRecommendations(
        campsites,
        baseCriteria,
        maxRecommendations
      ).recommendations;
    } else {
      return CampsiteRecommendationService.getQuickRecommendations(
        campsites,
        scenario,
        baseCriteria
      ).recommendations;
    }
  }, [campsites, scenario, customCriteria, calculatedRoute, profile, maxRecommendations]);

  // Handle adding campsite as waypoint
  const handleAddAsWaypoint = (campsite: CampsiteRecommendation) => {
    const isAlreadyWaypoint = waypoints.some(wp =>
      wp.lat === campsite.lat && wp.lng === campsite.lng
    );

    if (isAlreadyWaypoint) {
      addNotification({
        type: 'warning',
        message: 'This campsite is already in your route'
      });
      return;
    }

    const waypoint = {
      id: `campsite_${campsite.id}`,
      lat: campsite.lat,
      lng: campsite.lng,
      name: campsite.name || `${campsite.type} #${campsite.id}`,
      type: 'campsite' as const
    };

    addWaypoint(waypoint);
    onAddAsWaypoint?.(campsite);

    addNotification({
      type: 'success',
      message: `Added ${waypoint.name} to your route`
    });
  };

  // Get score color
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get cost color
  const getCostColor = (cost: string): string => {
    switch (cost) {
      case 'free': return 'text-green-600';
      case 'low': return 'text-blue-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Don't render if feature disabled
  if (!FeatureFlags.CAMPSITE_DISPLAY) return null;

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-900">Recommended Campsites</h3>
          <span className="text-sm text-gray-500">
            {recommendations.length} recommendations
          </span>
        </div>

        {/* Scenario selector */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Scenario:</label>
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value as any)}
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
          >
            <option value="tonight">Find a spot for tonight</option>
            <option value="route-planning">Plan route stops</option>
            <option value="weekend-trip">Weekend getaway</option>
            <option value="custom">Custom criteria</option>
          </select>
        </div>

        {/* Custom criteria inputs */}
        {scenario === 'custom' && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Max distance from route (km)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={customCriteria.maxDistanceFromRoute || 20}
                  onChange={(e) => setCustomCriteria({
                    ...customCriteria,
                    maxDistanceFromRoute: parseInt(e.target.value) || 20
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Budget preference
                </label>
                <select
                  value={customCriteria.budgetPreference || 'any'}
                  onChange={(e) => setCustomCriteria({
                    ...customCriteria,
                    budgetPreference: e.target.value as any
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="any">Any budget</option>
                  <option value="free">Free only</option>
                  <option value="budget">Budget-friendly</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Camping style
                </label>
                <select
                  value={customCriteria.campingStyle || 'any'}
                  onChange={(e) => setCustomCriteria({
                    ...customCriteria,
                    campingStyle: e.target.value as any
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="any">Any style</option>
                  <option value="wild">Wild/minimal</option>
                  <option value="facilities">Good facilities</option>
                  <option value="luxury">Luxury amenities</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Group size
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={customCriteria.groupSize || 2}
                  onChange={(e) => setCustomCriteria({
                    ...customCriteria,
                    groupSize: parseInt(e.target.value) || 2
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recommendations list */}
      <div className="divide-y divide-gray-200">
        {recommendations.length > 0 ? recommendations.map((campsite, index) => (
          <div key={campsite.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      {index + 1}
                    </span>
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {campsite.name || `${campsite.type} #${campsite.id}`}
                    </h4>
                  </div>

                  <div className="flex items-center space-x-2 ml-2">
                    <span className={cn('text-xs font-medium', getScoreColor(campsite.suitabilityScore))}>
                      {campsite.suitabilityScore}% match
                    </span>
                    <span className={cn('text-xs font-medium', getCostColor(campsite.estimatedCost || 'medium'))}>
                      {campsite.estimatedCost || 'unknown'}
                    </span>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center space-x-4 mb-2 text-xs text-gray-600">
                  <span className="capitalize">{campsite.type.replace('_', ' ')}</span>
                  {campsite.routeDistance && (
                    <span>{campsite.routeDistance.toFixed(1)}km from route</span>
                  )}
                  {campsite.address && (
                    <span className="truncate">{campsite.address}</span>
                  )}
                </div>

                {/* Reasons */}
                <div className="mb-3">
                  {campsite.reasons.slice(0, 2).map((reason, idx) => (
                    <div key={idx} className="flex items-center space-x-1 text-xs text-green-700 mb-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{reason}</span>
                    </div>
                  ))}
                  {campsite.warnings.slice(0, 1).map((warning, idx) => (
                    <div key={idx} className="flex items-center space-x-1 text-xs text-amber-700 mb-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>

                {/* Amenities preview */}
                {campsite.amenities && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {Object.entries(campsite.amenities)
                      .filter(([_, available]) => available)
                      .slice(0, 4)
                      .map(([amenity]) => (
                        <span
                          key={amenity}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                        >
                          {amenity.replace(/_/g, ' ')}
                        </span>
                      ))}
                    {Object.values(campsite.amenities).filter(Boolean).length > 4 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        +{Object.values(campsite.amenities).filter(Boolean).length - 4} more
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => onCampsiteSelect?.(campsite)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Details
                  </button>

                  <button
                    onClick={() => handleAddAsWaypoint(campsite)}
                    className="text-sm text-green-600 hover:text-green-800 font-medium"
                  >
                    Add to Route
                  </button>

                  <button
                    onClick={() => setShowDetails(showDetails === campsite.id ? null : campsite.id)}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    {showDetails === campsite.id ? 'Hide' : 'Show'} Analysis
                  </button>
                </div>

                {/* Detailed analysis */}
                {showDetails === campsite.id && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="font-medium text-gray-900 mb-1">Recommendation Score</div>
                        <div className="text-gray-700">{campsite.recommendationScore}/100</div>
                      </div>

                      <div>
                        <div className="font-medium text-gray-900 mb-1">Suitability</div>
                        <div className="text-gray-700">{campsite.suitabilityScore}% match</div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="font-medium text-gray-900 mb-1">All Reasons</div>
                      <ul className="space-y-0.5 text-gray-700">
                        {campsite.reasons.map((reason, idx) => (
                          <li key={idx}>• {reason}</li>
                        ))}
                      </ul>
                    </div>

                    {campsite.warnings.length > 0 && (
                      <div className="mt-3">
                        <div className="font-medium text-gray-900 mb-1">Considerations</div>
                        <ul className="space-y-0.5 text-amber-700">
                          {campsite.warnings.map((warning, idx) => (
                            <li key={idx}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )) : (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-sm">No campsites match your criteria</p>
            <p className="text-xs text-gray-400 mt-1">
              Try adjusting your filters or scenario
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      {recommendations.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>
              Recommendations based on {scenario.replace('-', ' ')} scenario
            </span>
            <span>
              Generated at {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampsiteRecommendations;