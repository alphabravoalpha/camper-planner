// Vehicle Profile Panel Component
// Phase 3.1: Vehicle configuration with dimensions, validation, and presets

import React, { useState, useCallback, useEffect } from 'react';
import { useVehicleStore, useUIStore } from '../../store';
import type { VehicleProfile } from '../../types';
import { FeatureFlags } from '../../config';
import { cn } from '../../utils/cn';
import Tooltip from '../ui/Tooltip';

// Vehicle profile presets for common camper types
const VEHICLE_PRESETS: Array<VehicleProfile & { id: string; name: string; description: string; icon: string }> = [
  {
    id: 'compact-camper',
    name: 'Compact Campervan',
    description: 'Small van conversion (VW California, Ford Nugget)',
    icon: '🚐',
    type: 'campervan',
    height: 2.0,
    width: 1.9,
    weight: 3.0,
    length: 5.0
  },
  {
    id: 'medium-motorhome',
    name: 'Medium Motorhome',
    description: 'Standard class C motorhome (6-7m)',
    icon: '🚌',
    type: 'motorhome',
    height: 3.0,
    width: 2.3,
    weight: 3.5,
    length: 6.5
  },
  {
    id: 'large-motorhome',
    name: 'Large Motorhome',
    description: 'Class A motorhome (7-9m)',
    icon: '🚎',
    type: 'motorhome',
    height: 3.4,
    width: 2.5,
    weight: 7.5,
    length: 8.5
  },
  {
    id: 'car-caravan',
    name: 'Car + Caravan',
    description: 'Car with towed caravan',
    icon: '🚗🏠',
    type: 'caravan',
    height: 2.6,
    width: 2.3,
    weight: 3.5,
    length: 12.0
  },
  {
    id: 'truck-camper',
    name: 'Truck Camper',
    description: 'Pickup truck with camper shell',
    icon: '🛻',
    type: 'campervan',
    height: 3.2,
    width: 2.1,
    weight: 4.0,
    length: 7.0
  }
];

// Unit conversion types and ratios
type UnitSystem = 'metric' | 'imperial';

interface UnitConversion {
  metric: { label: string; factor: number };
  imperial: { label: string; factor: number };
}

const UNIT_CONVERSIONS: Record<keyof VehicleProfile, UnitConversion> = {
  height: {
    metric: { label: 'm', factor: 1 },
    imperial: { label: 'ft', factor: 3.28084 }
  },
  width: {
    metric: { label: 'm', factor: 1 },
    imperial: { label: 'ft', factor: 3.28084 }
  },
  length: {
    metric: { label: 'm', factor: 1 },
    imperial: { label: 'ft', factor: 3.28084 }
  },
  weight: {
    metric: { label: 't', factor: 1 },
    imperial: { label: 'lbs', factor: 2204.62 }
  }
};

// Validation ranges (in metric units)
const VALIDATION_RANGES: Record<keyof VehicleProfile, { min: number; max: number; step: number }> = {
  height: { min: 1.5, max: 4.5, step: 0.1 },
  width: { min: 1.5, max: 3.0, step: 0.1 },
  weight: { min: 1.0, max: 40.0, step: 0.1 },
  length: { min: 3.0, max: 20.0, step: 0.1 }
};

interface VehicleProfilePanelProps {
  className?: string;
  onClose?: () => void;
  compact?: boolean;
}

