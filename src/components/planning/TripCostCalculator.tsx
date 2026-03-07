// Trip Cost Calculator Component
// Phase 5.2: Fuel cost estimation and trip budgeting UI

import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CostCalculationService,
  type FuelConsumptionSettings,
  type FuelPriceSettings,
  type CostBreakdown,
  type CostOptimization,
} from '@/services/CostCalculationService';
import { useRouteStore, useVehicleStore } from '@/store';
import { cn } from '@/utils/cn';

interface TripCostCalculatorProps {
  className?: string;
}

type CalculationStatus = 'idle' | 'calculating' | 'completed' | 'error';

const TripCostCalculator: React.FC<TripCostCalculatorProps> = ({ className }) => {
  const { t } = useTranslation();
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
    tankCapacity: 80,
  });

  const [fuelPrices, setFuelPrices] = useState<FuelPriceSettings>({
    priceType: 'default_european',
    currency: 'EUR',
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
      setError(t('planning.costCalc.minWaypointsError'));
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
      // Error already surfaced in UI via setError
      setError(err instanceof Error ? err.message : t('planning.costCalc.calculationFailed'));
      setStatus('error');
    }
  }, [waypoints, vehicleProfile, fuelConsumption, fuelPrices, t]);

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
          <h3 className="text-sm font-display font-medium text-neutral-900">
            {t('planning.costCalc.title')}
          </h3>
          <div className="text-xs text-neutral-500">
            {t('planning.costCalc.waypointsCount', { count: waypoints.length })}
          </div>
        </div>

        {/* Fuel Consumption Settings */}
        <div className="space-y-2">
          <label
            htmlFor="trip-cost-fuel-consumption"
            className="text-xs font-medium text-neutral-700"
          >
            {t('planning.costCalc.fuelConsumption')}
          </label>
          <div className="flex space-x-2">
            <input
              id="trip-cost-fuel-consumption"
              type="number"
              value={fuelConsumption.consumption}
              onChange={e => updateConsumption({ consumption: parseFloat(e.target.value) || 0 })}
              className="flex-1 text-xs border border-neutral-300 rounded px-2 py-1"
              step="0.1"
              min="0"
            />
            <select
              value={fuelConsumption.consumptionType}
              onChange={e =>
                updateConsumption({
                  consumptionType: e.target.value as FuelConsumptionSettings['consumptionType'],
                })
              }
              className="text-xs border border-neutral-300 rounded px-2 py-1"
            >
              <option value="l_per_100km">{t('planning.costCalc.lPer100km')}</option>
              <option value="mpg_imperial">{t('planning.costCalc.mpgUk')}</option>
              <option value="mpg_us">{t('planning.costCalc.mpgUs')}</option>
            </select>
          </div>
        </div>

        {/* Fuel Type */}
        <div className="space-y-2">
          <label htmlFor="trip-cost-fuel-type" className="text-xs font-medium text-neutral-700">
            {t('planning.costCalc.fuelType')}
          </label>
          <select
            id="trip-cost-fuel-type"
            value={fuelConsumption.fuelType}
            onChange={e =>
              updateConsumption({ fuelType: e.target.value as FuelConsumptionSettings['fuelType'] })
            }
            className="w-full text-xs border border-neutral-300 rounded px-2 py-1"
          >
            <option value="diesel">{t('planning.costCalc.diesel')}</option>
            <option value="petrol">{t('planning.costCalc.petrol')}</option>
            <option value="lpg">{t('planning.costCalc.lpg')}</option>
            <option value="electric">{t('planning.costCalc.electric')}</option>
          </select>
        </div>

        {/* Advanced Settings Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-primary-600 hover:text-primary-800"
        >
          {showAdvanced ? t('planning.costCalc.hideAdvanced') : t('planning.costCalc.showAdvanced')}
        </button>

        {/* Advanced Settings */}
        {showAdvanced && (
          <div className="space-y-2 p-3 bg-neutral-50 rounded-lg">
            <div className="space-y-2">
              <label htmlFor="trip-cost-currency" className="text-xs font-medium text-neutral-700">
                {t('planning.costCalc.currency')}
              </label>
              <select
                id="trip-cost-currency"
                value={fuelPrices.currency}
                onChange={e =>
                  updatePrices({ currency: e.target.value as FuelPriceSettings['currency'] })
                }
                className="w-full text-xs border border-neutral-300 rounded px-2 py-1"
              >
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="trip-cost-tank-capacity"
                className="text-xs font-medium text-neutral-700"
              >
                {t('planning.costCalc.tankCapacity')}
              </label>
              <input
                id="trip-cost-tank-capacity"
                type="number"
                value={fuelConsumption.tankCapacity || 80}
                onChange={e =>
                  updateConsumption({ tankCapacity: parseFloat(e.target.value) || 80 })
                }
                className="w-full text-xs border border-neutral-300 rounded px-2 py-1"
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
              : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
          )}
        >
          {status === 'calculating' ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{t('planning.costCalc.calculatingBtn')}</span>
            </div>
          ) : (
            t('planning.costCalc.calculateBtn')
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Cost Results */}
      {hasResults && (
        <div className="space-y-3">
          <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
            <h4 className="text-sm font-medium text-primary-900 mb-2">
              {t('planning.costCalc.tripCostSummary')}
            </h4>

            {/* Total Cost */}
            <div className="text-lg font-bold text-primary-900 mb-2">
              {fuelPrices.currency === 'EUR' ? '€' : fuelPrices.currency === 'GBP' ? '£' : '$'}
              {costBreakdown.totalCost.toFixed(2)}
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-primary-700">{t('planning.costCalc.fuelCost')}</span>
                <span className="font-medium text-primary-900">
                  {fuelPrices.currency === 'EUR' ? '€' : fuelPrices.currency === 'GBP' ? '£' : '$'}
                  {costBreakdown.fuelCost.toFixed(2)}
                </span>
              </div>
              {costBreakdown.accommodationCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-primary-700">{t('planning.costCalc.accommodation')}</span>
                  <span className="font-medium text-primary-900">
                    {fuelPrices.currency === 'EUR'
                      ? '€'
                      : fuelPrices.currency === 'GBP'
                        ? '£'
                        : '$'}
                    {costBreakdown.accommodationCost.toFixed(2)}
                  </span>
                </div>
              )}
              {costBreakdown.tollCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-primary-700">{t('planning.costCalc.tolls')}</span>
                  <span className="font-medium text-primary-900">
                    {fuelPrices.currency === 'EUR'
                      ? '€'
                      : fuelPrices.currency === 'GBP'
                        ? '£'
                        : '$'}
                    {costBreakdown.tollCost.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Trip Statistics */}
            <div className="mt-2 pt-2 border-t border-primary-200">
              <div className="text-xs text-primary-600">
                {t('planning.costCalc.segmentsAndDays', {
                  segments: costBreakdown.segments.length,
                  days: costBreakdown.dailyBreakdown.length,
                })}
              </div>
            </div>
          </div>

          {/* Daily Breakdown */}
          {costBreakdown.dailyBreakdown.length > 1 && (
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
              <h5 className="text-xs font-medium text-neutral-900 mb-2">
                {t('planning.costCalc.dailyBreakdown')}
              </h5>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {costBreakdown.dailyBreakdown.map((day, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="text-neutral-600">
                      {t('planning.costCalc.dayDistance', {
                        day: index + 1,
                        distance: day.distance.toFixed(0),
                      })}
                    </span>
                    <span className="font-medium text-neutral-900">
                      {fuelPrices.currency === 'EUR'
                        ? '€'
                        : fuelPrices.currency === 'GBP'
                          ? '£'
                          : '$'}
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
                {t('planning.costCalc.costSavings')}
              </h5>
              <div className="text-sm font-medium text-green-900 mb-2">
                {t('planning.costCalc.potentialSavings')}{' '}
                {fuelPrices.currency === 'EUR' ? '€' : fuelPrices.currency === 'GBP' ? '£' : '$'}
                {optimization.savings.toFixed(2)}
              </div>
              <div className="space-y-2">
                {optimization.suggestions.slice(0, 2).map((suggestion, index) => (
                  <div key={index} className="text-xs">
                    <div className="font-medium text-green-800">{suggestion.description}</div>
                    <div className="text-green-600">
                      {t('planning.costCalc.savingsAmount', {
                        amount: `${fuelPrices.currency === 'EUR' ? '€' : fuelPrices.currency === 'GBP' ? '£' : '$'}${suggestion.potentialSaving.toFixed(2)}`,
                      })}
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
        <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
          <div className="text-xs text-primary-700">{t('planning.costCalc.helpText')}</div>
        </div>
      )}
    </div>
  );
};

export default TripCostCalculator;
