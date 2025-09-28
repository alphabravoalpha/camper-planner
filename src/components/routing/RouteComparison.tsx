// Route Comparison Component
// Phase 3.4: Compare multiple route options with detailed metrics

import React, { useState } from 'react';
import { useRouteStore, useVehicleStore, useUIStore } from '../../store';
import { RouteResponse, RouteData } from '../../services/RoutingService';
import { cn } from '../../utils/cn';

interface RouteComparisonProps {
  className?: string;
}

interface RouteOption {
  id: string;
  route: RouteData;
  label: string;
  isAlternative?: boolean;
  isCurrent?: boolean;
}

const RouteComparison: React.FC<RouteComparisonProps> = ({ className }) => {
  const { calculatedRoute, setCalculatedRoute } = useRouteStore();
  const { profile } = useVehicleStore();
  const { addNotification } = useUIStore();
  const [selectedRoute, setSelectedRoute] = useState<string>('main');

  if (!calculatedRoute) return null;

  // Build route options array
  const routeOptions: RouteOption[] = [
    {
      id: 'main',
      route: calculatedRoute.routes[0],
      label: 'Main Route',
      isCurrent: true
    },
    ...(calculatedRoute.alternativeRoutes || []).map((altRoute, index) => ({
      id: `alt-${index}`,
      route: altRoute,
      label: `Alternative ${index + 1}`,
      isAlternative: true,
      isCurrent: false
    }))
  ];

  // Only show if we have alternatives
  if (routeOptions.length <= 1) return null;

  const switchToRoute = (routeId: string) => {
    const option = routeOptions.find(opt => opt.id === routeId);
    if (!option) return;

    if (routeId === 'main') {
      // Already using main route
      return;
    }

    // Create new route response with selected alternative
    const newRouteResponse: RouteResponse = {
      ...calculatedRoute,
      routes: [option.route],
      id: `selected_${routeId}_${Date.now()}`
    };

    setCalculatedRoute(newRouteResponse);
    setSelectedRoute(routeId);

    addNotification({
      type: 'info',
      message: `Switched to ${option.label.toLowerCase()}`
    });
  };

  const getRouteComparison = (route: RouteData, baseRoute: RouteData) => {
    const distanceDiff = route.summary.distance - baseRoute.summary.distance;
    const timeDiff = route.summary.duration - baseRoute.summary.duration;

    return {
      distanceDiff: Math.round(distanceDiff / 1000 * 10) / 10, // km
      timeDiff: Math.round(timeDiff / 60), // minutes
      distancePercent: Math.round((distanceDiff / baseRoute.summary.distance) * 100),
      timePercent: Math.round((timeDiff / baseRoute.summary.duration) * 100)
    };
  };

  const formatDifference = (value: number, unit: string, isPercent: boolean = false) => {
    const sign = value > 0 ? '+' : '';
    const suffix = isPercent ? '%' : ` ${unit}`;
    return `${sign}${value}${suffix}`;
  };

  const baseRoute = routeOptions[0].route; // Use main route as baseline

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200', className)}>
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Route Comparison</h3>
        <p className="text-sm text-gray-600 mt-1">{routeOptions.length} route options available</p>
      </div>

      <div className="p-4">
        {/* Route Options List */}
        <div className="space-y-3">
          {routeOptions.map((option, index) => {
            const isSelected = selectedRoute === option.id;
            const comparison = index > 0 ? getRouteComparison(option.route, baseRoute) : null;

            const distanceKm = Math.round(option.route.summary.distance / 1000 * 10) / 10;
            const hours = Math.floor(option.route.summary.duration / 3600);
            const minutes = Math.round((option.route.summary.duration % 3600) / 60);

            return (
              <div
                key={option.id}
                className={cn(
                  'relative p-4 rounded-lg border cursor-pointer transition-all',
                  isSelected
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                )}
                onClick={() => switchToRoute(option.id)}
              >
                {/* Route Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                      isSelected
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700'
                    )}>
                      {index === 0 ? '1' : String.fromCharCode(65 + index)} {/* 1, A, B, C... */}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{option.label}</h4>
                      {option.isAlternative && (
                        <div className="text-xs text-gray-500">Alternative route option</div>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex items-center space-x-1 text-blue-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium">Current</span>
                    </div>
                  )}
                </div>

                {/* Route Metrics */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Distance</div>
                    <div className="font-medium">{distanceKm} km</div>
                    {comparison && (
                      <div className={cn(
                        "text-xs",
                        comparison.distanceDiff > 0 ? 'text-red-600' : 'text-green-600'
                      )}>
                        {formatDifference(comparison.distanceDiff, 'km')}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-gray-500">Time</div>
                    <div className="font-medium">{hours}h {minutes}m</div>
                    {comparison && (
                      <div className={cn(
                        "text-xs",
                        comparison.timeDiff > 0 ? 'text-red-600' : 'text-green-600'
                      )}>
                        {formatDifference(comparison.timeDiff, 'min')}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-gray-500">Type</div>
                    <div className="font-medium">
                      {index === 0 ? 'Fastest' : comparison ?
                        (comparison.distanceDiff < 0 ? 'Shorter' : 'Scenic') : 'Alternative'}
                    </div>
                    {profile && (
                      <div className="text-xs text-gray-500">Vehicle safe</div>
                    )}
                  </div>
                </div>

                {/* Route Characteristics */}
                {comparison && (
                  <div className="mt-3 flex items-center space-x-4 text-xs text-gray-600">
                    {Math.abs(comparison.distancePercent) > 10 && (
                      <div className="flex items-center space-x-1">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          comparison.distancePercent > 0 ? 'bg-red-400' : 'bg-green-400'
                        )} />
                        <span>
                          {comparison.distancePercent > 0 ? 'Longer route' : 'Shorter route'}
                        </span>
                      </div>
                    )}
                    {Math.abs(comparison.timePercent) > 15 && (
                      <div className="flex items-center space-x-1">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          comparison.timePercent > 0 ? 'bg-orange-400' : 'bg-blue-400'
                        )} />
                        <span>
                          {comparison.timePercent > 0 ? 'Slower' : 'Faster'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Comparison Summary */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Route Selection Guide</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>• <strong>Main Route:</strong> Fastest route optimized for your vehicle</div>
            <div>• <strong>Alternatives:</strong> Different paths that may avoid restrictions or offer scenic routes</div>
            {profile && (
              <div>• All routes respect your vehicle dimensions ({profile.height}m H × {profile.width}m W × {profile.weight}t)</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteComparison;