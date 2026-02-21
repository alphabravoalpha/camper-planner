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
  <div className="relative overflow-hidden">
    {/* Background image */}
    <div className="absolute inset-0">
      <img
        src={IMAGES.homepageHero.src}
        alt={IMAGES.homepageHero.alt}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-primary-900/85 to-primary-800/70" />
    </div>

    {/* Content */}
    <div className="relative px-4 sm:px-6 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white mb-2">
              Plan Your European Camper Adventure
            </h2>
            <p className="text-primary-100 text-sm sm:text-base mb-4 max-w-xl">
              Free route planning with vehicle-safe routing, campsite discovery, and GPX export across 40+ European countries.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { icon: MapPin, label: 'Vehicle-Safe Routing' },
                { icon: Tent, label: 'Campsite Finder' },
                { icon: Download, label: 'GPX Export' },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 text-white text-xs font-medium rounded-full backdrop-blur-sm"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </span>
              ))}
            </div>

            <Link
              to="/guides"
              className="inline-flex items-center gap-1.5 text-sm text-primary-200 hover:text-white transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Browse our travel guides
            </Link>
          </div>

          {/* Dismiss button */}
          <button
            onClick={onDismiss}
            className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
            aria-label="Dismiss welcome banner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>

    {/* Photo credit */}
    <div className="absolute bottom-1 right-2 text-[10px] text-white/40">
      Photo by{' '}
      <a href={IMAGES.homepageHero.creditUrl} target="_blank" rel="noopener noreferrer" className="underline">
        {IMAGES.homepageHero.credit}
      </a>
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

        {/* "Plan a Trip" floating button — always visible, prominent when no waypoints */}
        {!wizardOpen && !showOnboarding && (
          <button
            data-tour-id="plan-trip-float"
            onClick={openWizard}
            className={`absolute z-[1000] flex items-center gap-2 shadow-lg transition-all font-semibold ${
              hasWaypoints
                ? 'bottom-16 sm:bottom-4 right-4 px-4 py-2.5 bg-white text-accent-600 rounded-xl hover:bg-accent-50 text-sm shadow-medium ring-1 ring-black/5'
                : 'bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 px-6 py-3.5 bg-accent-500 text-white rounded-2xl hover:bg-accent-600 text-base shadow-float active:scale-[0.97]'
            }`}
          >
            <RouteIcon className={hasWaypoints ? 'w-4 h-4' : 'w-5 h-5'} />
            {hasWaypoints ? 'Plan a Trip' : 'Plan a Trip'}
          </button>
        )}
      </div>

      {/* Trip Planning Wizard Modal */}
      <TripWizard />
    </div>
  );
};

export default PlannerPage;