const VehicleProfilePanel: React.FC<VehicleProfilePanelProps> = ({
  className,
  onClose,
  compact = false
}) => {
  const { profile, setProfile, clearProfile } = useVehicleStore();
  const { addNotification } = useUIStore();

  // Form state
  const [formData, setFormData] = useState<VehicleProfile>(
    profile || { type: 'campervan', height: 2.0, width: 1.9, weight: 3.0, length: 5.0 }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(() => {
    const saved = localStorage.getItem('camper-planner-unit-system');
    return (saved as UnitSystem) || 'metric';
  });

  // Feature flag check
  if (!FeatureFlags.VEHICLE_PROFILES) {
    return null;
  }

  // Update form when profile changes
  useEffect(() => {
    if (profile) {
      setFormData(profile);
      setIsDirty(false);
    }
  }, [profile]);

  // Save unit preference
  useEffect(() => {
    localStorage.setItem('camper-planner-unit-system', unitSystem);
  }, [unitSystem]);

  // Validation function
  const validateField = useCallback((field: keyof VehicleProfile, value: number): string => {
    const range = VALIDATION_RANGES[field];

    if (isNaN(value) || value <= 0) {
      return `${field} must be a positive number`;
    }

    if (value < range.min) {
      return `${field} must be at least ${range.min}${UNIT_CONVERSIONS[field].metric.label}`;
    }

    if (value > range.max) {
      return `${field} cannot exceed ${range.max}${UNIT_CONVERSIONS[field].metric.label}`;
    }

    return '';
  }, []);

  // Validate all fields
  const validateForm = useCallback((data: VehicleProfile): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    Object.keys(data).forEach(key => {
      const field = key as keyof VehicleProfile;
      const error = validateField(field, data[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    return newErrors;
  }, [validateField]);

  // Convert value between units
  const convertValue = useCallback((value: number, field: keyof VehicleProfile, fromUnit: UnitSystem, toUnit: UnitSystem): number => {
    if (fromUnit === toUnit) return value;

    const conversion = UNIT_CONVERSIONS[field];

    if (fromUnit === 'metric' && toUnit === 'imperial') {
      return value * conversion.imperial.factor;
    } else if (fromUnit === 'imperial' && toUnit === 'metric') {
      return value / conversion.imperial.factor;
    }

    return value;
  }, []);

  // Get display value with unit conversion
  const getDisplayValue = useCallback((field: keyof VehicleProfile): number => {
    return convertValue(formData[field], field, 'metric', unitSystem);
  }, [formData, unitSystem, convertValue]);

  // Handle input change
  const handleInputChange = useCallback((field: keyof VehicleProfile, displayValue: number) => {
    // Convert from display units to metric for storage
    const metricValue = convertValue(displayValue, field, unitSystem, 'metric');

    setFormData(prev => ({ ...prev, [field]: metricValue }));
    setIsDirty(true);

    // Clear field error if valid
    const error = validateField(field, metricValue);
    setErrors(prev => ({ ...prev, [field]: error }));
  }, [unitSystem, convertValue, validateField]);

  // Handle preset selection
  const handlePresetSelect = useCallback((preset: typeof VEHICLE_PRESETS[0]) => {
    const newProfile: VehicleProfile = {
      height: preset.height,
      width: preset.width,
      weight: preset.weight,
      length: preset.length
    };

    setFormData(newProfile);
    setIsDirty(true);
    setErrors({});
    setShowPresets(false);

    addNotification({
      type: 'info',
      message: `Applied ${preset.name} preset`
    });
  }, [addNotification]);

  // Handle form save
  const handleSave = useCallback(() => {
    const formErrors = validateForm(formData);
    setErrors(formErrors);

    if (Object.keys(formErrors).length === 0) {
      setProfile(formData);
      setIsDirty(false);

      addNotification({
        type: 'success',
        message: 'Vehicle profile saved successfully'
      });

      if (onClose) onClose();
    } else {
      addNotification({
        type: 'error',
        message: 'Please fix validation errors before saving'
      });
    }
  }, [formData, validateForm, setProfile, addNotification, onClose]);

  // Handle form reset
  const handleReset = useCallback(() => {
    if (profile) {
      setFormData(profile);
    } else {
      setFormData({ height: 2.0, width: 1.9, weight: 3.0, length: 5.0 });
    }
    setErrors({});
    setIsDirty(false);
  }, [profile]);

  // Handle clear profile
  const handleClear = useCallback(() => {
    clearProfile();
    setFormData({ height: 2.0, width: 1.9, weight: 3.0, length: 5.0 });
    setErrors({});
    setIsDirty(false);

    addNotification({
      type: 'info',
      message: 'Vehicle profile cleared'
    });
  }, [clearProfile, addNotification]);

  // Handle unit system toggle
  const handleUnitToggle = useCallback(() => {
    setUnitSystem(prev => prev === 'metric' ? 'imperial' : 'metric');
  }, []);

  // Input field component
  const InputField: React.FC<{
    field: keyof VehicleProfile;
    label: string;
    icon: string;
    helpText?: string;
  }> = ({ field, label, icon, helpText }) => {
    const displayValue = getDisplayValue(field);
    const hasError = !!errors[field];
    const unit = UNIT_CONVERSIONS[field][unitSystem];

    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{icon}</span>
          <label htmlFor={field} className="text-sm font-medium text-gray-700">
            {label}
          </label>
          {helpText && (
            <Tooltip content={helpText} size="sm">
              <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Tooltip>
          )}
        </div>

        <div className="relative">
          <input
            id={field}
            type="number"
            value={displayValue.toFixed(1)}
            onChange={(e) => handleInputChange(field, parseFloat(e.target.value) || 0)}
            step={VALIDATION_RANGES[field].step}
            min={convertValue(VALIDATION_RANGES[field].min, field, 'metric', unitSystem)}
            max={convertValue(VALIDATION_RANGES[field].max, field, 'metric', unitSystem)}
            className={cn(
              'w-full px-3 py-2 pr-12 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors',
              hasError
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            )}
            placeholder={`Enter ${label.toLowerCase()}`}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 text-sm">{unit.label}</span>
          </div>
        </div>

        {hasError && (
          <p className="text-red-600 text-xs">{errors[field]}</p>
        )}
      </div>
    );
  };

  return (
    <div className={cn(
      'bg-white rounded-lg shadow-lg border border-gray-200',
      compact ? 'p-4' : 'p-6',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            🚐 Vehicle Profile
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure your vehicle dimensions for safe routing
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Unit System Toggle */}
          <Tooltip content={`Switch to ${unitSystem === 'metric' ? 'imperial' : 'metric'} units`}>
            <button
              onClick={handleUnitToggle}
              className={cn(
                'px-3 py-1 rounded text-xs font-medium transition-colors',
                unitSystem === 'metric'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-orange-100 text-orange-700'
              )}
            >
              {unitSystem === 'metric' ? 'Metric' : 'Imperial'}
            </button>
          </Tooltip>

          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Vehicle Presets */}
      <div className="mb-6">
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Quick Setup Presets</span>
            <span className="text-blue-600 text-xs">Choose a common vehicle type</span>
          </div>
          <svg
            className={cn(
              'w-4 h-4 text-gray-400 transition-transform',
              showPresets && 'rotate-180'
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showPresets && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {VEHICLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">{preset.icon}</span>
                  <span className="font-medium text-sm text-gray-900">{preset.name}</span>
                </div>
                <p className="text-xs text-gray-600 mb-2">{preset.description}</p>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>H: {preset.height}m W: {preset.width}m</div>
                  <div>L: {preset.length}m W: {preset.weight}t</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <InputField
          field="height"
          label="Height"
          icon="📏"
          helpText="Maximum height including roof equipment (antennas, AC units, etc.)"
        />
        <InputField
          field="width"
          label="Width"
          icon="↔️"
          helpText="Maximum width including mirrors and side equipment"
        />
        <InputField
          field="length"
          label="Length"
          icon="📐"
          helpText="Total length from front to back (including trailer if applicable)"
        />
        <InputField
          field="weight"
          label="Weight"
          icon="⚖️"
          helpText="Gross vehicle weight when fully loaded"
        />
      </div>

      {/* Current Profile Summary */}
      {profile && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-sm font-medium text-green-800 mb-2">✅ Current Profile</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-green-700">
            <div>Height: {profile.height}m</div>
            <div>Width: {profile.width}m</div>
            <div>Length: {profile.length}m</div>
            <div>Weight: {profile.weight}t</div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
        <button
          onClick={handleSave}
          disabled={!isDirty || Object.keys(errors).length > 0}
          className={cn(
            'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            isDirty && Object.keys(errors).length === 0
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          )}
        >
          {profile ? 'Update Profile' : 'Save Profile'}
        </button>

        <button
          onClick={handleReset}
          disabled={!isDirty}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
            isDirty
              ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
              : 'border-gray-200 text-gray-400 cursor-not-allowed'
          )}
        >
          Reset
        </button>

        {profile && (
          <button
            onClick={handleClear}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-red-300 text-red-700 hover:bg-red-50 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700">
          💡 <strong>Tip:</strong> Accurate vehicle dimensions ensure routes avoid bridges, tunnels, and roads with restrictions your vehicle cannot handle.
        </p>
      </div>
    </div>
  );
};

export default VehicleProfilePanel;