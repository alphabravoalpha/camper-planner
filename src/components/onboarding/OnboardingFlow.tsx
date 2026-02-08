// Onboarding Flow Component
// Comprehensive onboarding that actually sets up the user for trip planning

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '../../utils/cn';
import { aria, useAnnounce, useFocusTrap } from '../../utils/accessibility';
import { useRouteStore, useVehicleStore } from '../../store';
import { useCostStore } from '../../store/costStore';
import { type VehicleProfile } from '../../types';
import {
  VEHICLE_DATABASE,
  MOTORHOME_PRESETS,
  getModelsForMake,
  getVariantsForModel,
  findVariant,
} from '../../data/vehicleDatabase';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  canSkip?: boolean;
  canGoBack?: boolean;
  validation?: () => boolean;
  onComplete?: () => void;
}

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip: () => void;
  className?: string;
}

// =============================================================================
// Step 1: Welcome Step - Simple, focused introduction
// =============================================================================
const WelcomeStep: React.FC = () => {
  return (
    <div className="text-center space-y-6">
      <div className="text-6xl">🏕️</div>
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          Welcome to European Camper Trip Planner
        </h2>
        <p className="text-neutral-600 max-w-md mx-auto">
          Plan safe routes that respect your vehicle's size.
          Find campsites, calculate costs, and export to GPS.
        </p>
      </div>
      <div className="text-sm text-neutral-500">
        Let's set up your vehicle and get you started with your first route.
      </div>
    </div>
  );
};

// =============================================================================
// Step 2: Vehicle Setup - Make/Model/Variant cascading dropdowns
// =============================================================================
interface VehicleSetupStepProps {
  onVehicleSet: (profile: VehicleProfile) => void;
  vehicleData: {
    makeId: string;
    modelId: string;
    variantId: string;
    vehicleName: string;
    height: number;
    width: number;
    length: number;
    weight: number;
  };
  setVehicleData: (data: VehicleSetupStepProps['vehicleData']) => void;
}

