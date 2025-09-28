// Onboarding Flow Component
// Phase 6.3: Comprehensive onboarding for new users

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '../../utils/cn';
import { aria, useAnnounce, useFocusTrap } from '../../utils/accessibility';
import { useUIStore, useRouteStore, useVehicleStore } from '../../store';

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

// Welcome Step Component
const WelcomeStep: React.FC = () => (
  <div className="text-center space-y-6">
    <div className="text-6xl mb-4">🏕️</div>
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Welcome to European Camper Trip Planner
      </h2>
      <p className="text-lg text-gray-600">
        Plan your perfect European camper van adventure with our comprehensive route planning tools
      </p>
    </div>

    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h3 className="font-semibold text-blue-900 mb-3">What you can do:</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
        <div className="flex items-start space-x-2">
          <span className="text-lg">🗺️</span>
          <span>Plan routes with multiple waypoints</span>
        </div>
        <div className="flex items-start space-x-2">
          <span className="text-lg">🚐</span>
          <span>Set vehicle profiles for restrictions</span>
        </div>
        <div className="flex items-start space-x-2">
          <span className="text-lg">🏕️</span>
          <span>Find campsites and points of interest</span>
        </div>
        <div className="flex items-start space-x-2">
          <span className="text-lg">💰</span>
          <span>Calculate trip costs and expenses</span>
        </div>
        <div className="flex items-start space-x-2">
          <span className="text-lg">📊</span>
          <span>Export routes for GPS devices</span>
        </div>
        <div className="flex items-start space-x-2">
          <span className="text-lg">📱</span>
          <span>Share trips with friends and family</span>
        </div>
      </div>
    </div>
  </div>
);

