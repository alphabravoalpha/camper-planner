// Onboarding Flow Component
// Comprehensive onboarding that actually sets up the user for trip planning

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '../../utils/cn';
import { aria, useAnnounce, useFocusTrap } from '../../utils/accessibility';
import { useRouteStore, useVehicleStore } from '../../store';
import { useCostStore } from '../../store/costStore';
import { type VehicleProfile } from '../../types';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  canSkip?: boolean;
  canGoBack?: boolean;
  validation?: () => boolean;
  onComplete?: () => void;
  isBottomPanel?: boolean; // For interactive step
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to European Camper Trip Planner
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Plan safe routes that respect your vehicle's size.
          Find campsites, calculate costs, and export to GPS.
        </p>
      </div>
      <div className="text-sm text-gray-500">
        Let's set up your vehicle and get you started with your first route.
      </div>
    </div>
  );
};

// =============================================================================
// Step 2: Vehicle Setup - Collect actual dimensions
// =============================================================================
interface VehicleSetupStepProps {
  onVehicleSet: (profile: VehicleProfile) => void;
  vehicleData: {
    type: string;
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
  const presets: Record<string, { height: number; width: number; length: number; weight: number; fuelType: string }> = {
    motorhome: { height: 3.2, width: 2.3, length: 7, weight: 3.5, fuelType: 'diesel' },
    camper_van: { height: 2.5, width: 2.0, length: 5.5, weight: 2.8, fuelType: 'diesel' },
    caravan: { height: 2.8, width: 2.2, length: 6, weight: 1.5, fuelType: 'petrol' },
    car_tent: { height: 1.6, width: 1.8, length: 4.5, weight: 1.2, fuelType: 'petrol' },
  };

  const vehicleTypes = [
    { id: 'motorhome', name: 'Motorhome', icon: '🚐', description: 'Large self-contained RV' },
    { id: 'camper_van', name: 'Camper Van', icon: '🚌', description: 'Converted van' },
    { id: 'caravan', name: 'Caravan', icon: '🏠', description: 'Towed trailer' },
    { id: 'car_tent', name: 'Car + Tent', icon: '🏕️', description: 'Car camping' },
  ];

  const handleTypeChange = (type: string) => {
    const preset = presets[type];
    setVehicleData({
      type,
      height: preset.height,
      width: preset.width,
      length: preset.length,
      weight: preset.weight,
    });
  };

  const handleDimensionChange = (field: keyof typeof vehicleData, value: string) => {
    const numValue = parseFloat(value) || 0;
    setVehicleData({ ...vehicleData, [field]: numValue });
  };

  // Update vehicle store whenever data changes
  useEffect(() => {
    if (vehicleData.height > 0 && vehicleData.width > 0 && vehicleData.length > 0 && vehicleData.weight > 0) {
      onVehicleSet({
        id: 'onboarding-vehicle',
        name: `My ${vehicleData.type}`,
        type: vehicleData.type,
        height: vehicleData.height,
        width: vehicleData.width,
        length: vehicleData.length,
        weight: vehicleData.weight,
        fuelType: presets[vehicleData.type]?.fuelType || 'diesel',
        createdAt: new Date().toISOString(),
      });
    }
  }, [vehicleData, onVehicleSet]);

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Tell Us About Your Vehicle</h2>
        <p className="text-gray-600 text-sm">
          Your vehicle dimensions ensure routes avoid roads that won't fit.
        </p>
      </div>

      {/* Vehicle Type Selection */}
      <div className="grid grid-cols-2 gap-2">
        {vehicleTypes.map((vehicle) => (
          <button
            key={vehicle.id}
            onClick={() => handleTypeChange(vehicle.id)}
            className={cn(
              'p-3 border-2 rounded-lg text-left transition-colors',
              vehicleData.type === vehicle.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            )}
            {...aria.button()}
          >
            <div className="flex items-center space-x-2">
              <span className="text-xl">{vehicle.icon}</span>
              <div>
                <h3 className="font-medium text-gray-900 text-sm">{vehicle.name}</h3>
                <p className="text-xs text-gray-500">{vehicle.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Dimension Inputs */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="font-medium text-gray-900 mb-3 text-sm">Vehicle Dimensions</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Height (m)</label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="5"
              value={vehicleData.height}
              onChange={(e) => handleDimensionChange('height', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Width (m)</label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="3.5"
              value={vehicleData.width}
              onChange={(e) => handleDimensionChange('width', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Length (m)</label>
            <input
              type="number"
              step="0.1"
              min="2"
              max="20"
              value={vehicleData.length}
              onChange={(e) => handleDimensionChange('length', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Weight (tonnes)</label>
            <input
              type="number"
              step="0.1"
              min="0.5"
              max="40"
              value={vehicleData.weight}
              onChange={(e) => handleDimensionChange('weight', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          💡 Check your vehicle registration or measure from ground to highest point (including any roof equipment).
        </p>
      </div>
    </div>
  );
};

// =============================================================================
// Step 3: Fuel Setup - Fuel type and consumption
// =============================================================================
interface FuelSetupStepProps {
  vehicleType: string;
  fuelData: {
    fuelType: string;
    consumption: number;
  };
  setFuelData: (data: FuelSetupStepProps['fuelData']) => void;
}

const FuelSetupStep: React.FC<FuelSetupStepProps> = ({
  vehicleType,
  fuelData,
  setFuelData,
}) => {
  const defaultConsumption: Record<string, number> = {
    motorhome: 14,
    camper_van: 10,
    caravan: 12,
    car_tent: 8,
  };

  const fuelTypes = [
    { id: 'diesel', name: 'Diesel', icon: '⛽' },
    { id: 'petrol', name: 'Petrol', icon: '⛽' },
    { id: 'lpg', name: 'LPG', icon: '🔥' },
    { id: 'electricity', name: 'Electric', icon: '⚡' },
  ];

  // Initialize with defaults based on vehicle type
  useEffect(() => {
    if (fuelData.consumption === 0) {
      setFuelData({
        ...fuelData,
        consumption: defaultConsumption[vehicleType] || 12,
      });
    }
  }, [vehicleType]);

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Fuel Settings</h2>
        <p className="text-gray-600 text-sm">
          This helps us calculate your trip costs accurately.
        </p>
      </div>

      {/* Fuel Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Type</label>
        <div className="grid grid-cols-2 gap-2">
          {fuelTypes.map((fuel) => (
            <button
              key={fuel.id}
              onClick={() => setFuelData({ ...fuelData, fuelType: fuel.id })}
              className={cn(
                'p-3 border-2 rounded-lg text-center transition-colors',
                fuelData.fuelType === fuel.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fuel Consumption
        </label>
        <div className="flex items-center space-x-3">
          <input
            type="number"
            step="0.5"
            min="3"
            max="30"
            value={fuelData.consumption}
            onChange={(e) => setFuelData({ ...fuelData, consumption: parseFloat(e.target.value) || 0 })}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-md text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="text-gray-600 text-sm whitespace-nowrap">L/100km</span>
        </div>
      </div>

      {/* Typical Values Reference */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2 text-sm">💡 Typical consumption values:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
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
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-bold text-gray-900">🗺️ Let's Plan Your First Route</h2>
        <p className="text-gray-600 text-sm mt-1">
          Right-click on the map above to add locations
        </p>
      </div>

      {/* Progress Checklist */}
      <div className="flex justify-center gap-6">
        <div className={cn(
          'flex items-center gap-2 text-sm',
          waypoints.length >= 1 ? 'text-green-600' : 'text-gray-400'
        )}>
          <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold">
            {waypoints.length >= 1 ? '✓' : '1'}
          </span>
          <span>Add start point</span>
        </div>
        <div className={cn(
          'flex items-center gap-2 text-sm',
          waypoints.length >= 2 ? 'text-green-600' : 'text-gray-400'
        )}>
          <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold">
            {waypoints.length >= 2 ? '✓' : '2'}
          </span>
          <span>Add destination</span>
        </div>
      </div>

      {waypoints.length === 0 && (
        <p className="text-center text-sm text-gray-500">
          💡 Right-click anywhere on the map to add your first waypoint
        </p>
      )}
      {waypoints.length === 1 && (
        <p className="text-center text-sm text-gray-500">
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
    type: string;
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

  const vehicleTypeNames: Record<string, string> = {
    motorhome: 'Motorhome',
    camper_van: 'Camper Van',
    caravan: 'Caravan',
    car_tent: 'Car + Tent',
  };

  const fuelTypeNames: Record<string, string> = {
    diesel: 'Diesel',
    petrol: 'Petrol',
    lpg: 'LPG',
    electricity: 'Electric',
  };

  // Calculate estimated fuel cost
  const distanceKm = calculatedRoute?.distance ? calculatedRoute.distance / 1000 : 0;
  const fuelNeeded = (distanceKm / 100) * fuelData.consumption;
  const fuelPrice = fuelData.fuelType === 'diesel' ? 1.65 : 1.75; // Approximate EU prices
  const estimatedCost = fuelNeeded * fuelPrice;

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="text-4xl mb-2">✅</div>
        <h2 className="text-xl font-bold text-gray-900">You're All Set!</h2>
        <p className="text-gray-600 text-sm">Here's a summary of your setup</p>
      </div>

      {/* Settings Summary */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-sm text-gray-600">Vehicle</span>
          <span className="text-sm font-medium">
            {vehicleTypeNames[vehicleData.type]} ({vehicleData.height}m × {vehicleData.width}m × {vehicleData.length}m)
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-sm text-gray-600">Weight</span>
          <span className="text-sm font-medium">{vehicleData.weight} tonnes</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-sm text-gray-600">Fuel</span>
          <span className="text-sm font-medium">
            {fuelTypeNames[fuelData.fuelType]} @ {fuelData.consumption} L/100km
          </span>
        </div>
        {waypoints.length >= 2 && (
          <>
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-sm text-gray-600">Route</span>
              <span className="text-sm font-medium">
                {waypoints.length} waypoints
                {distanceKm > 0 && ` • ${Math.round(distanceKm)} km`}
              </span>
            </div>
            {estimatedCost > 0 && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Est. Fuel Cost</span>
                <span className="text-sm font-medium text-green-600">
                  €{estimatedCost.toFixed(0)}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Reference */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2 text-sm">Quick Reference</h4>
        <ul className="text-sm text-blue-800 space-y-1">
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
        <span className="text-sm font-medium text-gray-700">
          Step {currentStep + 1} of {totalSteps}
        </span>
        <span className="text-sm text-gray-500">
          {Math.round(((currentStep + 1) / totalSteps) * 100)}% complete
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        />
      </div>

      <div className="flex justify-between mt-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              'flex items-center space-x-1 text-xs',
              index <= currentStep ? 'text-blue-600' : 'text-gray-400'
            )}
          >
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                index < currentStep
                  ? 'bg-blue-600'
                  : index === currentStep
                  ? 'bg-blue-600 animate-pulse'
                  : 'bg-gray-300'
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
    type: 'camper_van',
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
          vehicleType={vehicleData.type}
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
      isBottomPanel: true, // This step uses bottom panel layout
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
  const isInteractiveStep = currentStepData.isBottomPanel;

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

  // For interactive step, render as bottom panel
  if (isInteractiveStep) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl rounded-t-2xl z-50 border-t border-gray-200">
        <div className="max-w-2xl mx-auto p-4">
          {/* Drag handle indicator */}
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-3" />

          {/* Progress */}
          <ProgressIndicator
            currentStep={currentStep}
            totalSteps={steps.length}
            steps={steps}
          />

          {/* Content */}
          {currentStepData.content}

          {/* Actions */}
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
            <div className="flex space-x-3">
              {currentStepData.canGoBack && currentStep > 0 && (
                <button
                  onClick={handleBack}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                >
                  Back
                </button>
              )}
              {currentStepData.canSkip && (
                <button
                  onClick={handleNext}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Skip this step
                </button>
              )}
            </div>

            <button
              onClick={handleNext}
              disabled={currentStepData.validation && !currentStepData.validation()}
              className={cn(
                'px-6 py-2 rounded-md font-medium transition-colors text-sm',
                currentStepData.validation && !currentStepData.validation()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              )}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Standard modal layout for other steps
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        ref={containerRef}
        className={cn(
          'bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col',
          className
        )}
        {...aria.dialog('onboarding-dialog', 'onboarding-description')}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h1
                id="onboarding-dialog"
                className="text-lg font-semibold text-gray-900"
              >
                Getting Started
              </h1>
              <p
                id="onboarding-description"
                className="text-sm text-gray-600"
              >
                Let's set up your trip planner
              </p>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 transition-colors"
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
        <div className="p-5 border-t border-gray-200 flex justify-between items-center">
          <div>
            {currentStepData.canSkip && currentStep < steps.length - 1 && (
              <button
                onClick={handleSkip}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Skip setup
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            {currentStepData.canGoBack && currentStep > 0 && (
              <button
                onClick={handleBack}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
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
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
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
