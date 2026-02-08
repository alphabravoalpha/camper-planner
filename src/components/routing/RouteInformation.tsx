// Route Information Component
// Phase 3.4: Comprehensive route information display with turn-by-turn directions

import React, { useState, useMemo } from 'react';
import { useRouteStore, useVehicleStore } from '../../store';
import { type RouteResponse, type RouteSegment } from '../../services/RoutingService';
import ElevationProfile from './ElevationProfile';
import { cn } from '../../utils/cn';

interface RouteInformationProps {
  className?: string;
  compact?: boolean;
}

// Route Summary Component
const RouteSummary: React.FC<{ route: RouteResponse; compact?: boolean }> = ({ route, compact }) => {
  const { profile } = useVehicleStore();

  if (!route.routes.length) return null;

  const mainRoute = route.routes[0];
  const { distance, duration } = mainRoute.summary;

  // Convert units
  const distanceKm = Math.round(distance / 1000 * 10) / 10;
  const hours = Math.floor(duration / 3600);
  const minutes = Math.round((duration % 3600) / 60);

  // Calculate compatibility score
  const getCompatibilityScore = () => {
    if (route.restrictions?.cannotAccommodate) return 'incompatible';
    if (route.restrictions?.violatedDimensions?.length) return 'restricted';
    if (route.warnings?.length) return 'limited';
    return 'compatible';
  };

  const compatibility = getCompatibilityScore();

  if (compact) {
    return (
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{distanceKm} km</span>
        <span className="text-neutral-600">{hours}h {minutes}m</span>
        <div className={cn(
          "w-2 h-2 rounded-full",
          compatibility === 'compatible' && 'bg-green-500',
          compatibility === 'limited' && 'bg-yellow-500',
          compatibility === 'restricted' && 'bg-orange-500',
          compatibility === 'incompatible' && 'bg-red-500'
        )} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-neutral-900">Route Summary</h3>
        <span className="text-sm text-neutral-500 capitalize">{route.metadata.service}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-primary-50 rounded-lg">
          <div className="text-2xl font-bold text-primary-900">{distanceKm}</div>
          <div className="text-sm text-primary-700">kilometers</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-900">{hours}h {minutes}m</div>
          <div className="text-sm text-green-700">travel time</div>
        </div>
      </div>

      {/* Vehicle Compatibility */}
      <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
        <span className="text-sm font-medium text-neutral-700">Vehicle Compatibility</span>
        <div className="flex items-center space-x-2">
          <div className={cn(
            "w-3 h-3 rounded-full",
            compatibility === 'compatible' && 'bg-green-500',
            compatibility === 'limited' && 'bg-yellow-500',
            compatibility === 'restricted' && 'bg-orange-500',
            compatibility === 'incompatible' && 'bg-red-500'
          )} />
          <span className={cn(
            "text-sm font-medium capitalize",
            compatibility === 'compatible' && 'text-green-700',
            compatibility === 'limited' && 'text-yellow-700',
            compatibility === 'restricted' && 'text-orange-700',
            compatibility === 'incompatible' && 'text-red-700'
          )}>
            {compatibility}
          </span>
        </div>
      </div>

      {/* Vehicle Profile Info */}
      {profile && (
        <div className="mt-3 text-xs text-neutral-600">
          Vehicle: {profile.height}m H × {profile.width}m W × {profile.weight}t × {profile.length}m L
        </div>
      )}
    </div>
  );
};

// Route Segments Component
const RouteSegments: React.FC<{ segments: RouteSegment[] }> = ({ segments }) => {
  if (!segments.length) return null;

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      <h3 className="text-lg font-semibold text-neutral-900 mb-3">Route Segments</h3>

      <div className="space-y-3">
        {segments.map((segment, index) => {
          const distanceKm = Math.round(segment.distance / 1000 * 10) / 10;
          const hours = Math.floor(segment.duration / 3600);
          const minutes = Math.round((segment.duration % 3600) / 60);

          return (
            <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-900">{index + 1}</span>
                </div>
                <div>
                  <div className="font-medium text-neutral-900">Segment {index + 1}</div>
                  <div className="text-sm text-neutral-600">{distanceKm} km</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-neutral-900">{hours > 0 ? `${hours}h ` : ''}{minutes}m</div>
                <div className="text-sm text-neutral-600">travel time</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Turn-by-Turn Directions Component
const TurnByTurnDirections: React.FC<{ segments: RouteSegment[] }> = ({ segments }) => {
  const [_expandedSegment, _setExpandedSegment] = useState<number | null>(0);

  const allSteps = useMemo(() => {
    return segments.flatMap((segment, segmentIndex) =>
      (segment.steps || []).map((step, stepIndex) => ({
        ...step,
        segmentIndex,
        stepIndex,
        id: `${segmentIndex}-${stepIndex}`
      }))
    );
  }, [segments]);

  if (!allSteps.length) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <h3 className="text-lg font-semibold text-neutral-900 mb-3">Turn-by-Turn Directions</h3>
        <div className="text-center py-6 text-neutral-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 01.553-.894L9 2l6 3 6-3v15l-6 3-6-3z" />
          </svg>
          <p>Detailed turn-by-turn directions not available</p>
          <p className="text-sm">Try recalculating with OpenRouteService for detailed instructions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200">
      <div className="p-4 border-b border-neutral-200">
        <h3 className="text-lg font-semibold text-neutral-900">Turn-by-Turn Directions</h3>
        <p className="text-sm text-neutral-600 mt-1">{allSteps.length} instructions</p>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {allSteps.map((step, index) => {
          const distanceKm = step.distance > 1000
            ? `${Math.round(step.distance / 1000 * 10) / 10} km`
            : `${Math.round(step.distance)} m`;

          return (
            <div key={step.id} className={cn(
              "flex items-start space-x-3 p-4 border-b border-neutral-100 hover:bg-neutral-50 transition-colors",
              index === allSteps.length - 1 && "border-b-0"
            )}>
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-primary-900">{index + 1}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-neutral-900 mb-1">
                  {step.instruction}
                </div>
                {step.name && (
                  <div className="text-sm text-neutral-600 mb-1">
                    on <span className="font-medium">{step.name}</span>
                  </div>
                )}
                <div className="text-xs text-neutral-500">
                  Continue for {distanceKm}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Main Route Information Component
const RouteInformation: React.FC<RouteInformationProps> = ({ className, compact = false }) => {
  const { calculatedRoute } = useRouteStore();
  const [activeTab, setActiveTab] = useState<'summary' | 'segments' | 'directions' | 'elevation'>('summary');

  if (!calculatedRoute || !calculatedRoute.routes.length) {
    return (
      <div className={cn('bg-white rounded-lg border border-neutral-200 p-6', className)}>
        <div className="text-center text-neutral-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 01.553-.894L9 2l6 3 6-3v15l-6 3-6-3z" />
          </svg>
          <h3 className="text-lg font-medium text-neutral-900 mb-1">No Route Information</h3>
          <p>Calculate a route to see detailed information</p>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={cn('bg-white rounded-lg border border-neutral-200 p-3', className)}>
        <RouteSummary route={calculatedRoute} compact />
      </div>
    );
  }

  const mainRoute = calculatedRoute.routes[0];

  return (
    <div className={cn('bg-white rounded-lg border border-neutral-200', className)}>
      {/* Tab Navigation */}
      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex space-x-8 px-4">
          {[
            { id: 'summary', label: 'Summary', icon: '📊' },
            { id: 'segments', label: 'Segments', icon: '🛣️' },
            { id: 'directions', label: 'Directions', icon: '🧭' },
            { id: 'elevation', label: 'Elevation', icon: '⛰️' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              )}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'summary' && <RouteSummary route={calculatedRoute} />}
        {activeTab === 'segments' && <RouteSegments segments={mainRoute.segments} />}
        {activeTab === 'directions' && <TurnByTurnDirections segments={mainRoute.segments} />}
        {activeTab === 'elevation' && <ElevationProfile route={mainRoute} />}
      </div>
    </div>
  );
};

export default RouteInformation;