const VehicleSetupStep: React.FC<VehicleSetupStepProps> = ({
  onVehicleSet,
  vehicleData,
  setVehicleData,
}) => {
  // Get available models and variants based on selection
  const availableModels = vehicleData.makeId ? getModelsForMake(vehicleData.makeId) : [];
  const availableVariants = vehicleData.makeId && vehicleData.modelId
    ? getVariantsForModel(vehicleData.makeId, vehicleData.modelId)
    : [];

  // Handle make selection
  const handleMakeChange = (makeId: string) => {
    setVehicleData({
      ...vehicleData,
      makeId,
      modelId: '',
      variantId: '',
      vehicleName: '',
    });
  };

  // Handle model selection
  const handleModelChange = (modelId: string) => {
    setVehicleData({
      ...vehicleData,
      modelId,
      variantId: '',
      vehicleName: '',
    });
  };

  // Handle variant selection - auto-populate dimensions
  const handleVariantChange = (variantId: string) => {
    const variant = availableVariants.find(v => v.id === variantId);
    if (variant) {
      const make = VEHICLE_DATABASE.find(m => m.id === vehicleData.makeId);
      const model = make?.models.find(m => m.id === vehicleData.modelId);
      const vehicleName = `${make?.name} ${model?.name} ${variant.name}`;

      setVehicleData({
        ...vehicleData,
        variantId,
        vehicleName,
        height: variant.height,
        width: variant.width,
        length: variant.length,
        weight: variant.weight,
      });
    }
  };

  // Handle dimension changes (for fine-tuning)
  const handleDimensionChange = (field: 'height' | 'width' | 'length' | 'weight', value: string) => {
    const numValue = parseFloat(value) || 0;
    setVehicleData({
      ...vehicleData,
      [field]: numValue,
      vehicleName: vehicleData.vehicleName || 'Custom Vehicle',
    });
  };

  // Update vehicle store whenever data changes
  useEffect(() => {
    if (vehicleData.height > 0 && vehicleData.width > 0 && vehicleData.length > 0 && vehicleData.weight > 0) {
      onVehicleSet({
        id: 'onboarding-vehicle',
        name: vehicleData.vehicleName || 'Custom Vehicle',
        type: 'motorhome',
        height: vehicleData.height,
        width: vehicleData.width,
        length: vehicleData.length,
        weight: vehicleData.weight,
        fuelType: 'diesel',
        createdAt: new Date().toISOString(),
      });
    }
  }, [vehicleData, onVehicleSet]);

  // Get selected names for display
  const selectedMake = VEHICLE_DATABASE.find(m => m.id === vehicleData.makeId);
  const selectedModel = selectedMake?.models.find(m => m.id === vehicleData.modelId);
  const selectedVariant = availableVariants.find(v => v.id === vehicleData.variantId);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-neutral-900 mb-1">Tell Us About Your Vehicle</h2>
        <p className="text-neutral-600 text-sm">
          Select your base vehicle to auto-fill dimensions
        </p>
      </div>

      {/* Make Dropdown */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Make
        </label>
        <select
          value={vehicleData.makeId}
          onChange={(e) => handleMakeChange(e.target.value)}
          className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
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
      {vehicleData.makeId && (
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Model
          </label>
          <select
            value={vehicleData.modelId}
            onChange={(e) => handleModelChange(e.target.value)}
            className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
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
      {vehicleData.modelId && (
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Size / Variant
          </label>
          <select
            value={vehicleData.variantId}
            onChange={(e) => handleVariantChange(e.target.value)}
            className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
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

      {/* Selected vehicle info */}
      {selectedVariant && (
        <div className="p-3 bg-primary-50 border border-primary-200 rounded-xl">
          <div className="text-sm text-primary-800">
            <strong>{selectedMake?.name} {selectedModel?.name} {selectedVariant.name}</strong>
            <div className="text-primary-600 mt-1">
              {selectedVariant.length}m L × {selectedVariant.width}m W × {selectedVariant.height}m H • {selectedVariant.weight}t
            </div>
          </div>
        </div>
      )}

      {/* Dimension Inputs - For fine-tuning or custom entry */}
      <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
        <h3 className="font-medium text-neutral-900 mb-3 text-sm">
          {selectedVariant ? 'Fine-tune Dimensions' : 'Or Enter Dimensions Manually'}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-neutral-600 mb-1">Height (m)</label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="5"
              value={vehicleData.height}
              onChange={(e) => handleDimensionChange('height', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-600 mb-1">Width (m)</label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="3.5"
              value={vehicleData.width}
              onChange={(e) => handleDimensionChange('width', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-600 mb-1">Length (m)</label>
            <input
              type="number"
              step="0.1"
              min="2"
              max="20"
              value={vehicleData.length}
              onChange={(e) => handleDimensionChange('length', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-600 mb-1">Weight (tonnes)</label>
            <input
              type="number"
              step="0.1"
              min="0.5"
              max="40"
              value={vehicleData.weight}
              onChange={(e) => handleDimensionChange('weight', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
        <p className="text-xs text-neutral-500 mt-3">
          💡 Include roof equipment (AC, solar panels, antenna) in height measurement.
        </p>
      </div>
    </div>
  );
};

// =============================================================================
// Step 3: Fuel Setup - Fuel type and consumption
// =============================================================================
interface FuelSetupStepProps {
  vehicleLength: number;
  databaseFuelConsumption?: number;
  fuelData: {
    fuelType: string;
    consumption: number;
  };
  setFuelData: (data: FuelSetupStepProps['fuelData']) => void;
}

const FuelSetupStep: React.FC<FuelSetupStepProps> = ({
  vehicleLength,
  databaseFuelConsumption,
  fuelData,
  setFuelData,
}) => {
  const [userEditedConsumption, setUserEditedConsumption] = useState(false);

  // Estimate default consumption based on vehicle length
  const getDefaultConsumption = (length: number): number => {
    if (length < 5) return 9;      // Compact campervan
    if (length < 6) return 11;     // Medium campervan
    if (length < 7) return 13;     // Large campervan / small motorhome
    if (length < 8) return 15;     // Medium motorhome
    return 17;                     // Large motorhome
  };

  const fuelTypes = [
    { id: 'diesel', name: 'Diesel', icon: '⛽' },
    { id: 'petrol', name: 'Petrol', icon: '⛽' },
    { id: 'lpg', name: 'LPG', icon: '🔥' },
    { id: 'electricity', name: 'Electric', icon: '⚡' },
  ];

  // Initialize with defaults — prefer database value over length-based estimate
  useEffect(() => {
    if (!userEditedConsumption) {
      const bestEstimate = databaseFuelConsumption ?? getDefaultConsumption(vehicleLength);
      if (fuelData.consumption === 0 || fuelData.consumption !== bestEstimate) {
        setFuelData({
          ...fuelData,
          consumption: bestEstimate,
        });
      }
    }
  }, [vehicleLength, databaseFuelConsumption]);

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-neutral-900 mb-1">Fuel Settings</h2>
        <p className="text-neutral-600 text-sm">
          This helps us calculate your trip costs accurately.
        </p>
      </div>

      {/* Fuel Type Selection */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">Fuel Type</label>
        <div className="grid grid-cols-2 gap-2">
          {fuelTypes.map((fuel) => (
            <button
              key={fuel.id}
              onClick={() => setFuelData({ ...fuelData, fuelType: fuel.id })}
              className={cn(
                'p-3 border-2 rounded-xl text-center transition-colors',
                fuelData.fuelType === fuel.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50'
              )}
            >
              <span className="text-lg">{fuel.icon}</span>
              <span className="ml-2 text-sm font-medium">{fuel.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Consumption Input */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Fuel Consumption
        </label>
        <div className="flex items-center space-x-3">
          <input
            type="number"
            step="0.5"
            min="3"
            max="30"
            value={fuelData.consumption}
            onChange={(e) => {
              setUserEditedConsumption(true);
              setFuelData({ ...fuelData, consumption: parseFloat(e.target.value) || 0 });
            }}
            className="flex-1 px-4 py-3 border border-neutral-300 rounded-md text-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <span className="text-neutral-600 text-sm whitespace-nowrap">L/100km</span>
        </div>
        {databaseFuelConsumption && !userEditedConsumption && (
          <p className="text-xs text-primary-600 mt-1.5">
            Auto-filled from vehicle database. Edit above to override.
          </p>
        )}
      </div>

      {/* Typical Values Reference */}
      <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
        <h4 className="font-medium text-primary-900 mb-2 text-sm">💡 Typical consumption values:</h4>
        <ul className="text-sm text-primary-800 space-y-1">
          <li>• Motorhome: 12-18 L/100km</li>
          <li>• Camper Van: 8-12 L/100km</li>
          <li>• Car + Caravan: 10-14 L/100km</li>
          <li>• Car + Tent: 6-10 L/100km</li>
        </ul>
      </div>
    </div>
  );
};

// =============================================================================
// Step 4: Interactive Tutorial - Add waypoints on actual map
// =============================================================================
interface InteractiveTutorialStepProps {
  onWaypointsAdded: () => void;
}

const InteractiveTutorialStep: React.FC<InteractiveTutorialStepProps> = ({
  onWaypointsAdded,
}) => {
  const { waypoints } = useRouteStore();

  useEffect(() => {
    if (waypoints.length >= 2) {
      onWaypointsAdded();
    }
  }, [waypoints.length, onWaypointsAdded]);

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-neutral-900 mb-1">Try Adding Waypoints</h2>
        <p className="text-neutral-600 text-sm">
          Practice adding locations to plan your first route.
        </p>
      </div>

      {/* Visual hint */}
      <div className="bg-neutral-100 rounded-xl p-4 text-center">
        <div className="text-3xl mb-2">🗺️ 🖱️</div>
        <p className="text-sm text-neutral-600">
          Right-click (or long-press on mobile) on the map behind this dialog to add waypoints.
        </p>
      </div>

      {/* Progress Checklist */}
      <div className="flex justify-center gap-6">
        <div className={cn(
          'flex items-center gap-2 text-sm',
          waypoints.length >= 1 ? 'text-green-600' : 'text-neutral-400'
        )}>
          <span className={cn(
            'w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold',
            waypoints.length >= 1 ? 'border-green-500 bg-green-50' : 'border-neutral-300'
          )}>
            {waypoints.length >= 1 ? '✓' : '1'}
          </span>
          <span>Add start point</span>
        </div>
        <div className={cn(
          'flex items-center gap-2 text-sm',
          waypoints.length >= 2 ? 'text-green-600' : 'text-neutral-400'
        )}>
          <span className={cn(
            'w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold',
            waypoints.length >= 2 ? 'border-green-500 bg-green-50' : 'border-neutral-300'
          )}>
            {waypoints.length >= 2 ? '✓' : '2'}
          </span>
          <span>Add destination</span>
        </div>
      </div>

      {waypoints.length === 0 && (
        <p className="text-center text-sm text-neutral-500">
          💡 Right-click anywhere on the map to add your first waypoint
        </p>
      )}
      {waypoints.length === 1 && (
        <p className="text-center text-sm text-neutral-500">
          👍 Great! Now right-click to add your destination
        </p>
      )}
      {waypoints.length >= 2 && (
        <p className="text-center text-sm text-green-600 font-medium">
          ✅ Perfect! Your route is ready. Click Continue to finish setup.
        </p>
      )}
    </div>
  );
};

// =============================================================================
// Step 5: Summary Step - Show what was configured
// =============================================================================
interface SummaryStepProps {
  vehicleData: {
    makeId: string;
    modelId: string;
    variantId: string;
    vehicleName: string;
    height: number;
    width: number;
    length: number;
    weight: number;
  };
  fuelData: {
    fuelType: string;
    consumption: number;
  };
}

const SummaryStep: React.FC<SummaryStepProps> = ({ vehicleData, fuelData }) => {
  const { waypoints, calculatedRoute } = useRouteStore();

  // Get vehicle name
  const getVehicleName = () => {
    return vehicleData.vehicleName || 'Custom Vehicle';
  };

  const fuelTypeNames: Record<string, string> = {
    diesel: 'Diesel',
    petrol: 'Petrol',
    lpg: 'LPG',
    electricity: 'Electric',
  };

  // Calculate estimated fuel cost
  const distanceKm = calculatedRoute?.routes?.[0]?.summary?.distance ? calculatedRoute.routes[0].summary.distance / 1000 : 0;
  const fuelNeeded = (distanceKm / 100) * fuelData.consumption;
  const fuelPrice = fuelData.fuelType === 'diesel' ? 1.65 : 1.75; // Approximate EU prices
  const estimatedCost = fuelNeeded * fuelPrice;

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="text-4xl mb-2">✅</div>
        <h2 className="text-xl font-bold text-neutral-900">You're All Set!</h2>
        <p className="text-neutral-600 text-sm">Here's a summary of your setup</p>
      </div>

      {/* Settings Summary */}
      <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-neutral-200">
          <span className="text-sm text-neutral-600">Vehicle</span>
          <span className="text-sm font-medium">
            {getVehicleName()} ({vehicleData.height}m × {vehicleData.width}m × {vehicleData.length}m)
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-neutral-200">
          <span className="text-sm text-neutral-600">Weight</span>
          <span className="text-sm font-medium">{vehicleData.weight} tonnes</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-neutral-200">
          <span className="text-sm text-neutral-600">Fuel</span>
          <span className="text-sm font-medium">
            {fuelTypeNames[fuelData.fuelType]} @ {fuelData.consumption} L/100km
          </span>
        </div>
        {waypoints.length >= 2 && (
          <>
            <div className="flex justify-between items-center py-2 border-b border-neutral-200">
              <span className="text-sm text-neutral-600">Route</span>
              <span className="text-sm font-medium">
                {waypoints.length} waypoints
                {distanceKm > 0 && ` • ${Math.round(distanceKm)} km`}
              </span>
            </div>
            {estimatedCost > 0 && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-neutral-600">Est. Fuel Cost</span>
                <span className="text-sm font-medium text-green-600">
                  €{estimatedCost.toFixed(0)}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Reference */}
      <div className="bg-primary-50 rounded-xl p-4 border border-primary-200">
        <h4 className="font-medium text-primary-900 mb-2 text-sm">Quick Reference</h4>
        <ul className="text-sm text-primary-800 space-y-1">
          <li>🗺️ <strong>Right-click map</strong> → Add waypoints</li>
          <li>🏕️ <strong>Green button</strong> → Find campsites</li>
          <li>⚡ <strong>Lightning bolt</strong> → Optimize route order</li>
          <li>💾 <strong>Briefcase icon</strong> → Save your trip</li>
        </ul>
      </div>
    </div>
  );
};

// =============================================================================
// Progress Indicator Component
// =============================================================================
const ProgressIndicator: React.FC<{
  currentStep: number;
  totalSteps: number;
  steps: OnboardingStep[];
}> = ({ currentStep, totalSteps, steps }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-neutral-700">
          Step {currentStep + 1} of {totalSteps}
        </span>
        <span className="text-sm text-neutral-500">
          {Math.round(((currentStep + 1) / totalSteps) * 100)}% complete
        </span>
      </div>

      <div className="w-full bg-neutral-200 rounded-full h-2">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        />
      </div>

      <div className="flex justify-between mt-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              'flex items-center space-x-1 text-xs',
              index <= currentStep ? 'text-primary-600' : 'text-neutral-400'
            )}
          >
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                index < currentStep
                  ? 'bg-primary-600'
                  : index === currentStep
                  ? 'bg-primary-600 animate-pulse'
                  : 'bg-neutral-300'
              )}
            />
            <span className="hidden sm:inline">{step.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// Main Onboarding Flow Component
// =============================================================================
const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onComplete,
  onSkip,
  className
}) => {
  const announce = useAnnounce();
  const [currentStep, setCurrentStep] = useState(0);
  const containerRef = useFocusTrap(true);

  // Shared state across steps
  const [vehicleData, setVehicleData] = useState({
    makeId: '',
    modelId: '',
    variantId: '',
    vehicleName: '',
    height: 2.5,
    width: 2.0,
    length: 5.5,
    weight: 2.8,
  });
  const [fuelData, setFuelData] = useState({
    fuelType: 'diesel',
    consumption: 0, // Will be set based on vehicle type
  });
  const [waypointsAdded, setWaypointsAdded] = useState(false);

  // Look up fuel consumption from vehicle database
  const databaseFuelConsumption = useMemo(() => {
    if (vehicleData.makeId && vehicleData.modelId && vehicleData.variantId) {
      const variant = findVariant(vehicleData.makeId, vehicleData.modelId, vehicleData.variantId);
      return variant?.fuelConsumption;
    }
    return undefined;
  }, [vehicleData.makeId, vehicleData.modelId, vehicleData.variantId]);

  // Store hooks
  const { setProfile } = useVehicleStore();
  const { setFuelConsumptionSettings } = useCostStore();
  const { waypoints } = useRouteStore();

  // Update waypoints added state
  useEffect(() => {
    if (waypoints.length >= 2) {
      setWaypointsAdded(true);
    }
  }, [waypoints.length]);

  // Save fuel settings when fuel data changes
  useEffect(() => {
    if (fuelData.consumption > 0) {
      setFuelConsumptionSettings({
        consumptionType: 'l_per_100km',
        consumption: fuelData.consumption,
        fuelType: fuelData.fuelType as 'diesel' | 'petrol' | 'lpg' | 'electricity',
        tankCapacity: 80,
      });
    }
  }, [fuelData, setFuelConsumptionSettings]);

  const handleVehicleSet = useCallback((profile: VehicleProfile) => {
    setProfile(profile);
  }, [setProfile]);

  const handleWaypointsAdded = useCallback(() => {
    setWaypointsAdded(true);
  }, []);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome',
      description: 'Introduction',
      content: <WelcomeStep />,
      canSkip: true,
      canGoBack: false,
    },
    {
      id: 'vehicle',
      title: 'Vehicle',
      description: 'Set up your vehicle',
      content: (
        <VehicleSetupStep
          onVehicleSet={handleVehicleSet}
          vehicleData={vehicleData}
          setVehicleData={setVehicleData}
        />
      ),
      canSkip: false, // Vehicle setup is important
      canGoBack: true,
      validation: () => vehicleData.height > 0 && vehicleData.width > 0 && vehicleData.length > 0 && vehicleData.weight > 0,
    },
    {
      id: 'fuel',
      title: 'Fuel',
      description: 'Fuel settings',
      content: (
        <FuelSetupStep
          vehicleLength={vehicleData.length}
          databaseFuelConsumption={databaseFuelConsumption}
          fuelData={fuelData}
          setFuelData={setFuelData}
        />
      ),
      canSkip: true,
      canGoBack: true,
      validation: () => fuelData.consumption > 0,
    },
    {
      id: 'tutorial',
      title: 'Try It',
      description: 'Add waypoints',
      content: <InteractiveTutorialStep onWaypointsAdded={handleWaypointsAdded} />,
      canSkip: true,
      canGoBack: true,
      validation: () => waypointsAdded || waypoints.length >= 2,
    },
    {
      id: 'summary',
      title: 'Done',
      description: 'Summary',
      content: <SummaryStep vehicleData={vehicleData} fuelData={fuelData} />,
      canSkip: false,
      canGoBack: true,
    },
  ];

  const currentStepData = steps[currentStep];

  const handleNext = useCallback(() => {
    if (currentStepData.validation && !currentStepData.validation()) {
      return;
    }

    if (currentStepData.onComplete) {
      currentStepData.onComplete();
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      announce(`Step ${currentStep + 2}: ${steps[currentStep + 1].title}`, 'polite');
    } else {
      onComplete();
    }
  }, [currentStep, currentStepData, steps, onComplete, announce]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      announce(`Step ${currentStep}: ${steps[currentStep - 1].title}`, 'polite');
    }
  }, [currentStep, steps, announce]);

  const handleSkip = useCallback(() => {
    onSkip();
  }, [onSkip]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleSkip();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSkip]);

  // Modal layout for all steps
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        ref={containerRef}
        className={cn(
          'bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col',
          className
        )}
        {...aria.dialog('onboarding-dialog', 'onboarding-description')}
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-200">
          <div className="flex justify-between items-center">
            <div>
              <h1
                id="onboarding-dialog"
                className="text-lg font-semibold text-neutral-900"
              >
                Getting Started
              </h1>
              <p
                id="onboarding-description"
                className="text-sm text-neutral-600"
              >
                Let's set up your trip planner
              </p>
            </div>
            <button
              onClick={handleSkip}
              className="text-neutral-400 hover:text-neutral-600 transition-colors"
              {...aria.button()}
              aria-label="Close onboarding"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto">
          <ProgressIndicator
            currentStep={currentStep}
            totalSteps={steps.length}
            steps={steps}
          />

          <div>
            {currentStepData.content}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-neutral-200 flex justify-between items-center">
          <div>
            {currentStepData.canSkip && currentStep < steps.length - 1 && (
              <button
                onClick={handleSkip}
                className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
              >
                Skip setup
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            {currentStepData.canGoBack && currentStep > 0 && (
              <button
                onClick={handleBack}
                className="px-4 py-2 border border-neutral-300 rounded-md text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Back
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={currentStepData.validation && !currentStepData.validation()}
              className={cn(
                'px-6 py-2 rounded-md font-medium transition-colors',
                currentStepData.validation && !currentStepData.validation()
                  ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.97]'
              )}
            >
              {currentStep === steps.length - 1 ? 'Start Planning' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
