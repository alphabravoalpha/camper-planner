// Vehicle Profile Panel Component
// Phase 3.1: Vehicle configuration with dimensions, validation, and presets
// Enhanced with make/model/variant database for European vehicles

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useVehicleStore, useUIStore } from '../../store';
import { type VehicleProfile } from '../../types';
import { FeatureFlags } from '../../config';
import { cn } from '../../utils/cn';
import Tooltip from '../ui/Tooltip';
import {
  VEHICLE_DATABASE,
  MOTORHOME_PRESETS,
  getModelsForMake,
  getVariantsForModel,
  type VehicleMake,
  type VehicleModel,
  type VehicleVariant,
} from '../../data/vehicleDatabase';

// Selection mode types
type SelectionMode = 'vehicle' | 'motorhome' | 'custom';

// Unit conversion types and ratios
type UnitSystem = 'metric' | 'imperial';

// Only numeric fields that need unit conversion
type VehicleDimensionKeys = 'height' | 'width' | 'weight' | 'length';

interface UnitConversion {
  metric: { label: string; factor: number };
  imperial: { label: string; factor: number };
}

const UNIT_CONVERSIONS: Record<VehicleDimensionKeys, UnitConversion> = {
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
const VALIDATION_RANGES: Record<VehicleDimensionKeys, { min: number; max: number; step: number }> = {
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

  // Selection mode state
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('vehicle');

  // Vehicle database selection state
  const [selectedMakeId, setSelectedMakeId] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');

  // Motorhome preset selection
  const [selectedMotorhomeId, setSelectedMotorhomeId] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState<VehicleProfile>(
    profile || { height: 2.0, width: 1.9, weight: 3.0, length: 5.0 }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(() => {
    const saved = localStorage.getItem('camper-planner-unit-system');
    return (saved as UnitSystem) || 'metric';
  });
  const [isSaving, setIsSaving] = useState(false);

  // Computed values for dropdowns
  const availableModels = useMemo(() => {
    return selectedMakeId ? getModelsForMake(selectedMakeId) : [];
  }, [selectedMakeId]);

  const availableVariants = useMemo(() => {
    return selectedMakeId && selectedModelId
      ? getVariantsForModel(selectedMakeId, selectedModelId)
      : [];
  }, [selectedMakeId, selectedModelId]);

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
  const validateField = useCallback((field: VehicleDimensionKeys, value: number): string => {
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

    const dimensionKeys: VehicleDimensionKeys[] = ['height', 'width', 'weight', 'length'];
    dimensionKeys.forEach(field => {
      const error = validateField(field, data[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    return newErrors;
  }, [validateField]);

  // Convert value between units
  const convertValue = useCallback((value: number, field: VehicleDimensionKeys, fromUnit: UnitSystem, toUnit: UnitSystem): number => {
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
  const getDisplayValue = useCallback((field: VehicleDimensionKeys): number => {
    return convertValue(formData[field], field, 'metric', unitSystem);
  }, [formData, unitSystem, convertValue]);

  // Handle input change
  const handleInputChange = useCallback((field: VehicleDimensionKeys, displayValue: number) => {
    // Convert from display units to metric for storage
    const metricValue = convertValue(displayValue, field, unitSystem, 'metric');

    setFormData(prev => ({ ...prev, [field]: metricValue }));
    setIsDirty(true);

    // Clear field error if valid
    const error = validateField(field, metricValue);
    setErrors(prev => ({ ...prev, [field]: error }));
  }, [unitSystem, convertValue, validateField]);

  // Handle make selection
  const handleMakeChange = useCallback((makeId: string) => {
    setSelectedMakeId(makeId);
    setSelectedModelId('');
    setSelectedVariantId('');
  }, []);

  // Handle model selection
  const handleModelChange = useCallback((modelId: string) => {
    setSelectedModelId(modelId);
    setSelectedVariantId('');
  }, []);

  // Handle variant selection - auto-populate form
  const handleVariantChange = useCallback((variantId: string) => {
    setSelectedVariantId(variantId);

    const variant = availableVariants.find(v => v.id === variantId);
    if (variant) {
      const newProfile: VehicleProfile = {
        height: variant.height,
        width: variant.width,
        weight: variant.weight,
        length: variant.length
      };
      setFormData(newProfile);
      setIsDirty(true);
      setErrors({});

      // Find make and model names for notification
      const make = VEHICLE_DATABASE.find(m => m.id === selectedMakeId);
      const model = make?.models.find(m => m.id === selectedModelId);

      addNotification({
        type: 'info',
        message: `Applied ${make?.name} ${model?.name} ${variant.name} dimensions`
      });
    }
  }, [availableVariants, selectedMakeId, selectedModelId, addNotification]);

  // Handle motorhome preset selection
  const handleMotorhomeChange = useCallback((motorhomeId: string) => {
    setSelectedMotorhomeId(motorhomeId);

    const preset = MOTORHOME_PRESETS.find(m => m.id === motorhomeId);
    if (preset) {
      const newProfile: VehicleProfile = {
        height: preset.height,
        width: preset.width,
        weight: preset.weight,
        length: preset.length
      };
      setFormData(newProfile);
      setIsDirty(true);
      setErrors({});

      addNotification({
        type: 'info',
        message: `Applied ${preset.name} dimensions`
      });
    }
  }, [addNotification]);

  // Handle form save
  const handleSave = useCallback(async () => {
    const formErrors = validateForm(formData);
    setErrors(formErrors);

    if (Object.keys(formErrors).length === 0) {
      setIsSaving(true);

      try {
        // Add slight delay to show saving state (simulates async operation)
        await new Promise(resolve => setTimeout(resolve, 300));

        setProfile(formData);
        setIsDirty(false);

        addNotification({
          type: 'success',
          message: 'Vehicle profile saved successfully'
        });

        if (onClose) onClose();
      } catch {
        addNotification({
          type: 'error',
          message: 'Failed to save vehicle profile'
        });
      } finally {
        setIsSaving(false);
      }
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
    setSelectedMakeId('');
    setSelectedModelId('');
    setSelectedVariantId('');
    setSelectedMotorhomeId('');
  }, [profile]);

  // Handle clear profile
  const handleClear = useCallback(() => {
    clearProfile();
    setFormData({ height: 2.0, width: 1.9, weight: 3.0, length: 5.0 });
    setErrors({});
    setIsDirty(false);
    setSelectedMakeId('');
    setSelectedModelId('');
    setSelectedVariantId('');
    setSelectedMotorhomeId('');

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
    field: VehicleDimensionKeys;
    label: string;
    icon: string;
    helpText?: string;
  }> = ({ field, label, icon, helpText }) => {
    const displayValue = getDisplayValue(field);
    const hasError = !!errors[field];
    const unit = UNIT_CONVERSIONS[field][unitSystem];

    return (
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <span className="text-base">{icon}</span>
          <label htmlFor={field} className="text-sm font-medium text-gray-700">
            {label}
          </label>
          {helpText && (
            <Tooltip content={helpText} size="sm">
              <svg className="w-3.5 h-3.5 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

  // Feature flag check - must be after all hooks
  if (!FeatureFlags.VEHICLE_PROFILES) {
    return null;
  }

  return (
    <div className={cn(
      'bg-white rounded-lg',
      compact ? '' : 'shadow-lg border border-gray-200 p-6',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            🚐 Vehicle Profile
          </h2>
          <p className="text-xs text-gray-600 mt-0.5">
            Set your vehicle dimensions for safe routing
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Unit System Toggle */}
          <Tooltip content={`Switch to ${unitSystem === 'metric' ? 'imperial' : 'metric'} units`}>
            <button
              onClick={handleUnitToggle}
              className={cn(
                'px-2 py-1 rounded text-xs font-medium transition-colors',
                unitSystem === 'metric'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-orange-100 text-orange-700'
              )}
            >
              {unitSystem === 'metric' ? 'Metric' : 'Imperial'}
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Selection Mode Tabs */}
      <div className="flex space-x-1 mb-4 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setSelectionMode('vehicle')}
          className={cn(
            'flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors',
            selectionMode === 'vehicle'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          🚐 Base Vehicle
        </button>
        <button
          onClick={() => setSelectionMode('motorhome')}
          className={cn(
            'flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors',
            selectionMode === 'motorhome'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          🚌 Motorhome
        </button>
        <button
          onClick={() => setSelectionMode('custom')}
          className={cn(
            'flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors',
            selectionMode === 'custom'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          ✏️ Custom
        </button>
      </div>

      {/* Base Vehicle Selection (Make/Model/Variant) */}
      {selectionMode === 'vehicle' && (
        <div className="space-y-3 mb-4">
          <p className="text-xs text-gray-500">
            Select your base vehicle to auto-fill dimensions
          </p>

          {/* Make Dropdown */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Make
            </label>
            <select
              value={selectedMakeId}
              onChange={(e) => handleMakeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select make...</option>
              {VEHICLE_DATABASE.map((make) => (
                <option key={make.id} value={make.id}>
                  {make.name} ({make.country})
                </option>
              ))}
            </select>
          </div>

          {/* Model Dropdown */}
          {selectedMakeId && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Model
              </label>
              <select
                value={selectedModelId}
                onChange={(e) => handleModelChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select model...</option>
                {availableModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Variant Dropdown */}
          {selectedModelId && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Size / Variant
              </label>
              <select
                value={selectedVariantId}
                onChange={(e) => handleVariantChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select variant...</option>
                {availableVariants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.name} ({variant.length}m × {variant.height}m)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Selected variant info */}
          {selectedVariantId && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-xs text-blue-800">
                <strong>Selected:</strong>{' '}
                {VEHICLE_DATABASE.find(m => m.id === selectedMakeId)?.name}{' '}
                {availableModels.find(m => m.id === selectedModelId)?.name}{' '}
                {availableVariants.find(v => v.id === selectedVariantId)?.name}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Motorhome Presets */}
      {selectionMode === 'motorhome' && (
        <div className="space-y-3 mb-4">
          <p className="text-xs text-gray-500">
            Select a popular motorhome model
          </p>

          <select
            value={selectedMotorhomeId}
            onChange={(e) => handleMotorhomeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select motorhome...</option>
            <optgroup label="Compact Campervans">
              {MOTORHOME_PRESETS.filter(m => m.length < 5.5).map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} ({preset.length}m)
                </option>
              ))}
            </optgroup>
            <optgroup label="Medium Motorhomes">
              {MOTORHOME_PRESETS.filter(m => m.length >= 5.5 && m.length < 7).map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} ({preset.length}m)
                </option>
              ))}
            </optgroup>
            <optgroup label="Large Motorhomes">
              {MOTORHOME_PRESETS.filter(m => m.length >= 7 && m.length < 10).map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} ({preset.length}m)
                </option>
              ))}
            </optgroup>
            <optgroup label="Car + Caravan">
              {MOTORHOME_PRESETS.filter(m => m.length >= 10).map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} ({preset.length}m)
                </option>
              ))}
            </optgroup>
          </select>

          {/* Selected motorhome info */}
          {selectedMotorhomeId && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              {(() => {
                const preset = MOTORHOME_PRESETS.find(m => m.id === selectedMotorhomeId);
                return preset ? (
                  <div className="text-xs text-blue-800">
                    <strong>{preset.name}</strong>
                    <div className="text-blue-600 mt-1">
                      Base: {preset.base} • {preset.make}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>
      )}

      {/* Custom mode info */}
      {selectionMode === 'custom' && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-600">
            Enter your vehicle dimensions manually below. Measure your vehicle including any roof equipment (AC, antenna, solar panels).
          </p>
        </div>
      )}

      {/* Form Fields - Always visible */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <InputField
          field="height"
          label="Height"
          icon="📏"
          helpText="Max height including roof equipment"
        />
        <InputField
          field="width"
          label="Width"
          icon="↔️"
          helpText="Max width including mirrors"
        />
        <InputField
          field="length"
          label="Length"
          icon="📐"
          helpText="Total length front to back"
        />
        <InputField
          field="weight"
          label="Weight"
          icon="⚖️"
          helpText="Gross vehicle weight when loaded"
        />
      </div>

      {/* Current Profile Summary */}
      {profile && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-xs font-medium text-green-800 mb-1">✅ Saved Profile</h3>
          <div className="grid grid-cols-4 gap-2 text-xs text-green-700">
            <div>H: {profile.height}m</div>
            <div>W: {profile.width}m</div>
            <div>L: {profile.length}m</div>
            <div>Wt: {profile.weight}t</div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-2">
        <button
          onClick={handleSave}
          disabled={!isDirty || Object.keys(errors).length > 0 || isSaving}
          className={cn(
            'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center',
            isDirty && Object.keys(errors).length === 0 && !isSaving
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          )}
        >
          {isSaving && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          <span>
            {isSaving ? 'Saving...' : profile ? 'Update' : 'Save'}
          </span>
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
      <div className="mt-4 p-2 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs text-amber-700">
          💡 <strong>Tip:</strong> Routes will avoid roads with height/weight restrictions your vehicle cannot handle.
        </p>
      </div>
    </div>
  );
};

export default VehicleProfilePanel;
