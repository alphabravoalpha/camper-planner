// Main Trip Planner Page
// Phase 1: Basic page structure, Phase 2: Map integration

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
const MapContainer = React.lazy(() => import('../components/map/MapContainer'));
const TripWizard = React.lazy(() => import('../components/wizard/TripWizard'));
import { useTripWizardStore, useRouteStore, useUIStore } from '../store';
import { useAnalytics } from '../utils/analytics';
import { useOnboarding } from '../hooks/useOnboarding';
import { Route as RouteIcon, X, MapPin, Tent, Download, BookOpen } from 'lucide-react';
import SEOHead from '../components/seo/SEOHead';

const HERO_DISMISSED_KEY = 'planner-hero-dismissed';

const WelcomeHero: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => {
  const { t } = useTranslation();
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-primary-800 to-primary-700 hidden sm:block">
      {/* Content — slim single-line bar, hidden on mobile to save vertical space */}
      <div className="relative px-4 sm:px-6 py-2.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <h2 className="text-sm sm:text-base font-display font-bold text-white whitespace-nowrap">
              {t('hero.title', 'Plan Your European Camper Adventure')}
            </h2>
            <div className="hidden sm:flex items-center gap-2">
              {[
                { icon: MapPin, label: t('hero.vehicleSafeRouting', 'Vehicle-Safe Routing') },
                { icon: Tent, label: t('hero.campsiteFinder', 'Campsite Finder') },
                { icon: Download, label: t('hero.gpxExport', 'GPX Export') },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/15 text-white/90 text-xs font-medium rounded-full whitespace-nowrap"
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
              {t('hero.travelGuides', 'Travel guides')}
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
};

const PlannerPage: React.FC = () => {
  const { openWizard, wizardOpen } = useTripWizardStore();
  const { waypoints, calculatedRoute } = useRouteStore();
  const { showOnboarding } = useOnboarding();
  const { trackFeature } = useAnalytics();
  const hasWaypoints = waypoints.length > 0;

  // Load waypoints from URL query parameter (from blog CTAs)
  const waypointsLoaded = useRef(false);
  useEffect(() => {
    if (waypointsLoaded.current) return;

    const params = new URLSearchParams(window.location.search);
    const waypointsParam = params.get('waypoints');
    if (!waypointsParam) return;

    waypointsLoaded.current = true;

    // Clear the query parameter immediately so it's not re-read on remount
    window.history.replaceState({}, '', '/');

    const loadFromUrl = () => {
      try {
        const parsed: Array<{ name: string; lat: number; lng: number }> =
          JSON.parse(waypointsParam);
        if (!Array.isArray(parsed) || parsed.length === 0) return;

        // Use getState() to bypass stale closures and persist rehydration races
        const routeStore = useRouteStore.getState();
        parsed.forEach((wp, i) => {
          const type: 'start' | 'waypoint' | 'end' =
            i === 0 ? 'start' : i === parsed.length - 1 ? 'end' : 'waypoint';
          routeStore.addWaypoint({
            id: `guide-${Date.now()}-${i}`,
            lat: wp.lat,
            lng: wp.lng,
            type,
            name: wp.name,
          });
        });

        useUIStore.getState().addNotification({
          type: 'success',
          message: 'Route loaded from travel guide',
        });
      } catch {
        // Invalid waypoints param — ignore silently
      }
    };

    // Wait for Zustand persist rehydration before writing to store
    if (useRouteStore.persist.hasHydrated()) {
      loadFromUrl();
    } else {
      useRouteStore.persist.onFinishHydration(loadFromUrl);
    }
  }, []);

  // Track route calculations
  const prevRouteRef = useRef(calculatedRoute);
  useEffect(() => {
    if (calculatedRoute && calculatedRoute !== prevRouteRef.current) {
      const route = calculatedRoute.routes?.[0];
      if (route) {
        trackFeature('route_calculation', 'completed', {
          waypoints: waypoints.length,
          distance: route.summary?.distance ? Math.round(route.summary.distance / 1000) : 0,
        });
      }
    }
    prevRouteRef.current = calculatedRoute;
  }, [calculatedRoute, waypoints.length, trackFeature]);

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
      <SEOHead
        title="Plan Your European Camper Trip — Free Route Planner"
        description="Interactive route planner with vehicle-safe routing, campsite discovery, and GPX export for 40+ European countries. Free, no account required."
        url="https://camperplanning.com/"
      />
      {/* Welcome Hero — compact, dismissible */}
      {heroVisible && <WelcomeHero onDismiss={dismissHero} />}

      {/* Map Area - Full height */}
      <div className="flex-1 relative">
        <Suspense
          fallback={
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-neutral-500 font-medium">Loading map...</p>
              </div>
            </div>
          }
        >
          <MapContainer />
        </Suspense>

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

      {/* Trip Planning Wizard Modal — lazy loaded */}
      {wizardOpen && (
        <Suspense fallback={null}>
          <TripWizard />
        </Suspense>
      )}
    </div>
  );
};

export default PlannerPage;
