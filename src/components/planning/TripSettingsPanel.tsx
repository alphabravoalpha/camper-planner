// Trip Settings Panel
// Centralised settings hub for dates, driving style, channel crossing, budget, and fuel.
// Reads/writes from useTripSettingsStore — all changes are persisted immediately.

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useTripSettingsStore } from '../../store/tripSettingsStore';
import { useVehicleStore, useUIStore } from '../../store';
import {
  type DrivingStyle,
  type Currency,
  type CrossingType,
  type FuelType,
  type ConsumptionUnit,
  CURRENCY_SYMBOLS,
  getSeasonFromDate,
  getDrivingLimitsForStyle,
} from '../../types/tripSettings';

// ============================================
// Collapsible Section
// ============================================

interface SectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function Section({ title, defaultOpen = false, children }: SectionProps): JSX.Element {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-neutral-200 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-2.5 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
      >
        {title}
        {open ? (
          <ChevronUp className="w-4 h-4 text-neutral-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-neutral-400" />
        )}
      </button>
      {open && <div className="pb-3 space-y-3">{children}</div>}
    </div>
  );
}

// ============================================
// Helpers
// ============================================

function computeDuration(startDate?: string, endDate?: string): number | null {
  if (!startDate || !endDate) return null;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();

  if (diffMs < 0) return null;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

const SEASON_LABELS: Record<string, string> = {
  spring: 'Spring',
  summer: 'Summer',
  autumn: 'Autumn',
  winter: 'Winter',
};

const DRIVING_STYLE_OPTIONS: { value: DrivingStyle; label: string }[] = [
  { value: 'relaxed', label: 'Relaxed' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'intensive', label: 'Intensive' },
];

const REST_DAY_OPTIONS = [
  { value: 0, label: 'None' },
  { value: 3, label: 'Every 3 days' },
  { value: 5, label: 'Every 5 days' },
  { value: 7, label: 'Every 7 days' },
];

const CROSSING_OPTIONS: { value: CrossingType; label: string }[] = [
  { value: 'ferry', label: 'Ferry' },
  { value: 'eurotunnel', label: 'Eurotunnel' },
  { value: 'drive_around', label: 'Drive around' },
  { value: 'none', label: 'Not applicable' },
];

const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'USD', label: 'USD' },
];

const FUEL_TYPE_OPTIONS: { value: FuelType; label: string }[] = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'petrol', label: 'Petrol' },
  { value: 'lpg', label: 'LPG' },
  { value: 'electric', label: 'Electric' },
];

const CONSUMPTION_UNIT_OPTIONS: { value: ConsumptionUnit; label: string }[] = [
  { value: 'l_per_100km', label: 'L/100km' },
  { value: 'mpg_imperial', label: 'MPG (UK)' },
  { value: 'mpg_us', label: 'MPG (US)' },
];

// Shared input class for consistency
const INPUT_CLASS =
  'w-full text-xs border border-neutral-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400';
const SELECT_CLASS =
  'w-full text-xs border border-neutral-300 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400';

// ============================================
// Main Component
// ============================================

interface TripSettingsPanelProps {
  className?: string;
}

const TripSettingsPanel: React.FC<TripSettingsPanelProps> = ({ className = '' }) => {
  const {
    settings,
    setStartDate,
    setEndDate,
    setDrivingStyle,
    setRestDayFrequency,
    setCrossingType,
    setCrossingCost,
    setCurrency,
    setDailyBudget,
    setFuelType,
    setFuelConsumption,
    setFuelConsumptionUnit,
    setFuelPrice,
    setTankCapacity,
  } = useTripSettingsStore();

  const { profile: vehicleProfile } = useVehicleStore();
  const { openVehicleSidebar } = useUIStore();

  const currencySymbol = CURRENCY_SYMBOLS[settings.currency];
  const duration = computeDuration(settings.startDate, settings.endDate);
  const season = getSeasonFromDate(settings.startDate);

  return (
    <div className={`space-y-0 ${className}`}>
      {/* Section 1: Dates & Duration */}
      <Section title="Dates & Duration" defaultOpen>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Start date</label>
            <input
              type="date"
              value={settings.startDate ?? ''}
              onChange={(e) => setStartDate(e.target.value || undefined)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">End date</label>
            <input
              type="date"
              value={settings.endDate ?? ''}
              onChange={(e) => setEndDate(e.target.value || undefined)}
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {duration !== null ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-medium">
              {duration} {duration === 1 ? 'day' : 'days'}
            </span>
          ) : (
            <span className="text-neutral-400">Duration: not set</span>
          )}
          {settings.startDate && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
              {SEASON_LABELS[season]}
            </span>
          )}
        </div>
      </Section>

      {/* Section 2: Driving Style */}
      <Section title="Driving Style">
        <div className="space-y-1.5">
          {DRIVING_STYLE_OPTIONS.map((option) => {
            const limits = getDrivingLimitsForStyle(option.value);
            return (
              <label
                key={option.value}
                className="flex items-center gap-2 text-xs cursor-pointer group"
              >
                <input
                  type="radio"
                  name="drivingStyle"
                  value={option.value}
                  checked={settings.drivingStyle === option.value}
                  onChange={() => setDrivingStyle(option.value)}
                  className="text-sky-600 focus:ring-sky-400"
                />
                <span className="text-neutral-700 group-hover:text-neutral-900">
                  {option.label}
                </span>
                <span className="text-neutral-400 ml-auto">
                  {limits.maxHours}h / {limits.maxKmPerDay}km
                </span>
              </label>
            );
          })}
        </div>

        <div>
          <label className="block text-xs text-neutral-500 mb-1">Rest days</label>
          <select
            value={settings.restDayFrequency}
            onChange={(e) => setRestDayFrequency(Number(e.target.value))}
            className={SELECT_CLASS}
          >
            {REST_DAY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </Section>

      {/* Section 3: Channel Crossing */}
      <Section title="Channel Crossing">
        <div className="space-y-1.5">
          {CROSSING_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 text-xs cursor-pointer group"
            >
              <input
                type="radio"
                name="crossingType"
                value={option.value}
                checked={settings.crossing.type === option.value}
                onChange={() => setCrossingType(option.value)}
                className="text-sky-600 focus:ring-sky-400"
              />
              <span className="text-neutral-700 group-hover:text-neutral-900">
                {option.label}
              </span>
            </label>
          ))}
        </div>

        {settings.crossing.type !== 'none' && settings.crossing.type !== 'drive_around' && (
          <div>
            <label className="block text-xs text-neutral-500 mb-1">
              Estimated cost ({currencySymbol})
            </label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                {currencySymbol}
              </span>
              <input
                type="number"
                min={0}
                step={5}
                value={settings.crossing.estimatedCost ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setCrossingCost(val === '' ? undefined : Number(val));
                }}
                placeholder="e.g. 150"
                className={`${INPUT_CLASS} pl-5`}
              />
            </div>
          </div>
        )}
      </Section>

      {/* Section 4: Daily Budget */}
      <Section title="Daily Budget">
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Currency</label>
          <select
            value={settings.currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className={SELECT_CLASS}
          >
            {CURRENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value} ({CURRENCY_SYMBOLS[option.value]})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          {([
            { key: 'campsite' as const, label: 'Campsite (per night)' },
            { key: 'food' as const, label: 'Food (per day)' },
            { key: 'activities' as const, label: 'Activities (per day)' },
          ]).map((field) => (
            <div key={field.key}>
              <label className="block text-xs text-neutral-500 mb-1">{field.label}</label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={settings.dailyBudget[field.key]}
                  onChange={(e) =>
                    setDailyBudget({ [field.key]: Number(e.target.value) })
                  }
                  className={`${INPUT_CLASS} pl-5`}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Section 5: Fuel Settings */}
      <Section title="Fuel Settings">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Fuel type</label>
            <select
              value={settings.fuelConsumption.fuelType}
              onChange={(e) => setFuelType(e.target.value as FuelType)}
              className={SELECT_CLASS}
            >
              {FUEL_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Unit</label>
            <select
              value={settings.fuelConsumption.unit}
              onChange={(e) =>
                setFuelConsumptionUnit(e.target.value as ConsumptionUnit)
              }
              className={SELECT_CLASS}
            >
              {CONSUMPTION_UNIT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Consumption</label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={settings.fuelConsumption.value}
              onChange={(e) => setFuelConsumption(Number(e.target.value))}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">
              Price per litre ({currencySymbol})
            </label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                {currencySymbol}
              </span>
              <input
                type="number"
                min={0}
                step={0.05}
                value={settings.fuelPricePerLitre}
                onChange={(e) => setFuelPrice(Number(e.target.value))}
                className={`${INPUT_CLASS} pl-5`}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs text-neutral-500 mb-1">Tank capacity (litres)</label>
          <input
            type="number"
            min={0}
            step={5}
            value={settings.fuelConsumption.tankCapacity}
            onChange={(e) => setTankCapacity(Number(e.target.value))}
            className={INPUT_CLASS}
          />
        </div>
      </Section>

      {/* Vehicle link */}
      <div className="pt-3 border-t border-neutral-200">
        <div className="flex items-center justify-between text-xs">
          <div className="text-neutral-500">
            Vehicle:{' '}
            <span className="text-neutral-700 font-medium">
              {vehicleProfile?.name ?? 'Not set'}
            </span>
          </div>
          <button
            type="button"
            onClick={openVehicleSidebar}
            className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 font-medium transition-colors"
          >
            Edit
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TripSettingsPanel;
