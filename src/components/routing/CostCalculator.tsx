// Cost Calculator Component
// Phase 5.2: Comprehensive trip cost calculation and display

import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, Euro, TrendingDown, Settings, Fuel, MapPin, Calendar, Info } from 'lucide-react';
import { useRouteStore } from '../../store';
import { useVehicleStore } from '../../store';
import { useCostStore, createRouteHash, isCacheValid } from '../../store/costStore';
import { CostCalculationService } from '../../services/CostCalculationService';
import type {
  CostBreakdown,
  CostOptimization,
  FuelConsumptionSettings,
  FuelPriceSettings
} from '../../services/CostCalculationService';

interface CostCalculatorProps {
  className?: string;
  onCostUpdate?: (breakdown: CostBreakdown) => void;
  isVisible?: boolean;
}

const CostCalculator: React.FC<CostCalculatorProps> = ({
  className = '',
  onCostUpdate,
  isVisible = true
}) => {
  const { waypoints } = useRouteStore();
  const { selectedProfile } = useVehicleStore();
  const {
    fuelConsumptionSettings,
    fuelPriceSettings,
    preferences,
    lastCalculation,
    setFuelConsumptionSettings,
    setFuelPriceSettings,
    setLastCalculation
  } = useCostStore();

  const [isCalculating, setIsCalculating] = useState(false);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null);
  const [optimization, setOptimization] = useState<CostOptimization | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate route hash for caching
  const routeHash = useMemo(() => {
    return createRouteHash(waypoints, selectedProfile);
  }, [waypoints, selectedProfile]);

  // Auto-calculate costs when route or settings change
  useEffect(() => {
    if (waypoints.length < 2) {
      setCostBreakdown(null);
      setOptimization(null);
      return;
    }

    // Check if we have valid cached calculation
    if (lastCalculation.routeHash === routeHash &&
        lastCalculation.breakdown &&
        isCacheValid(lastCalculation.timestamp)) {
      setCostBreakdown(lastCalculation.breakdown);
      return;
    }

    calculateCosts();
  }, [waypoints, selectedProfile, fuelConsumptionSettings, fuelPriceSettings]);

  // Notify parent component of cost updates
  useEffect(() => {
    if (costBreakdown && onCostUpdate) {
      onCostUpdate(costBreakdown);
    }
  }, [costBreakdown, onCostUpdate]);

  const calculateCosts = async () => {
    if (waypoints.length < 2) return;

    setIsCalculating(true);
    setError(null);

    try {
      // Calculate cost breakdown
      const breakdown = await CostCalculationService.calculateRouteCosts(
        waypoints,
        selectedProfile || undefined,
        fuelConsumptionSettings,
        fuelPriceSettings
      );

      setCostBreakdown(breakdown);

      // Cache the calculation
      setLastCalculation({
        routeHash,
        breakdown,
        timestamp: Date.now()
      });

      // Calculate optimization suggestions
      if (preferences.showOptimizationSuggestions) {
        const optimizationResult = await CostCalculationService.calculateCostOptimizations(
          breakdown,
          selectedProfile || undefined
        );
        setOptimization(optimizationResult);
      }

    } catch (err) {
      console.error('Cost calculation failed:', err);
      setError('Failed to calculate trip costs. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'EUR'): string => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatConsumption = (settings: FuelConsumptionSettings): string => {
    switch (settings.consumptionType) {
      case 'l_per_100km':
        return `${settings.consumption.toFixed(1)} L/100km`;
      case 'mpg_imperial':
        return `${settings.consumption.toFixed(1)} MPG (UK)`;
      case 'mpg_us':
        return `${settings.consumption.toFixed(1)} MPG (US)`;
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`bg-white rounded-lg shadow-lg border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-green-50 to-blue-50">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-800">Trip Cost Calculator</h3>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-white rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b bg-gray-50">
          <div className="space-y-4">
            {/* Fuel Consumption Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fuel Consumption
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <select
                  value={fuelConsumptionSettings.consumptionType}
                  onChange={(e) => setFuelConsumptionSettings({
                    ...fuelConsumptionSettings,
                    consumptionType: e.target.value as FuelConsumptionSettings['consumptionType']
                  })}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="l_per_100km">L/100km</option>
                  <option value="mpg_imperial">MPG (UK)</option>
                  <option value="mpg_us">MPG (US)</option>
                </select>

                <input
                  type="number"
                  value={fuelConsumptionSettings.consumption}
                  onChange={(e) => setFuelConsumptionSettings({
                    ...fuelConsumptionSettings,
                    consumption: parseFloat(e.target.value) || 0
                  })}
                  className="px-3 py-2 border rounded-lg text-sm"
                  placeholder="Consumption"
                  step="0.1"
                />

                <select
                  value={fuelConsumptionSettings.fuelType}
                  onChange={(e) => setFuelConsumptionSettings({
                    ...fuelConsumptionSettings,
                    fuelType: e.target.value as FuelConsumptionSettings['fuelType']
                  })}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="diesel">Diesel</option>
                  <option value="petrol">Petrol</option>
                  <option value="lpg">LPG</option>
                  <option value="electric">Electric</option>
                </select>
              </div>
            </div>

            {/* Fuel Price Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fuel Prices
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={fuelPriceSettings.priceType === 'default_european'}
                      onChange={() => setFuelPriceSettings({
                        ...fuelPriceSettings,
                        priceType: 'default_european'
                      })}
                      className="mr-2"
                    />
                    European Averages
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={fuelPriceSettings.priceType === 'manual'}
                      onChange={() => setFuelPriceSettings({
                        ...fuelPriceSettings,
                        priceType: 'manual',
                        manualPrices: fuelPriceSettings.manualPrices || {
                          petrol: 1.65,
                          diesel: 1.55,
                          lpg: 0.85,
                          electricity: 0.35
                        }
                      })}
                      className="mr-2"
                    />
                    Manual Entry
                  </label>
                </div>

                {fuelPriceSettings.priceType === 'manual' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <input
                      type="number"
                      placeholder="Petrol"
                      value={fuelPriceSettings.manualPrices?.petrol || ''}
                      onChange={(e) => setFuelPriceSettings({
                        ...fuelPriceSettings,
                        manualPrices: {
                          ...fuelPriceSettings.manualPrices!,
                          petrol: parseFloat(e.target.value) || 0
                        }
                      })}
                      className="px-3 py-2 border rounded-lg text-sm"
                      step="0.01"
                    />
                    <input
                      type="number"
                      placeholder="Diesel"
                      value={fuelPriceSettings.manualPrices?.diesel || ''}
                      onChange={(e) => setFuelPriceSettings({
                        ...fuelPriceSettings,
                        manualPrices: {
                          ...fuelPriceSettings.manualPrices!,
                          diesel: parseFloat(e.target.value) || 0
                        }
                      })}
                      className="px-3 py-2 border rounded-lg text-sm"
                      step="0.01"
                    />
                    <input
                      type="number"
                      placeholder="LPG"
                      value={fuelPriceSettings.manualPrices?.lpg || ''}
                      onChange={(e) => setFuelPriceSettings({
                        ...fuelPriceSettings,
                        manualPrices: {
                          ...fuelPriceSettings.manualPrices!,
                          lpg: parseFloat(e.target.value) || 0
                        }
                      })}
                      className="px-3 py-2 border rounded-lg text-sm"
                      step="0.01"
                    />
                    <input
                      type="number"
                      placeholder="Electric"
                      value={fuelPriceSettings.manualPrices?.electricity || ''}
                      onChange={(e) => setFuelPriceSettings({
                        ...fuelPriceSettings,
                        manualPrices: {
                          ...fuelPriceSettings.manualPrices!,
                          electricity: parseFloat(e.target.value) || 0
                        }
                      })}
                      className="px-3 py-2 border rounded-lg text-sm"
                      step="0.01"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <Info className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {isCalculating ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Calculating costs...</span>
          </div>
        ) : costBreakdown ? (
          <div className="space-y-4">
            {/* Total Cost Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-800 mb-1">
                  {formatCurrency(costBreakdown.totalCost, costBreakdown.currency)}
                </div>
                <div className="text-sm text-gray-600">Total Trip Cost</div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Fuel className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-600">Fuel</span>
                  </div>
                  <div className="font-semibold">
                    {formatCurrency(costBreakdown.fuelCost, costBreakdown.currency)}
                  </div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-600">Accommodation</span>
                  </div>
                  <div className="font-semibold">
                    {formatCurrency(costBreakdown.accommodationCost, costBreakdown.currency)}
                  </div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Euro className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-gray-600">Tolls</span>
                  </div>
                  <div className="font-semibold">
                    {formatCurrency(costBreakdown.tollCost, costBreakdown.currency)}
                  </div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Calculator className="w-4 h-4 text-orange-600" />
                    <span className="text-sm text-gray-600">Other</span>
                  </div>
                  <div className="font-semibold">
                    {formatCurrency(costBreakdown.otherCosts, costBreakdown.currency)}
                  </div>
                </div>
              </div>
            </div>

            {/* Fuel Settings Display */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600 mb-2">Current Settings:</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Consumption: </span>
                  {formatConsumption(fuelConsumptionSettings)}
                </div>
                <div>
                  <span className="font-medium">Fuel Type: </span>
                  {fuelConsumptionSettings.fuelType.charAt(0).toUpperCase() + fuelConsumptionSettings.fuelType.slice(1)}
                </div>
                <div>
                  <span className="font-medium">Price Source: </span>
                  {fuelPriceSettings.priceType === 'default_european' ? 'EU Averages' : 'Manual'}
                </div>
              </div>
            </div>

            {/* Daily Breakdown */}
            {preferences.showDailyEstimates && costBreakdown.dailyBreakdown.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <h4 className="font-medium text-gray-800">Daily Cost Breakdown</h4>
                </div>
                <div className="space-y-2">
                  {costBreakdown.dailyBreakdown.map((day, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-800">
                            Day {index + 1} - {day.date.toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-600">
                            {day.distance.toFixed(0)}km driving
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {formatCurrency(day.totalDailyCost, costBreakdown.currency)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Fuel: {formatCurrency(day.fuelCost, costBreakdown.currency)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Route Segments */}
            {preferences.showCostBreakdown && costBreakdown.segments.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <h4 className="font-medium text-gray-800">Route Segments</h4>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {costBreakdown.segments.map((segment, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 truncate">
                            {segment.startWaypoint.name} → {segment.endWaypoint.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {segment.distance.toFixed(0)}km • {Math.round(segment.duration)}min
                            {segment.segmentType === 'overnight' && (
                              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                Overnight
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-semibold">
                            {formatCurrency(segment.fuelCost + (segment.accommodationCost || 0), costBreakdown.currency)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Fuel: {formatCurrency(segment.fuelCost, costBreakdown.currency)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Optimization Suggestions */}
            {preferences.showOptimizationSuggestions && optimization && optimization.suggestions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="w-4 h-4 text-orange-600" />
                  <h4 className="font-medium text-gray-800">Cost Optimization</h4>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="text-center mb-3">
                    <div className="text-lg font-semibold text-orange-800">
                      Potential Savings: {formatCurrency(optimization.savings, costBreakdown.currency)}
                    </div>
                    <div className="text-sm text-orange-600">
                      Optimized total: {formatCurrency(optimization.optimizedCost, costBreakdown.currency)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {optimization.suggestions.slice(0, 3).map((suggestion, index) => (
                      <div key={index} className="bg-white rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">{suggestion.description}</div>
                            <div className="text-sm text-gray-600 mt-1">{suggestion.actionRequired}</div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="font-semibold text-green-600">
                              -{formatCurrency(suggestion.potentialSaving, costBreakdown.currency)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calculator className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Add waypoints to your route to calculate trip costs</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CostCalculator;