// Vehicle Setup Step
const VehicleSetupStep: React.FC<{
  onVehicleSet: (hasVehicle: boolean) => void;
}> = ({ onVehicleSet }) => {
  const { setProfile } = useVehicleStore();
  const [vehicleType, setVehicleType] = useState<string>('');
  const [hasVehicle, setHasVehicle] = useState(false);

  const vehicleTypes = [
    { id: 'motorhome', name: 'Motorhome', icon: '🚐', description: 'Self-contained recreational vehicle' },
    { id: 'caravan', name: 'Caravan/Trailer', icon: '🏠', description: 'Towed camping trailer' },
    { id: 'camper_van', name: 'Camper Van', icon: '🚌', description: 'Converted or purpose-built van' },
    { id: 'car_tent', name: 'Car + Tent', icon: '🏕️', description: 'Car with camping equipment' },
  ];

  const handleVehicleSelect = (type: string) => {
    setVehicleType(type);
    setHasVehicle(true);

    // Set basic vehicle profile
    const profiles = {
      motorhome: { type: 'Motorhome', length: 7, width: 2.3, height: 3.2, weight: 3.5, fuelType: 'Diesel' },
      caravan: { type: 'Caravan', length: 6, width: 2.2, height: 2.8, weight: 1.5, fuelType: 'Petrol' },
      camper_van: { type: 'Camper Van', length: 5.5, width: 2, height: 2.5, weight: 2.8, fuelType: 'Diesel' },
      car_tent: { type: 'Car', length: 4.5, width: 1.8, height: 1.6, weight: 1.2, fuelType: 'Petrol' },
    };

    const profile = profiles[type as keyof typeof profiles];
    if (profile) {
      setProfile({
        ...profile,
        id: Date.now().toString(),
        name: `My ${profile.type}`,
        createdAt: new Date().toISOString(),
      });
    }

    onVehicleSet(true);
  };

  const handleSkip = () => {
    setHasVehicle(false);
    onVehicleSet(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Tell us about your vehicle</h2>
        <p className="text-gray-600">
          This helps us provide accurate routes and restrictions for your journey
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vehicleTypes.map((vehicle) => (
          <button
            key={vehicle.id}
            onClick={() => handleVehicleSelect(vehicle.id)}
            className={cn(
              'p-4 border-2 rounded-lg text-left hover:border-blue-300 transition-colors',
              vehicleType === vehicle.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:bg-gray-50'
            )}
            {...aria.button()}
          >
            <div className="flex items-start space-x-3">
              <span className="text-2xl">{vehicle.icon}</span>
              <div>
                <h3 className="font-medium text-gray-900">{vehicle.name}</h3>
                <p className="text-sm text-gray-600">{vehicle.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={handleSkip}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Skip for now - I'll set this up later
        </button>
      </div>
    </div>
  );
};

// Route Planning Demo Step
const RouteDemoStep: React.FC = () => {
  const { addWaypoint } = useRouteStore();
  const [demoStep, setDemoStep] = useState(0);

  const demoWaypoints = [
    { lat: 52.5200, lng: 13.4050, name: 'Berlin, Germany', address: 'Berlin, Germany' },
    { lat: 50.1109, lng: 8.6821, name: 'Frankfurt, Germany', address: 'Frankfurt, Germany' },
    { lat: 48.8566, lng: 2.3522, name: 'Paris, France', address: 'Paris, France' },
  ];

  const addDemoWaypoint = () => {
    if (demoStep < demoWaypoints.length) {
      const waypoint = demoWaypoints[demoStep];
      addWaypoint({
        id: Date.now().toString(),
        ...waypoint,
        type: demoStep === 0 ? 'start' : demoStep === demoWaypoints.length - 1 ? 'end' : 'waypoint'
      });
      setDemoStep(demoStep + 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Let's plan your first route</h2>
        <p className="text-gray-600">
          We'll add a few waypoints to show you how route planning works
        </p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-4">Sample Route: Germany to France</h3>

        <div className="space-y-3">
          {demoWaypoints.map((waypoint, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center space-x-3 p-3 rounded-lg transition-all',
                index < demoStep
                  ? 'bg-green-100 border border-green-200'
                  : index === demoStep
                  ? 'bg-blue-100 border border-blue-200'
                  : 'bg-white border border-gray-200'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                index < demoStep
                  ? 'bg-green-500 text-white'
                  : index === demoStep
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-300 text-gray-600'
              )}>
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{waypoint.name}</div>
                <div className="text-sm text-gray-600">{waypoint.address}</div>
              </div>
              {index < demoStep && (
                <span className="text-green-500">✓</span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          {demoStep < demoWaypoints.length ? (
            <button
              onClick={addDemoWaypoint}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Add {demoWaypoints[demoStep].name}
            </button>
          ) : (
            <div className="text-green-600 font-medium">
              ✅ Demo route created! You now have {demoWaypoints.length} waypoints.
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Quick Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Click on the map to add waypoints</li>
          <li>• Drag waypoints to reorder your route</li>
          <li>• Right-click waypoints for more options</li>
          <li>• Use the route optimizer for efficient planning</li>
        </ul>
      </div>
    </div>
  );
};

// Features Overview Step
const FeaturesOverviewStep: React.FC = () => {
  const features = [
    {
      icon: '🗺️',
      title: 'Interactive Map',
      description: 'Click anywhere to add waypoints and plan your route visually',
      location: 'Main map area'
    },
    {
      icon: '🚐',
      title: 'Vehicle Profiles',
      description: 'Set vehicle dimensions for accurate routing and restrictions',
      location: 'Vehicle settings panel'
    },
    {
      icon: '📊',
      title: 'Route Information',
      description: 'View detailed route statistics, turn-by-turn directions, and elevation',
      location: 'Route information sidebar'
    },
    {
      icon: '💰',
      title: 'Cost Calculator',
      description: 'Calculate fuel costs, tolls, and camping expenses',
      location: 'Cost calculator tool'
    },
    {
      icon: '📤',
      title: 'Export & Share',
      description: 'Export routes to GPS devices or share with friends',
      location: 'Export menu'
    },
    {
      icon: '🏕️',
      title: 'Campsite Finder',
      description: 'Discover campsites and points of interest along your route',
      location: 'Points of interest panel'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Explore all features</h2>
        <p className="text-gray-600">
          Here's what you can do with the European Camper Trip Planner
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start space-x-3">
              <span className="text-2xl flex-shrink-0">{feature.icon}</span>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
                <p className="text-xs text-blue-600 font-medium">{feature.location}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-2">🎯 Ready to start planning?</h4>
        <p className="text-sm text-green-800">
          You're all set! Start by clicking on the map to add your first waypoint,
          or explore the sidebar panels to discover more features.
        </p>
      </div>
    </div>
  );
};

// Progress Indicator Component
const ProgressIndicator: React.FC<{
  currentStep: number;
  totalSteps: number;
  steps: OnboardingStep[];
}> = ({ currentStep, totalSteps, steps }) => {
  return (
    <div className="mb-8">
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

      <div className="flex justify-between mt-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              'flex items-center space-x-2 text-xs',
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

// Main Onboarding Flow Component
const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onComplete,
  onSkip,
  className
}) => {
  const announce = useAnnounce();
  const [currentStep, setCurrentStep] = useState(0);
  const [vehicleConfigured, setVehicleConfigured] = useState(false);
  const containerRef = useFocusTrap(true);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome',
      description: 'Welcome to the planner',
      content: <WelcomeStep />,
      canSkip: true,
      canGoBack: false,
    },
    {
      id: 'vehicle',
      title: 'Vehicle',
      description: 'Set up your vehicle',
      content: <VehicleSetupStep onVehicleSet={setVehicleConfigured} />,
      canSkip: true,
      canGoBack: true,
      validation: () => vehicleConfigured,
    },
    {
      id: 'demo',
      title: 'Demo',
      description: 'Try route planning',
      content: <RouteDemoStep />,
      canSkip: true,
      canGoBack: true,
    },
    {
      id: 'features',
      title: 'Features',
      description: 'Explore features',
      content: <FeaturesOverviewStep />,
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        ref={containerRef}
        className={cn(
          'bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto',
          className
        )}
        {...aria.dialog('onboarding-dialog', 'onboarding-description')}
      >
        <div className="p-6 border-b border-gray-200">
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
                Let's set up your European camper trip planner
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

        <div className="p-6">
          <ProgressIndicator
            currentStep={currentStep}
            totalSteps={steps.length}
            steps={steps}
          />

          <div className="min-h-[400px]">
            {currentStepData.content}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-between items-center">
          <div>
            {currentStepData.canSkip && (
              <button
                onClick={handleSkip}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Skip onboarding
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
              {currentStep === steps.length - 1 ? 'Get Started' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;