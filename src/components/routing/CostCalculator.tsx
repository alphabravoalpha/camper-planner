// Cost Calculator Component
// Enhanced with 5 budget categories — reads settings from tripSettingsStore

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calculator,
  Euro,
  TrendingDown,
  Fuel,
  MapPin,
  Calendar,
  Info,
  Tent,
  UtensilsCrossed,
  Ship,
} from 'lucide-react';
import { useRouteStore } from '../../store';
import { useVehicleStore } from '../../store';
import { useCostStore, createRouteHash, isCacheValid } from '../../store/costStore';
import { useTripSettingsStore } from '../../store/tripSettingsStore';
import {
  CostCalculationService,
  type CostBreakdown,
  type CostOptimization,
  type FuelConsumptionSettings,
  type FuelPriceSettings,
} from '../../services/CostCalculationService';

interface CostCalculatorProps {
  className?: string;
  onCostUpdate?: (breakdown: CostBreakdown) => void;
  isVisible?: boolean;
}

const CostCalculator: React.FC<CostCalculatorProps> = ({
  className = '',
  onCostUpdate,
  isVisible = true,
}) => {
  const { waypoints } = useRouteStore();
  const { profile } = useVehicleStore();
  const { settings } = useTripSettingsStore();
  const {
    preferences,
    lastCalculation,
    setLastCalculation,
  } = useCostStore();

  const [isCalculating, setIsCalculating] = useState(false);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null);
  const [optimization, setOptimization] = useState<CostOptimization | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Derive fuel consumption settings from trip settings store
  const fuelConsumptionSettings: FuelConsumptionSettings = useMemo(() => ({
    consumptionType: settings.fuelConsumption.unit === 'l_per_100km'
      ? 'l_per_100km'
      : settings.fuelConsumption.unit === 'mpg_imperial'
        ? 'mpg_imperial'
        : 'mpg_us',
    consumption: settings.fuelConsumption.value,
    fuelType: settings.fuelConsumption.fuelType === 'electric'
      ? 'electricity'
      : settings.fuelConsumption.fuelType,
    tankCapacity: settings.fuelConsumption.tankCapacity,
  }), [settings.fuelConsumption]);

  // Derive fuel price settings from trip settings store
  const fuelPriceSettings: FuelPriceSettings = useMemo(() => ({
    priceType: 'manual' as const,
    currency: settings.currency,
    manualPrices: {
      petrol: settings.fuelPricePerLitre,
      diesel: settings.fuelPricePerLitre,
      lpg: settings.fuelPricePerLitre,
      electricity: settings.fuelPricePerLitre,
    },
  }), [settings.currency, settings.fuelPricePerLitre]);

  // Calculate route hash for caching (includes settings so cache invalidates on budget changes)
  const routeHash = useMemo(() => {
    const base = createRouteHash(waypoints, profile);
    const settingsHash = `${settings.dailyBudget.food}-${settings.dailyBudget.campsite}-${settings.crossing.type}-${settings.crossing.estimatedCost ?? 0}-${settings.fuelPricePerLitre}-${settings.fuelConsumption.value}-${settings.currency}`;
    return `${base}_${settingsHash}`;
  }, [waypoints, profile, settings]);

  // Auto-calculate costs when route or settings change
  useEffect(() => {
    if (waypoints.length < 2) {
      setCostBreakdown(null);
      setOptimization(null);
      return;
    }

    // Check if we have valid cached calculation
    if (
      lastCalculation.routeHash === routeHash &&
      lastCalculation.breakdown &&
      isCacheValid(lastCalculation.timestamp)
    ) {
      setCostBreakdown(lastCalculation.breakdown);
      return;
    }

    calculateCosts();
  }, [waypoints, profile, fuelConsumptionSettings, fuelPriceSettings, settings]);

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
      // Calculate base cost breakdown from the service
      const baseBreakdown = await CostCalculationService.calculateRouteCosts(
        waypoints,
        profile || undefined,
        fuelConsumptionSettings,
        fuelPriceSettings,
      );

      // Enhance breakdown with trip settings budget costs
      const tripDays = baseBreakdown.dailyBreakdown.length || 1;
      const foodCost = settings.dailyBudget.food * tripDays;

      // Calculate ferry/crossing cost
      const ferryCost =
        settings.crossing.type === 'ferry' || settings.crossing.type === 'eurotunnel'
          ? settings.crossing.estimatedCost || 0
          : 0;

      // Calculate accommodation cost from trip settings daily budget
      const accommodationNights = baseBreakdown.segments.filter(
        (s) => s.segmentType === 'overnight',
      ).length;
      const accommodationCost =
        accommodationNights > 0
          ? accommodationNights * settings.dailyBudget.campsite
          : (tripDays - 1) * settings.dailyBudget.campsite;

      // Build enhanced daily breakdown with food costs
      const dailyFoodCost = settings.dailyBudget.food;
      const enhancedDailyBreakdown = baseBreakdown.dailyBreakdown.map((day) => ({
        ...day,
        foodCost: dailyFoodCost,
        accommodationCost: settings.dailyBudget.campsite,
        totalDailyCost: day.fuelCost + settings.dailyBudget.campsite + dailyFoodCost,
      }));

      const enhancedBreakdown: CostBreakdown = {
        ...baseBreakdown,
        foodCost,
        ferryCost,
        accommodationCost,
        dailyBreakdown: enhancedDailyBreakdown,
        totalCost:
          baseBreakdown.fuelCost +
          accommodationCost +
          foodCost +
          baseBreakdown.tollCost +
          ferryCost,
      };

      setCostBreakdown(enhancedBreakdown);

      // Cache the calculation
      setLastCalculation({
        routeHash,
        breakdown: enhancedBreakdown,
        timestamp: Date.now(),
      });

      // Calculate optimization suggestions
      if (preferences.showOptimizationSuggestions) {
        const optimizationResult = await CostCalculationService.calculateCostOptimizations(
          enhancedBreakdown,
          profile || undefined,
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
      maximumFractionDigits: 2,
    }).format(amount);
  };

  /** Percentage of the total, clamped to 0-100. */
  const pct = (part: number, total: number): number =>
    total > 0 ? Math.round((part / total) * 100) : 0;

  if (!isVisible) return null;

  return (
    <div className={`bg-white rounded-lg shadow-lg border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-green-50 to-primary-50">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-neutral-800">Trip Cost Calculator</h3>
        </div>
        <span className="text-xs text-neutral-500">Edit budget in Trip Settings</span>
      </div>

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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-neutral-600">Calculating costs...</span>
          </div>
        ) : costBreakdown ? (
          <div className="space-y-4">
            {/* Total Cost Hero */}
            <div className="bg-gradient-to-r from-primary-50 to-green-50 rounded-lg p-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-neutral-800 mb-1">
                  {formatCurrency(costBreakdown.totalCost, costBreakdown.currency)}
                </div>
                <div className="text-sm text-neutral-600">Estimated Trip Cost</div>
              </div>
            </div>

            {/* 5 Cost Category Bars */}
            <div className="space-y-2">
              {/* Fuel */}
              <CostRow
                icon={<Fuel className="w-4 h-4 text-blue-600" />}
                label="Fuel"
                amount={formatCurrency(costBreakdown.fuelCost, costBreakdown.currency)}
                percentage={pct(costBreakdown.fuelCost, costBreakdown.totalCost)}
                color="bg-blue-500"
              />

              {/* Campsites */}
              <CostRow
                icon={<Tent className="w-4 h-4 text-green-600" />}
                label="Campsites"
                amount={formatCurrency(costBreakdown.accommodationCost, costBreakdown.currency)}
                percentage={pct(costBreakdown.accommodationCost, costBreakdown.totalCost)}
                color="bg-green-500"
              />

              {/* Food */}
              <CostRow
                icon={<UtensilsCrossed className="w-4 h-4 text-orange-600" />}
                label="Food"
                amount={formatCurrency(costBreakdown.foodCost, costBreakdown.currency)}
                percentage={pct(costBreakdown.foodCost, costBreakdown.totalCost)}
                color="bg-orange-500"
              />

              {/* Tolls — hidden if 0 */}
              {costBreakdown.tollCost > 0 && (
                <CostRow
                  icon={<Euro className="w-4 h-4 text-purple-600" />}
                  label="Tolls"
                  amount={formatCurrency(costBreakdown.tollCost, costBreakdown.currency)}
                  percentage={pct(costBreakdown.tollCost, costBreakdown.totalCost)}
                  color="bg-purple-500"
                />
              )}

              {/* Ferry / Crossing — hidden if 0 */}
              {costBreakdown.ferryCost > 0 && (
                <CostRow
                  icon={<Ship className="w-4 h-4 text-cyan-600" />}
                  label="Ferry / Crossing"
                  amount={formatCurrency(costBreakdown.ferryCost, costBreakdown.currency)}
                  percentage={pct(costBreakdown.ferryCost, costBreakdown.totalCost)}
                  color="bg-cyan-500"
                />
              )}
            </div>

            {/* Daily Breakdown */}
            {preferences.showDailyEstimates && costBreakdown.dailyBreakdown.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-primary-600" />
                  <h4 className="font-medium text-neutral-800">Daily Cost Breakdown</h4>
                </div>
                <div className="space-y-2">
                  {costBreakdown.dailyBreakdown.map((day, index) => (
                    <div key={index} className="bg-neutral-50 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-neutral-800">
                            Day {index + 1} - {day.date.toLocaleDateString()}
                          </div>
                          <div className="text-sm text-neutral-600">
                            {day.distance.toFixed(0)}km driving
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {formatCurrency(day.totalDailyCost, costBreakdown.currency)}
                          </div>
                          <div className="text-xs text-neutral-500 space-x-2">
                            <span>Fuel: {formatCurrency(day.fuelCost, costBreakdown.currency)}</span>
                            <span>Food: {formatCurrency(day.foodCost, costBreakdown.currency)}</span>
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
                  <h4 className="font-medium text-neutral-800">Route Segments</h4>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {costBreakdown.segments.map((segment, index) => (
                    <div key={index} className="bg-neutral-50 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-neutral-800 truncate">
                            {segment.startWaypoint.name} &rarr; {segment.endWaypoint.name}
                          </div>
                          <div className="text-sm text-neutral-600">
                            {segment.distance.toFixed(0)}km &bull; {Math.round(segment.duration)}min
                            {segment.segmentType === 'overnight' && (
                              <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs">
                                Overnight
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-semibold">
                            {formatCurrency(
                              segment.fuelCost + (segment.accommodationCost || 0),
                              costBreakdown.currency,
                            )}
                          </div>
                          <div className="text-sm text-neutral-600">
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
            {preferences.showOptimizationSuggestions &&
              optimization &&
              optimization.suggestions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown className="w-4 h-4 text-orange-600" />
                    <h4 className="font-medium text-neutral-800">Cost Optimization</h4>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="text-center mb-3">
                      <div className="text-lg font-semibold text-orange-800">
                        Potential Savings:{' '}
                        {formatCurrency(optimization.savings, costBreakdown.currency)}
                      </div>
                      <div className="text-sm text-orange-600">
                        Optimized total:{' '}
                        {formatCurrency(optimization.optimizedCost, costBreakdown.currency)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {optimization.suggestions.slice(0, 3).map((suggestion, index) => (
                        <div key={index} className="bg-white rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium text-neutral-800">
                                {suggestion.description}
                              </div>
                              <div className="text-sm text-neutral-600 mt-1">
                                {suggestion.actionRequired}
                              </div>
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
          <div className="text-center py-8 text-neutral-500">
            <Calculator className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
            <p>Add waypoints to your route to calculate trip costs</p>
          </div>
        )}
      </div>
    </div>
  );
};

// -----------------------------------------------
// Cost row sub-component (one per category)
// -----------------------------------------------

interface CostRowProps {
  icon: React.ReactNode;
  label: string;
  amount: string;
  percentage: number;
  color: string;
}

const CostRow: React.FC<CostRowProps> = ({ icon, label, amount, percentage, color }) => (
  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 transition-colors">
    <div className="flex items-center gap-2 w-36 shrink-0">
      {icon}
      <span className="text-sm font-medium text-neutral-700">{label}</span>
    </div>
    <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} rounded-full transition-all`}
        style={{ width: `${percentage}%` }}
      />
    </div>
    <div className="text-sm font-semibold text-neutral-800 w-24 text-right">{amount}</div>
    <div className="text-xs text-neutral-500 w-10 text-right">{percentage}%</div>
  </div>
);

export default CostCalculator;
