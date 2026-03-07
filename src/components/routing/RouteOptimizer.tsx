// Route Optimizer Component
// Phase 5.1: Multi-stop optimization with TSP solver and visual feedback

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Ruler, Zap, Scale, Tent, MapPin } from 'lucide-react';
import { FeatureFlags } from '../../config';
import {
  routeOptimizationService,
  type OptimizationCriteria,
  type OptimizationResult,
  type WaypointInsertionResult,
} from '../../services/RouteOptimizationService';
import { useRouteStore, useVehicleStore, useUIStore } from '../../store';
import { cn } from '../../utils/cn';

export interface RouteOptimizerProps {
  className?: string;
  onOptimizationComplete?: (result: OptimizationResult) => void;
  onWaypointInsert?: (position: number) => void;
  isVisible?: boolean;
}

interface OptimizationSettings {
  objective: 'shortest' | 'fastest' | 'balanced';
  enableTimeConstraints: boolean;
  maxDrivingTime: number;
  preferredStartTime: number;
  avoidNightDriving: boolean;
  enableCampsitePreferences: boolean;
  maxDistanceBetweenStops: number;
  requireCampsiteOvernight: boolean;
  autoOptimizeOnChange: boolean;
}

const DEFAULT_SETTINGS: OptimizationSettings = {
  objective: 'balanced',
  enableTimeConstraints: false,
  maxDrivingTime: 8,
  preferredStartTime: 9,
  avoidNightDriving: true,
  enableCampsitePreferences: false,
  maxDistanceBetweenStops: 300,
  requireCampsiteOvernight: false,
  autoOptimizeOnChange: false,
};

