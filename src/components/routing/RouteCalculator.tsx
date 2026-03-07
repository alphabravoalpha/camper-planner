// Route Calculator Component
// Phase 3.2: Route calculation with OpenRouteService integration

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouteStore, useVehicleStore, useUIStore, useTripWizardStore } from '../../store';
import { routingService } from '../../services/RoutingService';
import { campsiteService } from '../../services/CampsiteService';
import { needsFerryCrossing } from '../../data/ferryCrossings';
import { FeatureFlags } from '../../config';
import { cn } from '../../utils/cn';
import {
  type RouteRequest,
  type RouteResponse,
  RoutingError,
  type RouteRestrictions,
} from '../../services/RoutingService';

interface RouteCalculatorProps {
  className?: string;
  autoCalculate?: boolean;
}

const RouteCalculator: React.FC<RouteCalculatorProps> = ({ className, autoCalculate = true }) => {
  const { t } = useTranslation();
  const { waypoints, setCalculatedRoute, isValidForRouting } = useRouteStore();
  const { profile } = useVehicleStore();
  const { addNotification } = useUIStore();

  const [isCalculating, setIsCalculating] = useState(false);
  const [_lastCalculationTime, setLastCalculationTime] = useState<number | null>(null);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [routeStats, setRouteStats] = useState<{
    distance: number;
    duration: number;
    service: string;
  } | null>(null);
  const [restrictions, setRestrictions] = useState<RouteRestrictions | null>(null);
  const [alternativeRoutes, setAlternativeRoutes] = useState<RouteResponse[]>([]);
  const [showAlternatives, setShowAlternatives] = useState(false);

  // Trip Wizard integration for long routes and channel crossings
  const { openWizard, setStart, setEnd } = useTripWizardStore();

  const crossingNeeded = useMemo(() => {
    if (waypoints.length >= 2) {
      const first = waypoints[0];
      const last = waypoints[waypoints.length - 1];
      return needsFerryCrossing(first.lat, first.lng, last.lat, last.lng);
    }
    return false;
  }, [waypoints]);

  const handleOpenWizardWithRoute = useCallback(() => {
    if (waypoints.length >= 2) {
      const first = waypoints[0];
      const last = waypoints[waypoints.length - 1];
      setStart({ name: first.name || 'Start', lat: first.lat, lng: first.lng });
      setEnd({ name: last.name || 'Destination', lat: last.lat, lng: last.lng });
      openWizard();
    }
  }, [waypoints, openWizard, setStart, setEnd]);

  // Auto-calculate route when waypoints change (if enabled and valid)
  useEffect(() => {
    if (autoCalculate && isValidForRouting() && FeatureFlags.BASIC_ROUTING) {
      const debounceTimer = setTimeout(() => {
        calculateRoute();
      }, 1000); // 1 second debounce to avoid excessive API calls

      return () => clearTimeout(debounceTimer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waypoints, autoCalculate]);

  // Recalculate route when vehicle profile changes
  useEffect(() => {
    if (autoCalculate && isValidForRouting() && FeatureFlags.BASIC_ROUTING && routeStats) {
      const debounceTimer = setTimeout(() => {
        addNotification({
          type: 'info',
          message: t('route.calc.recalculating'),
        });
        calculateRoute();
      }, 500); // Shorter debounce for profile changes

      return () => clearTimeout(debounceTimer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const calculateRoute = useCallback(async () => {
    if (!isValidForRouting()) {
      addNotification({
        type: 'warning',
        message: t('route.calc.minWaypoints'),
      });
      return;
    }

    if (!FeatureFlags.BASIC_ROUTING) {
      addNotification({
        type: 'info',
        message: t('route.calc.disabled'),
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
          id: wp.id,
          type: wp.type,
        })),
        vehicleProfile: profile || undefined,
        options: {
          profile: profile ? 'driving-hgv' : 'driving-car',
          geometry: true,
          instructions: true,
          elevation: false,
          units: 'km',
        },
      };

      // Calculate route
      const routeResponse: RouteResponse = await routingService.calculateRoute(routeRequest);

      // Update store with calculated route
      setCalculatedRoute(routeResponse);

      // Prefetch campsite data along the route corridor (fire-and-forget)
      // This warms the cache so campsites appear faster when the map settles
      if (routeResponse.routes[0]?.geometry) {
        campsiteService.prefetchForRoute(routeResponse.routes[0].geometry).catch(() => {});
      }

      // Update stats
      if (routeResponse.routes.length > 0) {
        const route = routeResponse.routes[0];
        setRouteStats({
          distance: Math.round((route.summary.distance / 1000) * 10) / 10, // Convert to km, 1 decimal
          duration: Math.round(route.summary.duration / 60), // Convert to minutes
          service: routeResponse.metadata.service,
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
          message: t('route.calc.withWarnings', { warning: routeResponse.warnings[0] }),
        });
      } else {
        addNotification({
          type: 'success',
          message: t('route.calc.success', { service: routeResponse.metadata.service }),
        });
      }
    } catch (error) {
      console.error('Route calculation failed:', error);

      let errorMessage = t('route.calc.failed');

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
        message: errorMessage,
      });
    } finally {
      setIsCalculating(false);
    }
  }, [waypoints, profile, isValidForRouting, setCalculatedRoute, addNotification, t]);

  // Don't render if feature is disabled
  if (!FeatureFlags.BASIC_ROUTING) return null;

  return (
    <div className={cn('bg-white rounded-2xl shadow-soft p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-neutral-900">{t('route.calc.title')}</h3>

        {/* Route status indicator */}
        <div className="flex items-center space-x-2">
          {isCalculating && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent"></div>
          )}

          {routeStats && (
            <span className="text-xs text-neutral-500">
              {routeStats.distance}km • {Math.floor(routeStats.duration / 60)}h
              {routeStats.duration % 60}m
            </span>
          )}
        </div>
      </div>

      {/* Vehicle Restriction Warnings */}
      {restrictions && restrictions.violatedDimensions.length > 0 && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-xs">
          <div className="flex items-center mb-2">
            <svg
              className="w-4 h-4 text-red-600 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span className="font-medium text-red-800">{t('route.calc.restrictionTitle')}</span>
          </div>
          <div className="space-y-1">
            {restrictions.suggestedActions.map((action, index) => (
              <div key={index} className="text-red-700">
                • {action}
              </div>
            ))}
          </div>
          {restrictions.cannotAccommodate && (
            <div className="mt-2 p-2 bg-red-100 rounded text-red-800 font-medium">
              {t('route.calc.cannotAccommodate')}
            </div>
          )}
        </div>
      )}

      {/* Route statistics */}
      {routeStats && (
        <div
          className={cn(
            'mb-3 p-2 rounded text-xs',
            restrictions?.violatedDimensions.length
              ? 'bg-amber-50 border border-amber-200'
              : 'bg-green-50 border border-green-200'
          )}
        >
          <div className="flex justify-between items-center">
            <span
              className={cn(
                'font-medium',
                restrictions?.violatedDimensions.length ? 'text-amber-800' : 'text-green-800'
              )}
            >
              <strong>{routeStats.distance} km</strong> • {Math.floor(routeStats.duration / 60)}h{' '}
              {routeStats.duration % 60}m
            </span>
            {restrictions?.violatedDimensions.length ? (
              <span className="text-amber-600">⚠</span>
            ) : null}
          </div>
          {profile && (
            <div
              className={cn(
                'mt-1',
                restrictions?.violatedDimensions.length ? 'text-amber-700' : 'text-green-700'
              )}
            >
              {t('route.calc.vehicleSpecs', {
                height: profile.height,
                width: profile.width,
                weight: profile.weight,
                length: profile.length,
              })}
            </div>
          )}
          {restrictions?.violatedDimensions.length ? (
            <div className="text-amber-700 mt-1 font-medium">{t('route.calc.restrictedRoads')}</div>
          ) : null}
        </div>
      )}

      {/* Alternative Routes */}
      {alternativeRoutes.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setShowAlternatives(!showAlternatives)}
            className="w-full flex items-center justify-between p-2 bg-primary-50 border border-primary-200 rounded text-xs text-primary-800 hover:bg-primary-100 transition-colors"
          >
            <span className="font-medium">
              {t('route.calc.alternativesAvailable', { count: alternativeRoutes.length })}
            </span>
            <svg
              className={cn(
                'w-4 h-4 transform transition-transform',
                showAlternatives && 'rotate-180'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showAlternatives && (
            <div className="mt-2 space-y-2">
              {alternativeRoutes.map((altRoute, index) => (
                <div
                  key={index}
                  className="p-2 bg-neutral-50 border border-neutral-200 rounded text-xs"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-700">
                      {t('route.calc.alternativeRoute', {
                        index: index + 1,
                        distance: Math.round((altRoute.summary.distance / 1000) * 10) / 10,
                      })}
                    </span>
                    <span className="text-neutral-600">
                      {Math.floor(altRoute.summary.duration / 60)}h{' '}
                      {Math.round(altRoute.summary.duration / 60) % 60}m
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      // Switch to alternative route
                      const altRouteResponse: RouteResponse = {
                        id: `alt_${Date.now()}`,
                        status: 'success',
                        routes: [altRoute],
                        metadata: {
                          service: 'openrouteservice' as const,
                          profile: profile ? 'driving-hgv' : 'driving-car',
                          timestamp: Date.now(),
                          query: {} as RouteRequest,
                          attribution: 'openrouteservice.org | Alternative route',
                        },
                      };
                      setCalculatedRoute(altRouteResponse);
                      setRouteStats({
                        distance: Math.round((altRoute.summary.distance / 1000) * 10) / 10,
                        duration: Math.round(altRoute.summary.duration / 60),
                        service: 'openrouteservice',
                      });
                      addNotification({
                        type: 'info',
                        message: t('route.calc.switchedToAlternative', { index: index + 1 }),
                      });
                    }}
                    className="mt-1 text-primary-600 hover:text-primary-800 font-medium underline"
                  >
                    {t('route.calc.useThisRoute')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Long Route Suggestion - prompt to use Trip Planner */}
      {routeStats && routeStats.duration > 240 && !crossingNeeded && (
        <div className="mb-3 p-3 bg-accent-50 border border-accent-200 rounded-xl">
          <div className="flex items-start space-x-2">
            <svg
              className="w-5 h-5 text-accent-600 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-accent-900">
                {t('route.calc.longDrive', { hours: Math.floor(routeStats.duration / 60) })}
              </p>
              <p className="text-xs text-accent-700 mt-0.5">
                {t('route.calc.tripPlannerSuggestion')}
              </p>
              <button
                onClick={handleOpenWizardWithRoute}
                className="mt-2 text-xs font-semibold text-accent-700 hover:text-accent-900 underline underline-offset-2"
              >
                {t('route.calc.openTripPlanner')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Channel Crossing Required - prompt to use Trip Planner */}
      {routeStats && crossingNeeded && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start space-x-2">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900">{t('route.calc.ferryCrossing')}</p>
              <p className="text-xs text-blue-700 mt-0.5">
                {t('route.calc.ferryCrossingExplanation')}
              </p>
              <button
                onClick={handleOpenWizardWithRoute}
                className="mt-2 text-xs font-semibold text-blue-700 hover:text-blue-900 underline underline-offset-2"
              >
                {t('route.calc.chooseCrossing')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error display with retry button */}
      {calculationError && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2">
              <svg
                className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p className="text-xs text-red-800 font-medium">{calculationError}</p>
                <p className="text-xs text-red-600 mt-1">{t('route.calc.retryMessage')}</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setCalculationError(null);
              calculateRoute();
            }}
            disabled={isCalculating}
            className="mt-2 w-full flex items-center justify-center space-x-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded text-xs font-medium transition-colors disabled:opacity-50"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{t('route.calc.retryButton')}</span>
          </button>
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
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
          )}
        >
          {isCalculating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>{t('route.calc.calculatingButton')}</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 01.553-.894L9 2l6 3 6-3v15l-6 3-6-3z"
                />
              </svg>
              <span>{t('route.calc.calculateButton')}</span>
            </>
          )}
        </button>

        {/* Auto-calculate toggle */}
        <label className="flex items-center space-x-2 text-xs text-neutral-600">
          <input
            type="checkbox"
            checked={autoCalculate}
            onChange={_e => {
              // This would need to be lifted up to parent component or stored in state
              // For now, it's controlled by the parent prop
            }}
            className="h-3 w-3 text-primary-600 rounded border-neutral-300"
            disabled
          />
          <span>{t('route.calc.autoCalculate')}</span>
        </label>
      </div>

      {/* Route Export Info */}
      {routeStats && (
        <div className="mt-3 p-2 bg-neutral-50 border border-neutral-200 rounded text-xs">
          <div className="flex items-center justify-between text-neutral-600">
            <span>{t('route.calc.readyForExport')}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Help text */}
      {!isValidForRouting() && waypoints.length < 2 && (
        <div className="mt-3 p-2 bg-primary-50 border border-primary-200 rounded text-xs text-primary-800">
          {t('route.calc.enablementText')}
        </div>
      )}
    </div>
  );
};

export default RouteCalculator;
