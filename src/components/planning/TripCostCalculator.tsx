// Trip Cost Calculator Component
// Phase 5.2: Fuel cost estimation and trip budgeting UI

import React, { useState, useCallback, useEffect } from 'react';
import { CostCalculationService, type FuelConsumptionSettings, type FuelPriceSettings, type CostBreakdown, type CostOptimization } from '@/services/CostCalculationService';
import { useRouteStore, useVehicleStore } from '@/store';
import { cn } from '@/utils/cn';

interface TripCostCalculatorProps {
  className?: string;
}

type CalculationStatus = 'idle' | 'calculating' | 'completed' | 'error';

const TripCostCalculator: React.FC<TripCostCalculatorProps> = ({ className }) => {
  const { waypoints } = useRouteStore();
  const { profile: vehicleProfile } = useVehicleStore();

  const [status, setStatus] = useState<CalculationStatus>('idle');
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null);
  const [optimization, setOptimization] = useState<CostOptimization | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cost calculation settings
  const [fuelConsumption, setFuelConsumption] = useState<FuelConsumptionSettings>({
    consumptionType: 'l_per_100km',
    consumption: 12,
    fuelType: 'diesel',
    tankCapacity: 80
  });

  const [fuelPrices, setFuelPrices] = useState<FuelPriceSettings>({
    priceType: 'default_european',
    currency: 'EUR'
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Initialize with vehicle profile defaults
  useEffect(() => {
    if (vehicleProfile) {
      const defaultConsumption = CostCalculationService.getDefaultConsumption(vehicleProfile);
      setFuelConsumption(defaultConsumption);
    }
  }, [vehicleProfile]);

  const handleCalculateCosts = useCallback(async () => {
    if (waypoints.length < 2) {
      setError('At least 2 waypoints are required for cost calculation');
      return;
    }

    setStatus('calculating');
    setError(null);

    try {
      const breakdown = await CostCalculationService.calculateRouteCosts(
        waypoints,
        vehicleProfile || undefined,
        fuelConsumption,
        fuelPrices
      );

      setCostBreakdown(breakdown);

      // Calculate optimization suggestions
      const optimizationSuggestions = await CostCalculationService.calculateCostOptimizations(
        breakdown,
        vehicleProfile || undefined
      );

      setOptimization(optimizationSuggestions);
      setStatus('completed');
    } catch (err) {
      console.error('Cost calculation failed:', err);
      setError(err instanceof Error ? err.message : 'Cost calculation failed');
      setStatus('error');
    }
  }, [waypoints, vehicleProfile, fuelConsumption, fuelPrices]);

  const updateConsumption = useCallback((updates: Partial<FuelConsumptionSettings>) => {
    setFuelConsumption(prev => ({ ...prev, ...updates }));
  }, []);

  const updatePrices = useCallback((updates: Partial<FuelPriceSettings>) => {
    setFuelPrices(prev => ({ ...prev, ...updates }));
  }, []);

  const canCalculate = waypoints.length >= 2 && status !== 'calculating';
  const hasResults = status === 'completed' && costBreakdown;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Cost Calculator Controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">
            Trip Cost Calculator
          </h3>
          <div className="text-xs text-gray-500">
            {waypoints.length} waypoints
          </div>
        </div>

        {/* Fuel Consumption Settings */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700">
            Fuel Consumption
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              value={fuelConsumption.consumption}
              onChange={(e) => updateConsumption({ consumption: parseFloat(e.target.value) || 0 })}
              className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
              step="0.1"
              min="0"
            />
            <select
              value={fuelConsumption.consumptionType}
              onChange={(e) => updateConsumption({ consumptionType: e.target.value as FuelConsumptionSettings['consumptionType'] })}
              className="text-xs border border-gray-300 rounded px-2 py-1"
            >
              <option value="l_per_100km">L/100km</option>
              <option value="mpg_imperial">MPG (UK)</option>
              <option value="mpg_us">MPG (US)</option>
            </select>
          </div>
        </div>

        {/* Fuel Type */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700">
            Fuel Type
          </label>
          <select
            value={fuelConsumption.fuelType}
            onChange={(e) => updateConsumption({ fuelType: e.target.value as FuelConsumptionSettings['fuelType'] })}
            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
          >
            <option value="diesel">Diesel</option>
            <option value="petrol">Petrol</option>
            <option value="lpg">LPG</option>
            <option value="electric">Electric</option>
          </select>
        </div>

        {/* Advanced Settings Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
        </button>

        {/* Advanced Settings */}
        {showAdvanced && (
          <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">
                Currency
              </label>
              <select
                value={fuelPrices.currency}
                onChange={(e) => updatePrices({ currency: e.target.value as FuelPriceSettings['currency'] })}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">
                Tank Capacity (L)
              </label>
              <input
                type="number"
                value={fuelConsumption.tankCapacity || 80}
                onChange={(e) => updateConsumption({ tankCapacity: parseFloat(e.target.value) || 80 })}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                min="20"
                max="200"
              />
            </div>
          </div>
        )}

        {/* Calculate Button */}
        <button
          onClick={handleCalculateCosts}
          disabled={!canCalculate}
          className={cn(
            'w-full px-3 py-2 text-sm font-medium rounded transition-colors',
            canCalculate
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          )}
        >
          {status === 'calculating' ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Calculating...</span>
            </div>
          ) : (
            'Calculate Trip Cost'
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

      {/* Cost Results */}
      {hasResults && (
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Trip Cost Summary
            </h4>

            {/* Total Cost */}
            <div className="text-lg font-bold text-blue-900 mb-2">
              {fuelPrices.currency === 'EUR' ? '€' : fuelPrices.currency === 'GBP' ? '£' : '$'}
              {costBreakdown.totalCost.toFixed(2)}
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-blue-700">Fuel Cost</span>
                <span className="font-medium text-blue-900">
                  {fuelPrices.currency === 'EUR' ? '€' : fuelPrices.currency === 'GBP' ? '£' : '$'}
                  {costBreakdown.fuelCost.toFixed(2)}
                </span>
              </div>
              {costBreakdown.accommodationCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-blue-700">Accommodation</span>
                  <span className="font-medium text-blue-900">
                    {fuelPrices.currency === 'EUR' ? '€' : fuelPrices.currency === 'GBP' ? '£' : '$'}
                    {costBreakdown.accommodationCost.toFixed(2)}
                  </span>
                </div>
              )}
              {costBreakdown.tollCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-blue-700">Tolls</span>
                  <span className="font-medium text-blue-900">
                    {fuelPrices.currency === 'EUR' ? '€' : fuelPrices.currency === 'GBP' ? '£' : '$'}
                    {costBreakdown.tollCost.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Trip Statistics */}
            <div className="mt-2 pt-2 border-t border-blue-200">
              <div className="text-xs text-blue-600">
                {costBreakdown.segments.length} segments • {costBreakdown.dailyBreakdown.length} days
              </div>
            </div>
          </div>

          {/* Daily Breakdown */}
          {costBreakdown.dailyBreakdown.length > 1 && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <h5 className="text-xs font-medium text-gray-900 mb-2">Daily Breakdown</h5>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {costBreakdown.dailyBreakdown.map((day, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="text-gray-600">
                      Day {index + 1} ({day.distance.toFixed(0)} km)
                    </span>
                    <span className="font-medium text-gray-900">
                      {fuelPrices.currency === 'EUR' ? '€' : fuelPrices.currency === 'GBP' ? '£' : '$'}
                      {day.totalDailyCost.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optimization Suggestions */}
          {optimization && optimization.savings > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <h5 className="text-xs font-medium text-green-900 mb-2">
                Cost Savings Opportunities
              </h5>
              <div className="text-sm font-medium text-green-900 mb-2">
                Potential Savings: {fuelPrices.currency === 'EUR' ? '€' : fuelPrices.currency === 'GBP' ? '£' : '$'}
                {optimization.savings.toFixed(2)}
              </div>
              <div className="space-y-2">
                {optimization.suggestions.slice(0, 2).map((suggestion, index) => (
                  <div key={index} className="text-xs">
                    <div className="font-medium text-green-800">
                      {suggestion.description}
                    </div>
                    <div className="text-green-600">
                      Save {fuelPrices.currency === 'EUR' ? '€' : fuelPrices.currency === 'GBP' ? '£' : '$'}
                      {suggestion.potentialSaving.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      {waypoints.length < 2 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-xs text-blue-700">
            Add at least 2 waypoints to calculate trip costs including fuel, accommodation, and optimization suggestions.
          </div>
        </div>
      )}
    </div>
  );
};

export default TripCostCalculator;