const RouteOptimizer: React.FC<RouteOptimizerProps> = ({
  className,
  onOptimizationComplete,
  onWaypointInsert,
  isVisible = true,
}) => {
  const { t } = useTranslation();
  const { waypoints, reorderWaypoints } = useRouteStore();
  const { profile } = useVehicleStore();
  const { addNotification } = useUIStore();

  const [settings, setSettings] = useState<OptimizationSettings>(DEFAULT_SETTINGS);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [lockedWaypoints, setLockedWaypoints] = useState<Set<string>>(new Set());
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);
  const [insertionMode, setInsertionMode] = useState(false);
  const [insertionResult, setInsertionResult] = useState<WaypointInsertionResult | null>(null);
  const [newWaypointPosition, setNewWaypointPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Check if optimization is possible
  const canOptimize = useMemo(() => {
    return waypoints.length >= 3 && !isOptimizing;
  }, [waypoints.length, isOptimizing]);

  // Handle optimization
  const handleOptimize = useCallback(async () => {
    if (!canOptimize) return;

    setIsOptimizing(true);
    setOptimizationError(null);

    try {
      const criteria: OptimizationCriteria = {
        objective: settings.objective,
        vehicleProfile: profile || undefined,
        lockedWaypoints: Array.from(lockedWaypoints),
      };

      if (settings.enableTimeConstraints) {
        criteria.timeConstraints = {
          maxDrivingTime: settings.maxDrivingTime,
          preferredStartTime: settings.preferredStartTime,
          avoidNightDriving: settings.avoidNightDriving,
        };
      }

      if (settings.enableCampsitePreferences) {
        criteria.campsitePreferences = {
          maxDistanceBetweenStops: settings.maxDistanceBetweenStops,
          preferredStopDuration: 8, // 8 hours overnight
          requireCampsiteOvernight: settings.requireCampsiteOvernight,
        };
      }

      const result = await routeOptimizationService.optimizeRoute(waypoints, criteria);

      setOptimizationResult(result);

      if (result.improvements.percentageImprovement > 1) {
        addNotification({
          type: 'success',
          message: t('route.optimizer.successMessage', {
            distance: result.improvements.distanceSaved.toFixed(1),
            time: Math.round(result.improvements.timeSaved),
          }),
        });
      } else {
        addNotification({
          type: 'info',
          message: t('route.optimizer.alreadyOptimized'),
        });
      }

      onOptimizationComplete?.(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setOptimizationError(errorMessage);
      addNotification({
        type: 'error',
        message: t('route.optimizer.errorMessage', { error: errorMessage }),
      });
    } finally {
      setIsOptimizing(false);
    }
  }, [
    waypoints,
    settings,
    profile,
    lockedWaypoints,
    canOptimize,
    addNotification,
    onOptimizationComplete,
    t,
  ]);

  // Apply optimization result
  const applyOptimization = useCallback(() => {
    if (!optimizationResult) return;

    reorderWaypoints(optimizationResult.optimizedRoute.waypoints);
    setOptimizationResult(null);

    addNotification({
      type: 'success',
      message: t('route.optimizer.appliedSuccess'),
    });
  }, [optimizationResult, reorderWaypoints, addNotification, t]);

  // Toggle waypoint lock
  const toggleWaypointLock = useCallback((waypointId: string) => {
    setLockedWaypoints(prev => {
      const newLocked = new Set(prev);
      if (newLocked.has(waypointId)) {
        newLocked.delete(waypointId);
      } else {
        newLocked.add(waypointId);
      }
      return newLocked;
    });
  }, []);

  // Handle insertion mode
  const __handleInsertionMode = useCallback(
    (lat: number, lng: number) => {
      if (!insertionMode) return;

      const newWaypoint = {
        id: `temp_${Date.now()}`,
        lat,
        lng,
        name: 'New Waypoint',
        type: 'waypoint' as const,
      };

      setNewWaypointPosition({ lat, lng });

      // Find optimal insertion position
      routeOptimizationService
        .findOptimalInsertion(waypoints, newWaypoint, {
          objective: settings.objective,
          vehicleProfile: profile || undefined,
        })
        .then(result => {
          setInsertionResult(result);
        })
        .catch(error => {
          console.error('Insertion analysis failed:', error);
          addNotification({
            type: 'error',
            message: t('route.optimizer.insertionError'),
          });
        });
    },
    [insertionMode, waypoints, settings.objective, profile, addNotification, t]
  );

  // Auto-optimize when waypoints change
  useEffect(() => {
    if (settings.autoOptimizeOnChange && waypoints.length >= 3 && !isOptimizing) {
      const timeoutId = setTimeout(() => {
        handleOptimize();
      }, 2000); // Debounce auto-optimization

      return () => clearTimeout(timeoutId);
    }
  }, [waypoints, settings.autoOptimizeOnChange, handleOptimize, isOptimizing]);

  if (!FeatureFlags.ROUTE_OPTIMIZATION || !isVisible) return null;

  return (
    <div className={cn('bg-white rounded-lg shadow-lg border border-neutral-200', className)}>
      {/* Header */}
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900 flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 01.553-.894L9 2l6 3 6-3v15l-6 3-6-3z"
              />
            </svg>
            {t('route.optimizer.title')}
          </h3>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded"
              title={t('route.optimizer.advancedSettings')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
        </div>

        {waypoints.length < 3 && (
          <p className="text-sm text-amber-600 mt-2 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            {t('route.optimizer.minWaypoints')}
          </p>
        )}
      </div>

      {/* Main Controls */}
      <div className="p-4">
        {/* Optimization Objective */}
        <div className="mb-4">
          <span className="block text-sm font-medium text-neutral-700 mb-2">
            {t('route.optimizer.objectiveLabel')}
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                value: 'shortest',
                labelKey: 'route.optimizer.shortest' as const,
                icon: Ruler,
                descKey: 'route.optimizer.shortestDesc' as const,
              },
              {
                value: 'fastest',
                labelKey: 'route.optimizer.fastest' as const,
                icon: Zap,
                descKey: 'route.optimizer.fastestDesc' as const,
              },
              {
                value: 'balanced',
                labelKey: 'route.optimizer.balanced' as const,
                icon: Scale,
                descKey: 'route.optimizer.balancedDesc' as const,
              },
            ].map(option => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() =>
                    setSettings(prev => ({
                      ...prev,
                      objective: option.value as 'shortest' | 'fastest' | 'balanced',
                    }))
                  }
                  className={cn(
                    'p-3 rounded-lg border text-center transition-colors text-sm',
                    settings.objective === option.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
                  )}
                >
                  <div className="flex justify-center mb-1">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="font-medium">{t(option.labelKey)}</div>
                  <div className="text-xs text-neutral-500">{t(option.descKey)}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 mb-4">
          <button
            onClick={handleOptimize}
            disabled={!canOptimize}
            className={cn(
              'flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors',
              canOptimize
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
            )}
          >
            {isOptimizing ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>{t('route.optimizer.optimizingButton')}</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span>{t('route.optimizer.optimizeButton')}</span>
              </>
            )}
          </button>

          <button
            onClick={() => setInsertionMode(!insertionMode)}
            className={cn(
              'px-4 py-3 rounded-lg font-medium transition-colors',
              insertionMode
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            )}
            title="Smart waypoint insertion"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </button>
        </div>

        {/* Persistent Error Display */}
        {optimizationError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <span className="text-red-600 text-sm flex-1">
              {t('route.optimizer.errorMessage', { error: optimizationError })}
            </span>
            <button
              onClick={() => setOptimizationError(null)}
              className="text-red-400 hover:text-red-600 p-0.5"
              aria-label={t('route.optimizer.dismissButton')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Quick Settings */}
        <div className="flex items-center justify-between mb-4">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={settings.autoOptimizeOnChange}
              onChange={e =>
                setSettings(prev => ({ ...prev, autoOptimizeOnChange: e.target.checked }))
              }
              className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <span>{t('route.optimizer.autoOptimize')}</span>
          </label>
        </div>

        {/* Advanced Settings */}
        {showAdvancedSettings && (
          <div className="space-y-4 p-4 bg-neutral-50 rounded-lg">
            <h4 className="font-medium text-neutral-900">
              {t('route.optimizer.advancedSettings')}
            </h4>

            {/* Time Constraints */}
            <div>
              <label className="flex items-center space-x-2 text-sm mb-2">
                <input
                  type="checkbox"
                  checked={settings.enableTimeConstraints}
                  onChange={e =>
                    setSettings(prev => ({ ...prev, enableTimeConstraints: e.target.checked }))
                  }
                  className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <span>{t('route.optimizer.enableTimeConstraints')}</span>
              </label>

              {settings.enableTimeConstraints && (
                <div className="grid grid-cols-2 gap-3 ml-6">
                  <div>
                    <label
                      htmlFor="optimizer-max-driving-time"
                      className="block text-xs text-neutral-600 mb-1"
                    >
                      {t('route.optimizer.maxDrivingTime')}
                    </label>
                    <input
                      id="optimizer-max-driving-time"
                      type="number"
                      min="4"
                      max="12"
                      value={settings.maxDrivingTime}
                      onChange={e =>
                        setSettings(prev => ({ ...prev, maxDrivingTime: parseInt(e.target.value) }))
                      }
                      className="w-full px-2 py-1 border border-neutral-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="optimizer-preferred-start-time"
                      className="block text-xs text-neutral-600 mb-1"
                    >
                      {t('route.optimizer.preferredStartTime')}
                    </label>
                    <input
                      id="optimizer-preferred-start-time"
                      type="number"
                      min="6"
                      max="12"
                      value={settings.preferredStartTime}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          preferredStartTime: parseInt(e.target.value),
                        }))
                      }
                      className="w-full px-2 py-1 border border-neutral-300 rounded text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Campsite Preferences */}
            <div>
              <label className="flex items-center space-x-2 text-sm mb-2">
                <input
                  type="checkbox"
                  checked={settings.enableCampsitePreferences}
                  onChange={e =>
                    setSettings(prev => ({ ...prev, enableCampsitePreferences: e.target.checked }))
                  }
                  className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <span>{t('route.optimizer.enableCampsitePreferences')}</span>
              </label>

              {settings.enableCampsitePreferences && (
                <div className="ml-6">
                  <div className="mb-2">
                    <label className="block text-xs text-neutral-600 mb-1">
                      {t('route.optimizer.maxDistanceBetweenStops', {
                        distance: settings.maxDistanceBetweenStops,
                      })}
                    </label>
                    <input
                      type="range"
                      min="100"
                      max="500"
                      step="50"
                      value={settings.maxDistanceBetweenStops}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          maxDistanceBetweenStops: parseInt(e.target.value),
                        }))
                      }
                      className="w-full"
                    />
                  </div>
                  <label className="flex items-center space-x-2 text-xs">
                    <input
                      type="checkbox"
                      checked={settings.requireCampsiteOvernight}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          requireCampsiteOvernight: e.target.checked,
                        }))
                      }
                      className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span>{t('route.optimizer.requireCampsiteOvernight')}</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Waypoint Management */}
      {waypoints.length > 0 && (
        <div className="border-t border-neutral-200">
          <div className="p-4">
            <h4 className="font-medium text-neutral-900 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {t('route.optimizer.waypointOrder', { count: waypoints.length })}
            </h4>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {waypoints.map((waypoint, index) => (
                <div
                  key={waypoint.id}
                  className="flex items-center space-x-3 p-2 bg-neutral-50 rounded-lg"
                >
                  <div className="flex items-center justify-center w-6 h-6 bg-primary-100 text-primary-800 rounded-full text-xs font-medium">
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-neutral-900 truncate">
                      {waypoint.name}
                    </div>
                    <div className="text-xs text-neutral-500">
                      <span className="inline-flex items-center gap-1">
                        {waypoint.type === 'campsite' ? (
                          <>
                            <Tent className="w-3 h-3" /> {t('route.optimizer.campsiteLabel')}
                          </>
                        ) : (
                          <>
                            <MapPin className="w-3 h-3" /> {t('route.optimizer.waypointLabel')}
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleWaypointLock(waypoint.id)}
                    className={cn(
                      'p-1 rounded text-xs',
                      lockedWaypoints.has(waypoint.id)
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-neutral-400 hover:bg-neutral-100'
                    )}
                    title={
                      lockedWaypoints.has(waypoint.id)
                        ? t('route.optimizer.unlockTooltip')
                        : t('route.optimizer.lockTooltip')
                    }
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {lockedWaypoints.has(waypoint.id) ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                        />
                      )}
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {lockedWaypoints.size > 0 && (
              <div className="mt-2 text-xs text-neutral-600 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {t('route.optimizer.lockedInfo', { count: lockedWaypoints.size })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Optimization Result */}
      {optimizationResult && (
        <div className="border-t border-neutral-200 bg-green-50">
          <div className="p-4">
            <h4 className="font-medium text-green-900 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {t('route.optimizer.completeTitle')}
            </h4>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white p-3 rounded border">
                <div className="text-xs text-neutral-600 mb-1">
                  {t('route.optimizer.distanceSaved')}
                </div>
                <div className="text-lg font-semibold text-green-600">
                  {t('route.optimizer.distanceFormat', {
                    distance: optimizationResult.improvements.distanceSaved.toFixed(1),
                  })}
                </div>
                <div className="text-xs text-neutral-500">
                  {t('route.optimizer.improvement', {
                    percent: optimizationResult.improvements.percentageImprovement.toFixed(1),
                  })}
                </div>
              </div>

              <div className="bg-white p-3 rounded border">
                <div className="text-xs text-neutral-600 mb-1">
                  {t('route.optimizer.timeSaved')}
                </div>
                <div className="text-lg font-semibold text-green-600">
                  {t('route.optimizer.minutesFormat', {
                    minutes: Math.round(optimizationResult.improvements.timeSaved),
                  })}
                </div>
                <div className="text-xs text-neutral-500">
                  {optimizationResult.optimizationMetadata.algorithm}
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={applyOptimization}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                {t('route.optimizer.applyButton')}
              </button>
              <button
                onClick={() => setOptimizationResult(null)}
                className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors text-sm"
              >
                {t('route.optimizer.dismissButton')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Insertion Mode Help */}
      {insertionMode && (
        <div className="border-t border-neutral-200 bg-primary-50">
          <div className="p-4">
            <div className="flex items-center space-x-2 text-primary-800 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{t('route.optimizer.insertionModeHint')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Insertion Result */}
      {insertionResult && newWaypointPosition && (
        <div className="border-t border-neutral-200 bg-yellow-50">
          <div className="p-4">
            <h4 className="font-medium text-yellow-900 mb-2">
              {t('route.optimizer.insertionAnalysisTitle')}
            </h4>
            <div className="text-sm text-yellow-800 mb-3">
              {t('route.optimizer.bestPosition', {
                position: insertionResult.suggestedPosition + 1,
              })}
              <br />
              {t('route.optimizer.impact', {
                distance: insertionResult.routeImpact.distanceAdded.toFixed(1),
                time: Math.round(insertionResult.routeImpact.timeAdded),
              })}
              <br />
              {t('route.optimizer.efficiency', {
                percent: (insertionResult.routeImpact.efficiency * 100).toFixed(0),
              })}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  onWaypointInsert?.(insertionResult.suggestedPosition);
                  setInsertionResult(null);
                  setNewWaypointPosition(null);
                  setInsertionMode(false);
                }}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
              >
                {t('route.optimizer.insertButton')}
              </button>
              <button
                onClick={() => {
                  setInsertionResult(null);
                  setNewWaypointPosition(null);
                }}
                className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors text-sm"
              >
                {t('route.optimizer.dismissButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteOptimizer;
