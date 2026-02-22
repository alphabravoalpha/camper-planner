// Main Trip Planner Page
// Phase 1: Basic page structure, Phase 2: Map integration

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MapContainer from '../components/map/MapContainer';
import TripWizard from '../components/wizard/TripWizard';
import { useTripWizardStore, useRouteStore } from '../store';
import { useOnboarding } from '../hooks/useOnboarding';
import { Route as RouteIcon, X, MapPin, Tent, Download, BookOpen } from 'lucide-react';
import { IMAGES } from '../data/images';

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

        {/* Empty state illustration — subtle hint when no waypoints */}
        {!hasWaypoints && !showOnboarding && !wizardOpen && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[400] opacity-30">
            <img src="/images/empty-state.png" alt="" className="w-64 sm:w-80" />
          </div>
        )}

        {/* "Plan a Trip" floating button — always visible, prominent when no waypoints */}
        {!wizardOpen && !showOnboarding && (
          <button
            data-tour-id="plan-trip-float"
            onClick={openWizard}
            className={`absolute z-[1000] flex items-center gap-2 shadow-lg transition-all font-semibold ${
              hasWaypoints
                ? 'bottom-14 left-4 sm:bottom-4 sm:right-4 sm:left-auto px-4 py-2.5 bg-white text-accent-600 rounded-xl hover:bg-accent-50 text-sm shadow-medium ring-1 ring-black/5'
                : 'bottom-14 sm:bottom-6 left-1/2 -translate-x-1/2 px-6 py-3.5 bg-accent-500 text-white rounded-2xl hover:bg-accent-600 text-base shadow-float active:scale-[0.97]'
            }`}
          >
            <RouteIcon className={hasWaypoints ? 'w-4 h-4' : 'w-5 h-5'} />
            {hasWaypoints ? 'Continue Planning' : 'Plan a Trip'}
          </button>
        )}
      </div>

      {/* Trip Planning Wizard Modal */}
      <TripWizard />
    </div>
  );
};

export default PlannerPage;