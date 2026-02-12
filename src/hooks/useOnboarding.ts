// Onboarding Hook
// Manages first-time user onboarding state

import { useState, useEffect } from 'react';

const ONBOARDING_STORAGE_KEY = 'camper-planner-onboarding-complete';
const ONBOARDING_VERSION = '5.0'; // Workflow-based tour: London→French Riviera narrative, campsite waypoints, daily stages

interface OnboardingState {
  isComplete: boolean;
  version: string;
  completedAt?: string;
}

export const useOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user has completed onboarding
    const checkOnboardingStatus = () => {
      try {
        const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);

        if (!stored) {
          // First-time user - show onboarding
          setShowOnboarding(true);
          setIsLoading(false);
          return;
        }

        const state: OnboardingState = JSON.parse(stored);

        // Check if onboarding version matches (in case we want to re-show for major updates)
        if (state.version !== ONBOARDING_VERSION) {
          setShowOnboarding(true);
          setIsLoading(false);
          return;
        }

        // User has completed onboarding
        setShowOnboarding(false);
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // On error, show onboarding to be safe
        setShowOnboarding(true);
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  const completeOnboarding = () => {
    try {
      const state: OnboardingState = {
        isComplete: true,
        version: ONBOARDING_VERSION,
        completedAt: new Date().toISOString(),
      };

      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error saving onboarding state:', error);
      // Even if save fails, hide onboarding so user can use app
      setShowOnboarding(false);
    }
  };

  const skipOnboarding = () => {
    completeOnboarding();
  };

  const resetOnboarding = () => {
    try {
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
      setShowOnboarding(true);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  };

  return {
    showOnboarding,
    isLoading,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
  };
};
