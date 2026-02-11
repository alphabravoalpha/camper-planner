// Onboarding Flow Component
// Spotlight guided tour that highlights real UI elements and performs live demo actions.
// Users click Next/Next/Next — each step triggers real UI changes (waypoints, vehicle, panels).
// Everything is cleaned up to a blank slate when the tour finishes.
//
// Z-index layering (managed via CSS in index.css):
//   9997  Spotlight overlay (dark backdrop with cutout)
//   9998  Boosted panels (vehicle sidebar, cost calculator — only during their tour step)
//   9999  Tour tooltip card (always on top)
// Panels are boosted via body[data-tour-step="<id>"] CSS rules so they render above
// the overlay but below the tooltip. This avoids lowering the overlay z-index which
// would cause the header and other elements to float above it.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAnnounce, useFocusTrap } from '../../utils/accessibility';
import SpotlightOverlay from './SpotlightOverlay';
import TourTooltip from './TourTooltip';
import { SPOTLIGHT_STEPS } from './tourSteps';
import { useTourPositioning } from './useTourPositioning';
import { demoActions } from './demoActions';

// =============================================================================
// Types
// =============================================================================

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip: () => void;
  className?: string;
}

// =============================================================================
// Main Onboarding Flow Component
// =============================================================================

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onComplete,
  onSkip,
}) => {
  const announce = useAnnounce();
  const [currentStep, setCurrentStep] = useState(0);
  const containerRef = useFocusTrap(true);
  const cleanupRanRef = useRef(false);

  const step = SPOTLIGHT_STEPS[currentStep];
  const totalSteps = SPOTLIGHT_STEPS.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  // Position calculation — measures the target element and computes cutout + tooltip position
  // Pass currentStep so it re-measures after demo actions change the DOM
  const { cutoutRect, tooltipStyle } = useTourPositioning(
    step.targetSelector,
    step.tooltipPosition,
    step.spotlightPadding ?? 12,
    currentStep
  );

  // Set body data-tour-step attribute so CSS can boost panel z-indices
  useEffect(() => {
    document.body.setAttribute('data-tour-step', step.id);
    return () => {
      document.body.removeAttribute('data-tour-step');
    };
  }, [step.id]);

  // Run demo action when step changes
  useEffect(() => {
    const currentStepData = SPOTLIGHT_STEPS[currentStep];
    // Small delay to let the spotlight animate to its new position first
    const timer = setTimeout(() => {
      currentStepData.onEnter?.();
    }, 100);
    return () => {
      clearTimeout(timer);
      currentStepData.onExit?.();
    };
  }, [currentStep]);

  // Cleanup everything on unmount (tour complete or skip)
  useEffect(() => {
    return () => {
      if (!cleanupRanRef.current) {
        cleanupRanRef.current = true;
        demoActions.cleanup();
      }
    };
  }, []);

  // Navigation
  const handleNext = useCallback(() => {
    if (isLastStep) {
      cleanupRanRef.current = true;
      demoActions.cleanup();
      onComplete();
    } else {
      const next = currentStep + 1;
      setCurrentStep(next);
      announce(
        `Step ${next + 1} of ${totalSteps}: ${SPOTLIGHT_STEPS[next].headline}`,
        'polite'
      );
    }
  }, [currentStep, isLastStep, onComplete, announce, totalSteps]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      announce(
        `Step ${prev + 1} of ${totalSteps}: ${SPOTLIGHT_STEPS[prev].headline}`,
        'polite'
      );
    }
  }, [currentStep, announce, totalSteps]);

  const handleSkip = useCallback(() => {
    cleanupRanRef.current = true;
    demoActions.cleanup();
    onSkip();
  }, [onSkip]);

  // Keyboard: Escape to skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleSkip();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSkip]);

  // Lock body scroll during tour
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <>
      <SpotlightOverlay
        cutoutRect={cutoutRect}
        overlayOpacity={step.overlayOpacity}
      />
      <TourTooltip
        step={step}
        currentIndex={currentStep}
        totalSteps={totalSteps}
        tooltipStyle={tooltipStyle}
        onNext={handleNext}
        onBack={handleBack}
        onSkip={handleSkip}
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
        containerRef={containerRef}
      />
    </>
  );
};

export default OnboardingFlow;
