// Route Calculator Component
// Phase 3.2: Route calculation with OpenRouteService integration

import React, { useCallback, useEffect, useState } from 'react';
import { useRouteStore, useVehicleStore, useUIStore } from '../../store';
import { routingService } from '../../services/RoutingService';
import { FeatureFlags } from '../../config';
import { cn } from '../../utils/cn';
import { RouteRequest, RouteResponse, RoutingError, RouteRestrictions } from '../../services/RoutingService';

interface RouteCalculatorProps {
  className?: string;
  autoCalculate?: boolean;
}

const RouteCalculator: React.FC<RouteCalculatorProps> = ({
  className,
  autoCalculate = true
}) => {
  const { waypoints, setCalculatedRoute, isValidForRouting } = useRouteStore();
  const { profile } = useVehicleStore();
  const { addNotification } = useUIStore();

  const [isCalculating, setIsCalculating] = useState(false);
  const [lastCalculationTime, setLastCalculationTime] = useState<number | null>(null);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [routeStats, setRouteStats] = useState<{
    distance: number;
    duration: number;
    service: string;
  } | null>(null);
  const [restrictions, setRestrictions] = useState<RouteRestrictions | null>(null);
  const [alternativeRoutes, setAlternativeRoutes] = useState<any[]>([]);
  const [showAlternatives, setShowAlternatives] = useState(false);

  // Auto-calculate route when waypoints change (if enabled and valid)
  useEffect(() => {
    if (autoCalculate && isValidForRouting() && FeatureFlags.BASIC_ROUTING) {
      const debounceTimer = setTimeout(() => {
        calculateRoute();
      }, 1000); // 1 second debounce to avoid excessive API calls

      return () => clearTimeout(debounceTimer);
    }
  }, [waypoints, autoCalculate]);

  // Recalculate route when vehicle profile changes
  useEffect(() => {
    if (autoCalculate && isValidForRouting() && FeatureFlags.BASIC_ROUTING && routeStats) {
      const debounceTimer = setTimeout(() => {
        addNotification({
          type: 'info',
          message: 'Recalculating route with updated vehicle profile...'
        });
        calculateRoute();
      }, 500); // Shorter debounce for profile changes

      return () => clearTimeout(debounceTimer);
    }
  }, [profile]);

  const calculateRoute = useCallback(async () => {
    if (!isValidForRouting()) {
      addNotification({
        type: 'warning',
        message: 'Need at least 2 waypoints to calculate route'
      });
      return;
    }

    if (!FeatureFlags.BASIC_ROUTING) {
      addNotification({
        type: 'info',
        message: 'Routing feature is currently disabled'
      });
      return;
    }

    setIsCalculating(true);
    setCalculationError(null);

    try {
      // Build route request
      const routeRequest: RouteRequest = {
        waypoints: waypoints.map(wp => ({
          lat: wp.lat,
          lng: wp.lng,
          name: wp.name || `Waypoint ${wp.id}`,
          id: wp.id
        })),
        vehicleProfile: profile || undefined,
        options: {
          profile: profile ? 'driving-hgv' : 'driving-car',
          geometry: true,
          instructions: true,
          elevation: false,
          units: 'km'
        }
      };

      // Calculate route
      const routeResponse: RouteResponse = await routingService.calculateRoute(routeRequest);

      // Update store with calculated route
      setCalculatedRoute(routeResponse);

      // Update stats
      if (routeResponse.routes.length > 0) {
        const route = routeResponse.routes[0];
        setRouteStats({
          distance: Math.round(route.summary.distance / 1000 * 10) / 10, // Convert to km, 1 decimal
          duration: Math.round(route.summary.duration / 60), // Convert to minutes
          service: routeResponse.metadata.service
        });
      }

      // Update restrictions and alternatives
      setRestrictions(routeResponse.restrictions || null);
      setAlternativeRoutes(routeResponse.alternativeRoutes || []);

      setLastCalculationTime(Date.now());

      // Show success notification with warnings if any
      if (routeResponse.warnings && routeResponse.warnings.length > 0) {
        addNotification({
          type: 'warning',
          message: `Route calculated with warnings: ${routeResponse.warnings[0]}`
        });
      } else {
        addNotification({
          type: 'success',
          message: `Route calculated successfully using ${routeResponse.metadata.service}`
        });
      }

    } catch (error) {
      console.error('Route calculation failed:', error);

      let errorMessage = 'Failed to calculate route';

      if (error instanceof RoutingError) {
        errorMessage = error.message;

        // Clear calculated route on unrecoverable errors
        if (!error.recoverable) {
          setCalculatedRoute(null);
          setRouteStats(null);
        }
      }

      setCalculationError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setIsCalculating(false);
    }
  }, [waypoints, profile, isValidForRouting, setCalculatedRoute, addNotification]);

  // Don't render if feature is disabled
  if (!FeatureFlags.BASIC_ROUTING) return null;

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200 p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Route Calculation</h3>

        {/* Route status indicator */}
        <div className="flex items-center space-x-2">
          {isCalculating && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
          )}

          {routeStats && (
            <span className="text-xs text-gray-500">
              {routeStats.distance}km • {Math.floor(routeStats.duration / 60)}h{routeStats.duration % 60}m
            </span>
          )}
        </div>
      </div>

      {/* Vehicle Restriction Warnings */}
      {restrictions && restrictions.violatedDimensions.length > 0 && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-xs">
          <div className="flex items-center mb-2">
            <svg className="w-4 h-4 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="font-medium text-red-800">Vehicle Restriction Violations</span>
          </div>
          <div className="space-y-1">
            {restrictions.suggestedActions.map((action, index) => (
              <div key={index} className="text-red-700">• {action}</div>
            ))}
          </div>
          {restrictions.cannotAccommodate && (
            <div className="mt-2 p-2 bg-red-100 rounded text-red-800 font-medium">
              ⚠️ Your vehicle cannot use European roads with these dimensions
            </div>
          )}
        </div>
      )}

      {/* Route statistics */}
      {routeStats && (
        <div className={cn(
          "mb-3 p-2 rounded text-xs",
          restrictions?.violatedDimensions.length ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'
        )}>
          <div className="flex justify-between items-center">
            <span className={cn(
              "font-medium",
              restrictions?.violatedDimensions.length ? 'text-amber-800' : 'text-green-800'
            )}>
              <strong>{routeStats.distance} km</strong> • {Math.floor(routeStats.duration / 60)}h {routeStats.duration % 60}m
            </span>
            <span className={cn(
              "capitalize",
              restrictions?.violatedDimensions.length ? 'text-amber-600' : 'text-green-600'
            )}>
              {routeStats.service === 'openrouteservice' ? 'OpenRoute' : routeStats.service}
            </span>
          </div>
          {profile && (
            <div className={cn(
              "mt-1",
              restrictions?.violatedDimensions.length ? 'text-amber-700' : 'text-green-700'
            )}>
              Vehicle: {profile.height}m H × {profile.width}m W × {profile.weight}t × {profile.length}m L
            </div>
          )}
          {restrictions?.violatedDimensions.length ? (
            <div className="text-amber-700 mt-1 font-medium">
              ⚠️ Route may include restricted roads
            </div>
          ) : null}
        </div>
      )}

      {/* Alternative Routes */}
      {alternativeRoutes.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setShowAlternatives(!showAlternatives)}
            className="w-full flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800 hover:bg-blue-100 transition-colors"
          >
            <span className="font-medium">
              {alternativeRoutes.length} Alternative Route{alternativeRoutes.length > 1 ? 's' : ''} Available
            </span>
            <svg className={cn("w-4 h-4 transform transition-transform", showAlternatives && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showAlternatives && (
            <div className="mt-2 space-y-2">
              {alternativeRoutes.map((altRoute, index) => (
                <div key={index} className="p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">
                      Alternative {index + 1}: <strong>{Math.round(altRoute.summary.distance / 1000 * 10) / 10} km</strong>
                    </span>
                    <span className="text-gray-600">
                      {Math.floor(altRoute.summary.duration / 60)}h {Math.round(altRoute.summary.duration / 60) % 60}m
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      // Switch to alternative route
                      const altRouteResponse = {
                        id: `alt_${Date.now()}`,
                        status: 'success' as const,
                        routes: [altRoute],
                        metadata: {
                          service: 'openrouteservice',
                          profile: profile ? 'driving-hgv' : 'driving-car',
                          timestamp: Date.now(),
                          query: {},
                          attribution: 'openrouteservice.org | Alternative route'
                        }
                      };
                      setCalculatedRoute(altRouteResponse);
                      setRouteStats({
                        distance: Math.round(altRoute.summary.distance / 1000 * 10) / 10,
                        duration: Math.round(altRoute.summary.duration / 60),
                        service: 'openrouteservice'
                      });
                      addNotification({
                        type: 'info',
                        message: `Switched to alternative route ${index + 1}`
                      });
                    }}
                    className="mt-1 text-blue-600 hover:text-blue-800 font-medium underline"
                  >
                    Use this route
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error display */}
      {calculationError && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
          {calculationError}
        </div>
      )}

      {/* Manual calculation button */}
      <div className="flex items-center justify-between">
        <button
          onClick={calculateRoute}
          disabled={!isValidForRouting() || isCalculating}
          className={cn(
            'flex items-center space-x-2 px-3 py-2 rounded text-sm font-medium transition-colors',
            isValidForRouting() && !isCalculating
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          )}
        >
          {isCalculating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Calculating...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 01.553-.894L9 2l6 3 6-3v15l-6 3-6-3z" />
              </svg>
              <span>Calculate Route</span>
            </>
          )}
        </button>

        {/* Auto-calculate toggle */}
        <label className="flex items-center space-x-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={autoCalculate}
            onChange={(e) => {
              // This would need to be lifted up to parent component or stored in state
              // For now, it's controlled by the parent prop
            }}
            className="h-3 w-3 text-blue-600 rounded border-gray-300"
            disabled
          />
          <span>Auto-calculate</span>
        </label>
      </div>

      {/* Service status */}
      {lastCalculationTime && (
        <div className="mt-2 text-xs text-gray-500">
          Last updated: {new Date(lastCalculationTime).toLocaleTimeString()}
        </div>
      )}

      {/* Route Export Info */}
      {routeStats && (
        <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
          <div className="flex items-center justify-between text-gray-600">
            <span>Route ready for export</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
      )}

      {/* Help text */}
      {!isValidForRouting() && waypoints.length < 2 && (
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
          Add at least 2 waypoints to enable route calculation
        </div>
      )}
    </div>
  );
};

export default RouteCalculator;