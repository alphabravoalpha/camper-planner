// Main Trip Planner Page
// Phase 1: Basic page structure, Phase 2: Map integration

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MapContainer from '../components/map/MapContainer';
import TripWizard from '../components/wizard/TripWizard';
import { useTripWizardStore, useRouteStore } from '../store';
import { useOnboarding } from '../hooks/useOnboarding';
import { Route as RouteIcon, X, MapPin, Tent, Download, BookOpen } from 'lucide-react';


const HERO_DISMISSED_KEY = 'planner-hero-dismissed';

const WelcomeHero: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => (
  <div className="relative overflow-hidden bg-gradient-to-r from-primary-800 to-primary-700">
    {/* Content — slim single-line bar */}
    <div className="relative px-4 sm:px-6 py-2.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <h2 className="text-sm sm:text-base font-display font-bold text-white whitespace-nowrap">
            Plan Your European Camper Adventure
          </h2>
          <div className="hidden sm:flex items-center gap-2">
            {[
              { icon: MapPin, label: 'Vehicle-Safe Routing' },
              { icon: Tent, label: 'Campsite Finder' },
              { icon: Download, label: 'GPX Export' },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/15 text-white/90 text-xs font-medium rounded-full"
              >
                <Icon className="w-3 h-3" />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            to="/guides"
            className="hidden md:inline-flex items-center gap-1 text-xs text-primary-200 hover:text-white transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Travel guides
          </Link>
          <button
            onClick={onDismiss}
            className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
            aria-label="Dismiss welcome banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
);

const PlannerPage: React.FC = () => {
  const { openWizard, wizardOpen } = useTripWizardStore();
  const { waypoints } = useRouteStore();
  const { showOnboarding } = useOnboarding();
  const hasWaypoints = waypoints.length > 0;

  const [showHero, setShowHero] = useState(() => {
    return !localStorage.getItem(HERO_DISMISSED_KEY);
  });

  const dismissHero = () => {
    setShowHero(false);
    localStorage.setItem(HERO_DISMISSED_KEY, '1');
  };

  // Hide hero during onboarding
  const heroVisible = showHero && !showOnboarding && !hasWaypoints;

  return (
    <div className="h-full flex flex-col">
      {/* Welcome Hero — compact, dismissible */}
      {heroVisible && <WelcomeHero onDismiss={dismissHero} />}

      {/* Map Area - Full height */}
      <div className="flex-1 relative">
        <MapContainer />

        {/* Empty state — illustration + CTA card when no waypoints */}
        {!hasWaypoints && !showOnboarding && !wizardOpen && (
          <div className="absolute inset-0 z-[400] flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto flex flex-col items-center gap-4 px-6 py-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-float max-w-xs text-center">
              <img src="/images/empty-state.png" alt="" className="w-48 sm:w-56 h-20 sm:h-24 object-cover object-center" />
              <div>
                <h3 className="text-lg font-display font-bold text-neutral-800 mb-1">
                  Where to next?
                </h3>
                <p className="text-sm text-neutral-500">
                  Plan a route with vehicle-safe directions, campsites, and cost estimates.
                </p>
              </div>
              <button
                data-tour-id="plan-trip-float"
                onClick={openWizard}
                className="flex items-center gap-2 px-6 py-3 bg-accent-500 text-white rounded-2xl hover:bg-accent-600 font-semibold text-base shadow-lg active:scale-[0.97] transition-all"
              >
                <RouteIcon className="w-5 h-5" />
                Plan a Trip
              </button>
            </div>
          </div>
        )}

        {/* "Continue Planning" button — only when waypoints exist */}
        {hasWaypoints && !wizardOpen && !showOnboarding && (
          <button
            data-tour-id="plan-trip-float"
            onClick={openWizard}
            className="absolute z-[1000] bottom-14 left-4 sm:bottom-4 sm:right-4 sm:left-auto flex items-center gap-2 px-4 py-2.5 bg-white text-accent-600 rounded-xl hover:bg-accent-50 text-sm font-semibold shadow-medium ring-1 ring-black/5 transition-all"
          >
            <RouteIcon className="w-4 h-4" />
            Continue Planning
          </button>
        )}
      </div>

      {/* Trip Planning Wizard Modal */}
      <TripWizard />
    </div>
  );
};

export default PlannerPage;