// Route Optimization Component
// Phase 5.1: Multi-stop optimization UI with TSP solver integration

import React, { useState, useCallback } from 'react';
// import { useTranslation } from 'react-i18next';
import { routeOptimizationService, type OptimizationCriteria, type OptimizationResult } from '@/services/RouteOptimizationService';
import { useRouteStore, useVehicleStore } from '@/store';
import { cn } from '@/utils/cn';

interface RouteOptimizationProps {
  className?: string;
}

type OptimizationStatus = 'idle' | 'optimizing' | 'completed' | 'error';

const RouteOptimization: React.FC<RouteOptimizationProps> = ({ className }) => {
  // const { t } = useTranslation();
  const { waypoints, reorderWaypoints } = useRouteStore();
  const { profile: vehicleProfile } = useVehicleStore();

  const [status, setStatus] = useState<OptimizationStatus>('idle');
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [criteria, setCriteria] = useState<OptimizationCriteria>({
    objective: 'balanced',
    vehicleProfile: vehicleProfile || undefined,
    timeConstraints: {
      maxDrivingTime: 8,
      preferredStartTime: 9,
      avoidNightDriving: true
    },
    campsitePreferences: {
      maxDistanceBetweenStops: 300,
      preferredStopDuration: 12,
      requireCampsiteOvernight: true
    }
  });
  const [error, setError] = useState<string | null>(null);

  const handleOptimize = useCallback(async () => {
    if (waypoints.length < 3) {
      setError('At least 3 waypoints are required for optimization');
      return;
    }

    setStatus('optimizing');
    setError(null);

    try {
      const optimizationResult = await routeOptimizationService.optimizeRoute(
        waypoints,
        { ...criteria, vehicleProfile: vehicleProfile || undefined }
      );

      setResult(optimizationResult);
      setStatus('completed');
    } catch (err) {
      console.error('Optimization failed:', err);
      setError(err instanceof Error ? err.message : 'Optimization failed');
      setStatus('error');
    }
  }, [waypoints, criteria, vehicleProfile]);

  const handleApplyOptimization = useCallback(() => {
    if (result?.optimizedRoute.waypoints) {
      reorderWaypoints(result.optimizedRoute.waypoints);
      setStatus('idle');
      setResult(null);
    }
  }, [result, reorderWaypoints]);

  const handleRejectOptimization = useCallback(() => {
    setStatus('idle');
    setResult(null);
  }, []);

  const updateCriteria = useCallback((updates: Partial<OptimizationCriteria>) => {
    setCriteria(prev => ({ ...prev, ...updates }));
  }, []);

  const canOptimize = waypoints.length >= 3 && status === 'idle';
  const hasResult = status === 'completed' && result;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Optimization Controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">
Route Optimization
          </h3>
          <div className="text-xs text-gray-500">
            {waypoints.length} waypoints
          </div>
        </div>

        {/* Optimization Criteria */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700">
Optimization Goal
          </label>
          <select
            value={criteria.objective}
            onChange={(e) => updateCriteria({ objective: e.target.value as 'shortest' | 'fastest' | 'balanced' })}
            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
          >
            <option value="balanced">Balanced</option>
            <option value="shortest">Shortest Distance</option>
            <option value="fastest">Fastest Time</option>
          </select>
        </div>

        {/* Time Constraints */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700">
Max Driving Time per Day
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="4"
              max="12"
              step="1"
              value={criteria.timeConstraints?.maxDrivingTime || 8}
              onChange={(e) => updateCriteria({
                timeConstraints: {
                  ...criteria.timeConstraints!,
                  maxDrivingTime: parseInt(e.target.value)
                }
              })}
              className="flex-1"
            />
            <span className="text-xs text-gray-600 w-8">
              {criteria.timeConstraints?.maxDrivingTime || 8}h
            </span>
          </div>
        </div>

        {/* Optimize Button */}
        <button
          onClick={handleOptimize}
          disabled={!canOptimize}
          className={cn(
            'w-full px-3 py-2 text-sm font-medium rounded transition-colors',
            canOptimize
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          )}
        >
          {status === 'optimizing' ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Optimizing...</span>
            </div>
          ) : (
'Optimize Route'
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Optimization Results */}
      {hasResult && (
        <div className="space-y-3">
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="text-sm font-medium text-green-900 mb-2">
Optimization Results
            </h4>

            {/* Improvements Summary */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-green-700">Distance Saved</span>
                <span className="font-medium text-green-900">
                  {result.improvements.distanceSaved.toFixed(1)} km
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Time Saved</span>
                <span className="font-medium text-green-900">
                  {Math.round(result.improvements.timeSaved)} min
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Improvement</span>
                <span className="font-medium text-green-900">
                  {result.improvements.percentageImprovement.toFixed(1)}%
                </span>
              </div>
              {result.improvements.costSaved && (
                <div className="flex justify-between">
                  <span className="text-green-700">Cost Saved</span>
                  <span className="font-medium text-green-900">
                    €{result.improvements.costSaved.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Algorithm Info */}
            <div className="mt-2 pt-2 border-t border-green-200">
              <div className="text-xs text-green-600">
                {result.optimizationMetadata.algorithm} • {result.optimizationMetadata.iterations} iterations • {result.optimizationMetadata.executionTime}ms
              </div>
            </div>
          </div>

          {/* Route Comparison */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-gray-50 rounded border">
              <div className="font-medium text-gray-900 mb-1">Original</div>
              <div className="text-gray-600">
                {result.originalRoute.totalDistance.toFixed(0)} km
              </div>
              <div className="text-gray-600">
                {Math.round(result.originalRoute.totalTime)} min
              </div>
            </div>
            <div className="p-2 bg-blue-50 rounded border border-blue-200">
              <div className="font-medium text-blue-900 mb-1">Optimized</div>
              <div className="text-blue-700">
                {result.optimizedRoute.totalDistance.toFixed(0)} km
              </div>
              <div className="text-blue-700">
                {Math.round(result.optimizedRoute.totalTime)} min
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={handleApplyOptimization}
              className="flex-1 px-3 py-2 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors"
            >
Apply Optimization
            </button>
            <button
              onClick={handleRejectOptimization}
              className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-400 transition-colors"
            >
Cancel
            </button>
          </div>
        </div>
      )}

      {/* Help Text */}
      {waypoints.length < 3 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-xs text-blue-700">
Add at least 3 waypoints to optimize your route automatically using our intelligent routing algorithm.
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteOptimization;