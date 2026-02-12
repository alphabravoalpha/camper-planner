// User Guidance System Component
// Phase 2.4: Intuitive onboarding and contextual help

import React, { useState, useEffect } from 'react';
import { Truck, Map, MapPin, Target, Route, Sparkles, Lightbulb } from 'lucide-react';
import { useRouteStore, useUIStore, useVehicleStore } from '../../store';
import { cn } from '../../utils/cn';
import Tooltip from './Tooltip';

interface GuidanceStep {
  id: string;
  title: string;
  content: string;
  action?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  icon?: React.FC<{ className?: string }>;
  dismissible?: boolean;
}

interface UserGuidanceProps {
  className?: string;
}

// Guidance steps for first-time users
const GUIDANCE_STEPS: GuidanceStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Camper Planner!',
    content: 'Plan your perfect European camping trip by clicking on the map to add waypoints.',
    action: 'Click anywhere on the map to start',
    icon: Map,
    dismissible: true
  },
  {
    id: 'first-waypoint',
    title: 'Great start!',
    content: 'You\'ve added your first waypoint. Add more points to create your route.',
    action: 'Click another location to continue',
    icon: MapPin
  },
  {
    id: 'route-ready',
    title: 'Route ready!',
    content: 'Perfect! You now have a route. Use the controls to zoom, add layers, or go fullscreen.',
    action: 'Try the map controls on the right',
    icon: Sparkles
  }
];

// Tips and contextual help content
const TIPS = {
  mapInteraction: {
    title: 'Map Interaction Tips',
    items: [
      'Click anywhere to add a waypoint',
      'Drag waypoints to reposition them',
      'Right-click for context menu options',
      'Use mouse wheel to zoom in/out',
      'Hold Shift and drag to pan quickly'
    ]
  },
  waypointManagement: {
    title: 'Waypoint Management',
    items: [
      'First point becomes your start location',
      'Last point becomes your destination',
      'Numbers show the route sequence',
      'Edit names and add notes in popups',
      'Use Ctrl+Z to undo actions'
    ]
  },
  vehicleProfile: {
    title: 'Vehicle Configuration',
    items: [
      'Click the vehicle button (top-left) to set up your camper',
      'Choose from presets or enter custom dimensions',
      'Accurate dimensions ensure safe routing',
      'Toggle between metric and imperial units',
      'Profile is saved automatically'
    ]
  },
  keyboardShortcuts: {
    title: 'Keyboard Shortcuts',
    items: [
      '+/- to zoom in/out',
      'Arrow keys to pan the map',
      'Ctrl+F to zoom to fit all waypoints',
      'Ctrl+R to reset map view',
      'Alt+F for fullscreen mode'
    ]
  }
};

const UserGuidance: React.FC<UserGuidanceProps> = ({ className }) => {
  const { waypoints } = useRouteStore();
  const { profile: _profile } = useVehicleStore();
  const { addNotification } = useUIStore();

  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [dismissedSteps, setDismissedSteps] = useState<Set<string>>(new Set());
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  // Check if this is the user's first visit
  useEffect(() => {
    const hasVisited = localStorage.getItem('camper-planner-visited');
    if (!hasVisited) {
      setIsFirstVisit(true);
      setCurrentStep('welcome');
      localStorage.setItem('camper-planner-visited', 'true');
    }

    // Load dismissed steps from localStorage
    const dismissed = localStorage.getItem('camper-planner-dismissed-steps');
    if (dismissed) {
      setDismissedSteps(new Set(JSON.parse(dismissed)));
    }
  }, []);

  // Progress through guidance based on user actions
  useEffect(() => {
    if (dismissedSteps.has('welcome') || !isFirstVisit) return;

    if (waypoints.length === 1 && currentStep === 'welcome') {
      setCurrentStep('first-waypoint');
    } else if (waypoints.length >= 2 && currentStep === 'first-waypoint') {
      setCurrentStep('route-ready');
      // Auto-dismiss after showing route-ready for 3 seconds
      setTimeout(() => {
        dismissStep('route-ready');
      }, 3000);
    }
  }, [waypoints.length, currentStep, dismissedSteps, isFirstVisit]);

  // Dismiss a guidance step
  const dismissStep = (stepId: string) => {
    const newDismissed = new Set([...dismissedSteps, stepId]);
    setDismissedSteps(newDismissed);
    localStorage.setItem('camper-planner-dismissed-steps', JSON.stringify([...newDismissed]));

    if (currentStep === stepId) {
      setCurrentStep(null);
    }
  };

  // Reset all guidance (for development/testing)
  const resetGuidance = () => {
    localStorage.removeItem('camper-planner-visited');
    localStorage.removeItem('camper-planner-dismissed-steps');
    setDismissedSteps(new Set());
    setCurrentStep('welcome');
    setIsFirstVisit(true);
    addNotification({
      type: 'info',
      message: 'Guidance system reset'
    });
  };

  // Get current active step
  const activeStep = GUIDANCE_STEPS.find(step => step.id === currentStep);

  // Tips component
  const TipsPanel = () => (
    <div className="bg-white rounded-lg shadow-lg border border-neutral-200 p-4 max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2"><Lightbulb className="w-5 h-5" /> Quick Tips</h3>
        <button
          onClick={() => setShowHelpPanel(false)}
          className="text-neutral-400 hover:text-neutral-600 p-1 rounded transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        {Object.entries(TIPS).map(([key, tip]) => (
          <div key={key} className="border-b border-neutral-100 last:border-0 pb-3 last:pb-0">
            <h4 className="font-medium text-neutral-900 mb-2">{tip.title}</h4>
            <ul className="text-sm text-neutral-600 space-y-1">
              {tip.items.map((item, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-primary-500 mr-2">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {import.meta.env.DEV && (
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <button
            onClick={resetGuidance}
            className="text-xs text-neutral-500 hover:text-neutral-700 underline"
          >
            Reset Guidance (Dev)
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className={cn('relative', className)}>
      {/* Active Guidance Step */}
      {activeStep && !dismissedSteps.has(activeStep.id) && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-40 max-w-sm">
          <div className="bg-primary-600 text-white rounded-lg shadow-lg p-4 border border-primary-500 animate-fade-in">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center">
                {activeStep.icon && (
                  <activeStep.icon className="w-5 h-5 mr-2" />
                )}
                <h3 className="font-semibold">{activeStep.title}</h3>
              </div>
              {activeStep.dismissible && (
                <button
                  onClick={() => dismissStep(activeStep.id)}
                  className="text-primary-200 hover:text-white p-1 rounded transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <p className="text-primary-100 mb-3">{activeStep.content}</p>

            {activeStep.action && (
              <div className="text-sm text-primary-200 bg-primary-700 bg-opacity-50 rounded px-3 py-2 flex items-center gap-1">
                <Lightbulb className="w-4 h-4 flex-shrink-0" /> {activeStep.action}
              </div>
            )}

            {!activeStep.dismissible && (
              <button
                onClick={() => dismissStep(activeStep.id)}
                className="mt-3 w-full bg-primary-500 hover:bg-primary-400 text-white py-2 px-4 rounded text-sm font-medium transition-colors"
              >
                Got it!
              </button>
            )}
          </div>
        </div>
      )}

      {/* Help Button */}
      <div className="fixed bottom-4 right-4 z-40">
        <Tooltip
          content="Get help and tips"
          position="left"
          size="sm"
        >
          <button
            onClick={() => setShowHelpPanel(!showHelpPanel)}
            className={cn(
              'w-12 h-12 bg-white rounded-full shadow-lg border border-neutral-200',
              'flex items-center justify-center transition-all duration-200',
              'hover:bg-primary-50 hover:border-primary-300 hover:scale-105',
              showHelpPanel && 'bg-primary-50 border-primary-300 scale-105'
            )}
            aria-label="Toggle help panel"
          >
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </Tooltip>
      </div>

      {/* Help Panel */}
      {showHelpPanel && (
        <div className="fixed bottom-20 right-4 z-50 animate-fade-in">
          <TipsPanel />
        </div>
      )}

    </div>
  );
};

export default UserGuidance;