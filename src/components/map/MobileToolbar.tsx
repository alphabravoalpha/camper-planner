// Mobile Toolbar Component
// Replaces passive mobile bottom bar with interactive tool buttons

import React, { useState } from 'react';
import { Truck, MapPin, FileText, Wrench, Trash2, Navigation, Settings2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { type RouteResponse } from '../../services/RoutingService';

interface MobileToolbarProps {
  waypointCount: number;
  calculatedRoute: RouteResponse | null;
  campsitesVisible: boolean;
  showCampsiteControls: boolean;
  showCampsiteFilter: boolean;
  showRouteInfo: boolean;
  showTripManager: boolean;
  showPlanningTools: boolean;
  showCostCalculator: boolean;
  showTripSettings: boolean;
  onToggleTripSettings: () => void;
  onToggleCampsiteControls: () => void;
  onToggleRouteInfo: () => void;
  onToggleTripManager: () => void;
  onTogglePlanningTools: () => void;
  onToggleCostCalculator: () => void;
  onOpenVehicleSidebar: () => void;
  onClearWaypoints: () => void;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(0)}km`;
  }
  return `${meters.toFixed(0)}m`;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
  }
  return `${mins}m`;
}

const MobileToolbar: React.FC<MobileToolbarProps> = ({
  waypointCount,
  calculatedRoute,
  showCampsiteControls,
  showCampsiteFilter,
  showRouteInfo,
  showTripManager,
  showPlanningTools,
  showCostCalculator,
  showTripSettings,
  onToggleTripSettings,
  onToggleCampsiteControls,
  onToggleRouteInfo,
  onToggleTripManager,
  onTogglePlanningTools,
  onToggleCostCalculator,
  onOpenVehicleSidebar,
  onClearWaypoints,
}) => {
  const [showTools, setShowTools] = useState(false);
  const route = calculatedRoute?.routes?.[0];
  const hasRoute = !!route;
  const campsiteActive = showCampsiteControls || showCampsiteFilter;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 sm:hidden">
      {/* Tools submenu (Settings, Trip Manager, Planning, Cost Calculator) */}
      {showTools && (
        <div className="bg-white border-t border-neutral-200 px-3 py-2 flex gap-2 animate-fade-in">
          <button
            onClick={() => {
              onToggleTripSettings();
              setShowTools(false);
            }}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-colors',
              showTripSettings
                ? 'bg-sky-100 text-sky-700'
                : 'bg-neutral-100 text-neutral-700 active:bg-neutral-200'
            )}
          >
            <Settings2 className="w-4 h-4" />
            Settings
          </button>
          <button
            onClick={() => {
              onToggleTripManager();
              setShowTools(false);
            }}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-colors',
              showTripManager
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-neutral-100 text-neutral-700 active:bg-neutral-200'
            )}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            Trips
          </button>
          <button
            onClick={() => {
              onTogglePlanningTools();
              setShowTools(false);
            }}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-colors',
              showPlanningTools
                ? 'bg-violet-100 text-violet-700'
                : 'bg-neutral-100 text-neutral-700 active:bg-neutral-200'
            )}
            disabled={waypointCount < 2}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Planning
          </button>
          <button
            onClick={() => {
              onToggleCostCalculator();
              setShowTools(false);
            }}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-colors',
              showCostCalculator
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-neutral-100 text-neutral-700 active:bg-neutral-200'
            )}
            disabled={waypointCount < 2}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Costs
          </button>
        </div>
      )}

      {/* Main toolbar */}
      <div className="bg-white/95 backdrop-blur-sm border-t border-neutral-200 px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-1">
          {/* Waypoint count + route summary */}
          <div className="flex-1 min-w-0 px-1.5">
            <div className="flex items-center gap-1.5 text-xs">
              <Navigation className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" />
              <span className="text-neutral-700 font-medium truncate">
                {waypointCount === 0 ? (
                  'Tap map to start'
                ) : hasRoute ? (
                  <>
                    {formatDistance(route.summary.distance)} ·{' '}
                    {formatDuration(route.summary.duration)}
                  </>
                ) : waypointCount === 1 ? (
                  'Add another point'
                ) : (
                  `${waypointCount} points`
                )}
              </span>
            </div>
          </div>

          {/* Tool buttons */}
          <div className="flex items-center gap-0.5">
            {/* Vehicle */}
            <button
              onClick={onOpenVehicleSidebar}
              className="w-10 h-10 flex items-center justify-center rounded-lg text-neutral-600 active:bg-neutral-100 transition-colors"
              aria-label="Vehicle settings"
            >
              <Truck className="w-5 h-5" />
            </button>

            {/* Campsites */}
            <button
              onClick={onToggleCampsiteControls}
              className={cn(
                'w-10 h-10 flex items-center justify-center rounded-lg transition-colors',
                campsiteActive
                  ? 'bg-green-100 text-green-700'
                  : 'text-neutral-600 active:bg-neutral-100'
              )}
              aria-label="Campsite controls"
            >
              <MapPin className="w-5 h-5" />
            </button>

            {/* Route Info */}
            {hasRoute && (
              <button
                onClick={onToggleRouteInfo}
                className={cn(
                  'w-10 h-10 flex items-center justify-center rounded-lg transition-colors',
                  showRouteInfo
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-neutral-600 active:bg-neutral-100'
                )}
                aria-label="Route information"
              >
                <FileText className="w-5 h-5" />
              </button>
            )}

            {/* Tools (Trip Manager, Planning, Cost) */}
            <button
              onClick={() => setShowTools(!showTools)}
              className={cn(
                'w-10 h-10 flex items-center justify-center rounded-lg transition-colors',
                showTools ||
                  showTripSettings ||
                  showTripManager ||
                  showPlanningTools ||
                  showCostCalculator
                  ? 'bg-violet-100 text-violet-700'
                  : 'text-neutral-600 active:bg-neutral-100'
              )}
              aria-label="Trip plan"
            >
              <Wrench className="w-5 h-5" />
            </button>

            {/* Clear */}
            {waypointCount > 0 && (
              <button
                onClick={onClearWaypoints}
                className="w-10 h-10 flex items-center justify-center rounded-lg text-red-500 active:bg-red-50 transition-colors"
                aria-label="Clear waypoints"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileToolbar;
