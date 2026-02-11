// Onboarding Flow Component
// Passive guided tour that explains features — no forms, no required interactions.
// Users click Next/Next/Next to learn, then land on a clean map.

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '../../utils/cn';
import { aria, useAnnounce, useFocusTrap } from '../../utils/accessibility';
import {
  MapPin,
  Truck,
  Tent,
  Calculator,
  Zap,
  Briefcase,
  CheckCircle,
  ArrowRight,
  X,
  MousePointerClick,
  Filter,
  Download,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

interface TourStep {
  id: string;
  title: string;
  headline: string;
  body: string;
  tip?: string;
  icon: React.ReactNode;
  visual?: React.ReactNode;
}

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip: () => void;
  className?: string;
}

// =============================================================================
// Tour Step Definitions
// =============================================================================

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    headline: 'Plan Your European Camper Trip',
    body: 'A free tool for planning safe camper routes across Europe. Set up your vehicle, find campsites, and export routes to your GPS.',
    icon: (
      <div className="flex items-center gap-2">
        <Truck className="w-10 h-10" />
      </div>
    ),
    visual: (
      <div className="flex justify-center gap-4 text-xs text-neutral-500">
        <span className="px-2 py-1 bg-neutral-100 rounded-full">Free forever</span>
        <span className="px-2 py-1 bg-neutral-100 rounded-full">No account needed</span>
        <span className="px-2 py-1 bg-neutral-100 rounded-full">Privacy-first</span>
      </div>
    ),
  },
  {
    id: 'waypoints',
    title: 'Waypoints',
    headline: 'Add Stops With Right-Click',
    body: 'Right-click the map (or long-press on mobile) to add waypoints. Drag them in the sidebar to reorder your route.',
    tip: 'You can also search for places using the search bar at the top of the map.',
    icon: <MapPin className="w-10 h-10" />,
    visual: (
      <div className="flex items-center justify-center gap-3 text-sm text-neutral-600">
        <div className="flex items-center gap-1.5">
          <MousePointerClick className="w-4 h-4 text-primary-500" />
          <span>Right-click</span>
        </div>
        <ArrowRight className="w-4 h-4 text-neutral-400" />
        <div className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-primary-500" />
          <span>Waypoint added</span>
        </div>
      </div>
    ),
  },
  {
    id: 'vehicle',
    title: 'Vehicle',
    headline: 'Set Your Vehicle Dimensions',
    body: "Tell us your camper's height, width, weight, and length. Routes will avoid roads that don't fit your vehicle.",
    tip: 'Find the vehicle setup button in the top-left header bar after this tour.',
    icon: <Truck className="w-10 h-10" />,
    visual: (
      <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto text-center">
        <div className="p-2 bg-neutral-50 rounded-lg">
          <div className="text-lg font-semibold text-primary-600">H</div>
          <div className="text-xs text-neutral-500">Height</div>
        </div>
        <div className="p-2 bg-neutral-50 rounded-lg">
          <div className="text-lg font-semibold text-primary-600">W</div>
          <div className="text-xs text-neutral-500">Width</div>
        </div>
        <div className="p-2 bg-neutral-50 rounded-lg">
          <div className="text-lg font-semibold text-primary-600">L</div>
          <div className="text-xs text-neutral-500">Length</div>
        </div>
        <div className="p-2 bg-neutral-50 rounded-lg">
          <div className="text-lg font-semibold text-primary-600">T</div>
          <div className="text-xs text-neutral-500">Weight</div>
        </div>
      </div>
    ),
  },
  {
    id: 'campsites',
    title: 'Campsites',
    headline: 'Discover Campsites Along Your Route',
    body: 'Campsites appear on the map as you zoom in. Filter by type, amenities, or vehicle compatibility.',
    tip: 'Click the campsite button in the left toolbar to control filters.',
    icon: <Tent className="w-10 h-10" />,
    visual: (
      <div className="flex justify-center gap-3">
        {[
          { icon: <Filter className="w-4 h-4" />, label: 'Filter' },
          { icon: <Tent className="w-4 h-4" />, label: 'Types' },
          { icon: <Truck className="w-4 h-4" />, label: 'Vehicle fit' },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-50 rounded-full text-xs text-neutral-600"
          >
            <span className="text-primary-500">{item.icon}</span>
            {item.label}
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'booking',
    title: 'Booking',
    headline: 'Book Directly From the Map',
    body: 'Click any campsite marker to see details, amenities, and opening hours. Book through Booking.com, Pitchup, or ACSI.',
    tip: 'You can also add a campsite as a waypoint in your route.',
    icon: <MapPin className="w-10 h-10" />,
    visual: (
      <div className="flex justify-center gap-2">
        {['Booking.com', 'Pitchup', 'ACSI'].map((name) => (
          <span
            key={name}
            className="px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-full text-xs font-medium text-primary-700"
          >
            {name}
          </span>
        ))}
      </div>
    ),
  },
  {
    id: 'tools',
    title: 'Tools',
    headline: 'Calculate Costs & Optimise Routes',
    body: 'Estimate fuel costs, optimise waypoint order, and save multiple trips. Export as GPX, JSON, or KML.',
    tip: 'These tools appear in the left toolbar once you have waypoints.',
    icon: <Calculator className="w-10 h-10" />,
    visual: (
      <div className="flex justify-center gap-4">
        {[
          { icon: <Calculator className="w-5 h-5" />, label: 'Costs' },
          { icon: <Zap className="w-5 h-5" />, label: 'Optimise' },
          { icon: <Briefcase className="w-5 h-5" />, label: 'Save trip' },
          { icon: <Download className="w-5 h-5" />, label: 'Export' },
        ].map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-1 text-xs text-neutral-600">
            <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center text-primary-500">
              {item.icon}
            </div>
            {item.label}
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'ready',
    title: 'Ready',
    headline: "You're Ready to Explore",
    body: 'Start by right-clicking the map to add your first stop, or set up your vehicle in the header.',
    icon: <CheckCircle className="w-10 h-10" />,
    visual: (
      <div className="space-y-2 max-w-xs mx-auto">
        <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl text-sm">
          <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
            <Truck className="w-4 h-4" />
          </div>
          <span className="text-neutral-700">Set up your vehicle in the header</span>
        </div>
        <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl text-sm">
          <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
            <MapPin className="w-4 h-4" />
          </div>
          <span className="text-neutral-700">Right-click the map to add a stop</span>
        </div>
        <p className="text-xs text-neutral-400 text-center mt-3">
          You can replay this tour from the Help page.
        </p>
      </div>
    ),
  },
];

// =============================================================================
// Tour Step Content Renderer
// =============================================================================

const TourStepContent: React.FC<{ step: TourStep }> = ({ step }) => {
  return (
    <div className="text-center space-y-4">
      {/* Icon */}
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600">
          {step.icon}
        </div>
      </div>

      {/* Headline */}
      <h2 className="text-xl font-bold text-neutral-900">{step.headline}</h2>

      {/* Body */}
      <p className="text-neutral-600 text-sm max-w-sm mx-auto leading-relaxed">
        {step.body}
      </p>

      {/* Optional visual */}
      {step.visual && <div className="mt-2">{step.visual}</div>}

      {/* Optional tip */}
      {step.tip && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-3 text-sm text-primary-800 text-left max-w-sm mx-auto">
          <span className="font-medium">Tip: </span>
          {step.tip}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Progress Indicator (dot-style)
// =============================================================================

const ProgressIndicator: React.FC<{ current: number; total: number }> = ({
  current,
  total,
}) => {
  return (
    <div className="flex items-center justify-center space-x-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-2 rounded-full transition-all duration-300',
            i === current
              ? 'w-6 bg-primary-600'
              : i < current
                ? 'w-2 bg-primary-400'
                : 'w-2 bg-neutral-300'
          )}
        />
      ))}
    </div>
  );
};

// =============================================================================
// Main Onboarding Flow Component
// =============================================================================

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onComplete,
  onSkip,
  className,
}) => {
  const announce = useAnnounce();
  const [currentStep, setCurrentStep] = useState(0);
  const containerRef = useFocusTrap(true);

  const totalSteps = TOUR_STEPS.length;
  const isLastStep = currentStep === totalSteps - 1;
  const step = TOUR_STEPS[currentStep];

  const handleNext = useCallback(() => {
    if (isLastStep) {
      onComplete();
    } else {
      const next = currentStep + 1;
      setCurrentStep(next);
      announce(`Step ${next + 1}: ${TOUR_STEPS[next].title}`, 'polite');
    }
  }, [currentStep, isLastStep, onComplete, announce]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      announce(`Step ${prev + 1}: ${TOUR_STEPS[prev].title}`, 'polite');
    }
  }, [currentStep, announce]);

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
                A quick tour of what you can do
              </p>
            </div>
            <button
              onClick={handleSkip}
              className="text-neutral-400 hover:text-neutral-600 transition-colors"
              {...aria.button()}
              aria-label="Close tour"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          <ProgressIndicator current={currentStep} total={totalSteps} />
          <div className="min-h-[280px] flex items-center">
            <div className="w-full">
              <TourStepContent step={step} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-neutral-200 flex justify-between items-center">
          <div>
            <button
              onClick={handleSkip}
              className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              Skip tour
            </button>
          </div>

          <div className="flex space-x-3">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="px-4 py-2 border border-neutral-300 rounded-md text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Back
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-6 py-2 rounded-md font-medium bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.97] transition-all flex items-center gap-2"
            >
              {isLastStep ? 'Start Planning' : 'Next'}
              {!isLastStep && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
