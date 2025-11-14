// Route Optimizer Component
// Phase 5.1: Multi-stop optimization with TSP solver and visual feedback

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { FeatureFlags } from '../../config';
import { routeOptimizationService } from '../../services/RouteOptimizationService';
import type { OptimizationCriteria, OptimizationResult, WaypointInsertionResult } from '../../services/RouteOptimizationService';
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
  autoOptimizeOnChange: false
};

const RouteOptimizer: React.FC<RouteOptimizerProps> = ({
  className,
  onOptimizationComplete,
  onWaypointInsert,
  isVisible = true
}) => {
  const { waypoints, calculatedRoute: _calculatedRoute, reorderWaypoints } = useRouteStore();
  const { profile } = useVehicleStore();
  const { addNotification } = useUIStore();

  const [settings, setSettings] = useState<OptimizationSettings>(DEFAULT_SETTINGS);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [lockedWaypoints, setLockedWaypoints] = useState<Set<string>>(new Set());
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [insertionMode, setInsertionMode] = useState(false);
  const [insertionResult, setInsertionResult] = useState<WaypointInsertionResult | null>(null);
  const [newWaypointPosition, setNewWaypointPosition] = useState<{ lat: number; lng: number } | null>(null);

  // Check if optimization is possible
  const canOptimize = useMemo(() => {
    return waypoints.length >= 3 && !isOptimizing;
  }, [waypoints.length, isOptimizing]);

  // Handle optimization
  const handleOptimize = useCallback(async () => {
    if (!canOptimize) return;

    setIsOptimizing(true);

    try {
      const criteria: OptimizationCriteria = {
        objective: settings.objective,
        vehicleProfile: profile || undefined,
        lockedWaypoints: Array.from(lockedWaypoints)
      };

      if (settings.enableTimeConstraints) {
        criteria.timeConstraints = {
          maxDrivingTime: settings.maxDrivingTime,
          preferredStartTime: settings.preferredStartTime,
          avoidNightDriving: settings.avoidNightDriving
        };
      }

      if (settings.enableCampsitePreferences) {
        criteria.campsitePreferences = {
          maxDistanceBetweenStops: settings.maxDistanceBetweenStops,
          preferredStopDuration: 8, // 8 hours overnight
          requireCampsiteOvernight: settings.requireCampsiteOvernight
        };
      }

      const result = await routeOptimizationService.optimizeRoute(waypoints, criteria);

      setOptimizationResult(result);

      if (result.improvements.percentageImprovement > 1) {
        addNotification({
          type: 'success',
          message: `Route optimized! Saved ${result.improvements.distanceSaved.toFixed(1)}km and ${Math.round(result.improvements.timeSaved)} minutes`
        });
      } else {
        addNotification({
          type: 'info',
          message: 'Route is already well optimized'
        });
      }

      onOptimizationComplete?.(result);

    } catch (error) {
      console.error('Optimization failed:', error);
      addNotification({
        type: 'error',
        message: `Optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsOptimizing(false);
    }
  }, [waypoints, settings, profile, lockedWaypoints, canOptimize, addNotification, onOptimizationComplete]);

  // Apply optimization result
  const applyOptimization = useCallback(() => {
    if (!optimizationResult) return;

    reorderWaypoints(optimizationResult.optimizedRoute.waypoints);
    setOptimizationResult(null);

    addNotification({
      type: 'success',
      message: 'Route optimization applied successfully'
    });
  }, [optimizationResult, reorderWaypoints, addNotification]);

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
    <div className={cn('bg-white rounded-lg shadow-lg border border-gray-200', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 01.553-.894L9 2l6 3 6-3v15l-6 3-6-3z" />
            </svg>
            Route Optimizer
          </h3>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Advanced Settings"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {waypoints.length < 3 && (
          <p className="text-sm text-amber-600 mt-2 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Add at least 3 waypoints to enable route optimization
          </p>
        )}
      </div>

      {/* Main Controls */}
      <div className="p-4">
        {/* Optimization Objective */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Optimization Goal
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'shortest', label: 'Shortest', icon: '📏', desc: 'Minimize distance' },
              { value: 'fastest', label: 'Fastest', icon: '⚡', desc: 'Minimize time' },
              { value: 'balanced', label: 'Balanced', icon: '⚖️', desc: 'Balance time & distance' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setSettings(prev => ({ ...prev, objective: option.value as any }))}
                className={cn(
                  'p-3 rounded-lg border text-center transition-colors text-sm',
                  settings.objective === option.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                )}
              >
                <div className="text-lg mb-1">{option.icon}</div>
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-gray-500">{option.desc}</div>
              </button>
            ))}
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
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            )}
          >
            {isOptimizing ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Optimizing...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Optimize Route</span>
              </>
            )}
          </button>

          <button
            onClick={() => setInsertionMode(!insertionMode)}
            className={cn(
              'px-4 py-3 rounded-lg font-medium transition-colors',
              insertionMode
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
            title="Smart waypoint insertion"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>

        {/* Quick Settings */}
        <div className="flex items-center justify-between mb-4">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={settings.autoOptimizeOnChange}
              onChange={e => setSettings(prev => ({ ...prev, autoOptimizeOnChange: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Auto-optimize when route changes</span>
          </label>
        </div>

        {/* Advanced Settings */}
        {showAdvancedSettings && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900">Advanced Settings</h4>

            {/* Time Constraints */}
            <div>
              <label className="flex items-center space-x-2 text-sm mb-2">
                <input
                  type="checkbox"
                  checked={settings.enableTimeConstraints}
                  onChange={e => setSettings(prev => ({ ...prev, enableTimeConstraints: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Enable time constraints</span>
              </label>

              {settings.enableTimeConstraints && (
                <div className="grid grid-cols-2 gap-3 ml-6">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Max driving time (hours)</label>
                    <input
                      type="number"
                      min="4"
                      max="12"
                      value={settings.maxDrivingTime}
                      onChange={e => setSettings(prev => ({ ...prev, maxDrivingTime: parseInt(e.target.value) }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Preferred start time</label>
                    <input
                      type="number"
                      min="6"
                      max="12"
                      value={settings.preferredStartTime}
                      onChange={e => setSettings(prev => ({ ...prev, preferredStartTime: parseInt(e.target.value) }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
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
                  onChange={e => setSettings(prev => ({ ...prev, enableCampsitePreferences: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Enable campsite preferences</span>
              </label>

              {settings.enableCampsitePreferences && (
                <div className="ml-6">
                  <div className="mb-2">
                    <label className="block text-xs text-gray-600 mb-1">
                      Max distance between stops: {settings.maxDistanceBetweenStops}km
                    </label>
                    <input
                      type="range"
                      min="100"
                      max="500"
                      step="50"
                      value={settings.maxDistanceBetweenStops}
                      onChange={e => setSettings(prev => ({ ...prev, maxDistanceBetweenStops: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                  <label className="flex items-center space-x-2 text-xs">
                    <input
                      type="checkbox"
                      checked={settings.requireCampsiteOvernight}
                      onChange={e => setSettings(prev => ({ ...prev, requireCampsiteOvernight: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Require campsite for overnight stops</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Waypoint Management */}
      {waypoints.length > 0 && (
        <div className="border-t border-gray-200">
          <div className="p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Waypoint Order ({waypoints.length} stops)
            </h4>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {waypoints.map((waypoint, index) => (
                <div
                  key={waypoint.id}
                  className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {waypoint.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {waypoint.type === 'start' ? '🚩 Start' : waypoint.type === 'end' ? '🏁 End' : '📍 Waypoint'}
                    </div>
                  </div>

                  <button
                    onClick={() => toggleWaypointLock(waypoint.id)}
                    className={cn(
                      'p-1 rounded text-xs',
                      lockedWaypoints.has(waypoint.id)
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-gray-400 hover:bg-gray-100'
                    )}
                    title={lockedWaypoints.has(waypoint.id) ? 'Unlock waypoint' : 'Lock waypoint order'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {lockedWaypoints.has(waypoint.id) ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      )}
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {lockedWaypoints.size > 0 && (
              <div className="mt-2 text-xs text-gray-600 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {lockedWaypoints.size} waypoint(s) locked in position
              </div>
            )}
          </div>
        </div>
      )}

      {/* Optimization Result */}
      {optimizationResult && (
        <div className="border-t border-gray-200 bg-green-50">
          <div className="p-4">
            <h4 className="font-medium text-green-900 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Optimization Complete
            </h4>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white p-3 rounded border">
                <div className="text-xs text-gray-600 mb-1">Distance Saved</div>
                <div className="text-lg font-semibold text-green-600">
                  {optimizationResult.improvements.distanceSaved.toFixed(1)}km
                </div>
                <div className="text-xs text-gray-500">
                  {optimizationResult.improvements.percentageImprovement.toFixed(1)}% improvement
                </div>
              </div>

              <div className="bg-white p-3 rounded border">
                <div className="text-xs text-gray-600 mb-1">Time Saved</div>
                <div className="text-lg font-semibold text-green-600">
                  {Math.round(optimizationResult.improvements.timeSaved)} min
                </div>
                <div className="text-xs text-gray-500">
                  {optimizationResult.optimizationMetadata.algorithm}
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={applyOptimization}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Apply Optimization
              </button>
              <button
                onClick={() => setOptimizationResult(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Insertion Mode Help */}
      {insertionMode && (
        <div className="border-t border-gray-200 bg-blue-50">
          <div className="p-4">
            <div className="flex items-center space-x-2 text-blue-800 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Click on the map to find the optimal position for a new waypoint</span>
            </div>
          </div>
        </div>
      )}

      {/* Insertion Result */}
      {insertionResult && newWaypointPosition && (
        <div className="border-t border-gray-200 bg-yellow-50">
          <div className="p-4">
            <h4 className="font-medium text-yellow-900 mb-2">Waypoint Insertion Analysis</h4>
            <div className="text-sm text-yellow-800 mb-3">
              Best position: After waypoint {insertionResult.suggestedPosition + 1}
              <br />
              Impact: +{insertionResult.routeImpact.distanceAdded.toFixed(1)}km,
              +{Math.round(insertionResult.routeImpact.timeAdded)} min
              <br />
              Efficiency: {(insertionResult.routeImpact.efficiency * 100).toFixed(0)}%
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
                Insert Here
              </button>
              <button
                onClick={() => {
                  setInsertionResult(null);
                  setNewWaypointPosition(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteOptimizer;