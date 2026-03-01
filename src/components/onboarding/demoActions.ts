// Demo Actions for Guided Tour
// Performs real actions during the onboarding tour so users see live results.
// Uses Zustand getState() for store actions, synthetic DOM clicks for local panel state.
//
// The 6-step tour only opens the campsite layer (step 3) — no vehicle, planning,
// or cost panels are toggled during the tour, so closeAllPanels is simplified.

import { useRouteStore, useVehicleStore, useUIStore, useMapStore } from '../../store';

// =============================================================================
// Demo Data — London to French Riviera trip narrative
// =============================================================================

const DEMO_WAYPOINTS = [
  {
    id: 'demo-london',
    lat: 51.5074,
    lng: -0.1278,
    type: 'start' as const,
    name: 'London, United Kingdom',
  },
  {
    id: 'demo-campsite-lyon',
    lat: 45.75,
    lng: 4.85,
    type: 'campsite' as const,
    name: 'Campsite near Lyon',
  },
  {
    id: 'demo-campsite-nice',
    lat: 43.7,
    lng: 7.27,
    type: 'campsite' as const,
    name: 'Campsite near Nice',
  },
];

const _DEMO_VEHICLE = {
  id: 'demo-vehicle',
  name: 'Hymer B550',
  type: 'motorhome',
  height: 3.1,
  width: 2.35,
  length: 5.99,
  weight: 3.5,
  fuelType: 'diesel',
  createdAt: new Date().toISOString(),
};

// =============================================================================
// Helpers
// =============================================================================

/** Click a button found by aria-label. Returns true if clicked. */
function _clickByAriaLabel(label: string): boolean {
  const el = document.querySelector(`[aria-label="${label}"]`) as HTMLElement | null;
  if (el) {
    el.click();
    return true;
  }
  return false;
}

/** Click a button found by data-tour-id. Returns true if clicked. */
function clickByTourId(tourId: string): boolean {
  const el = document.querySelector(`[data-tour-id="${tourId}"]`) as HTMLElement | null;
  if (el) {
    el.click();
    return true;
  }
  return false;
}

// =============================================================================
// Step Actions — all idempotent (safe to call multiple times, e.g. Back/Next)
// =============================================================================

export const demoActions = {
  /**
   * Step 2 (add-start): Add London as the starting waypoint and pan map.
   */
  addLondon: () => {
    const route = useRouteStore.getState();
    // Clear any existing waypoints first (idempotent)
    if (route.waypoints.length > 0) {
      route.clearRoute();
    }
    // Turn off campsites during this step to avoid wasteful Overpass API calls.
    // Step 3 (showCampsitesAtNice) will turn them back on at the right location.
    const btn = document.querySelector('[data-tour-id="campsite-toggle"]');
    if (btn && !btn.className.includes('bg-white')) {
      clickByTourId('campsite-toggle');
    }
    // Add London
    route.addWaypoint(DEMO_WAYPOINTS[0]);
    // Pan map to London — single atomic update to prevent race between setView and setZoom
    useMapStore.setState({ center: [51.5, -0.1], zoom: 8 });
  },

  /**
   * Step 3 (find-campsites): Pan to Nice area and toggle campsites on.
   */
  showCampsitesAtNice: () => {
    // Pan to Nice/French Riviera area at a zoom level showing campsite markers
    // Single atomic update to prevent race between setView and setZoom
    useMapStore.setState({ center: [43.7, 7.1], zoom: 11 });
    // Toggle campsites on (only if currently off)
    setTimeout(() => {
      const btn = document.querySelector('[data-tour-id="campsite-toggle"]');
      if (btn && btn.className.includes('bg-white')) {
        clickByTourId('campsite-toggle');
      }
    }, 300);
  },

  /**
   * Step 4 (add-campsite): Toggle campsites off, add Lyon + Nice, show full route.
   */
  addCampsitesToRoute: () => {
    // Turn off campsite layer to show clean route view
    const btn = document.querySelector('[data-tour-id="campsite-toggle"]');
    if (btn && !btn.className.includes('bg-white')) {
      clickByTourId('campsite-toggle');
    }

    const route = useRouteStore.getState();
    // Add Lyon campsite (idempotent)
    if (!route.waypoints.some(wp => wp.id === 'demo-campsite-lyon')) {
      route.addWaypoint(DEMO_WAYPOINTS[1]);
    }
    // Add Nice campsite (idempotent)
    if (!route.waypoints.some(wp => wp.id === 'demo-campsite-nice')) {
      route.addWaypoint(DEMO_WAYPOINTS[2]);
    }
    // Pan to show full route London → Lyon → Nice
    useMapStore.setState({ center: [47.0, 3.5], zoom: 5 });
  },

  /**
   * Step 6 (ready): Close all open panels for clean state.
   * Only the campsite layer may be open during the 6-step tour.
   */
  closeAllPanels: () => {
    // Turn off campsite layer if on
    const btn = document.querySelector('[data-tour-id="campsite-toggle"]');
    if (btn && !btn.className.includes('bg-white')) {
      clickByTourId('campsite-toggle');
    }
  },

  /**
   * Full cleanup — reset everything to a blank slate.
   * Called when the tour finishes (complete or skip).
   */
  cleanup: () => {
    // Reset stores
    useRouteStore.getState().clearRoute();
    useVehicleStore.getState().clearProfile();
    useUIStore.getState().closeVehicleSidebar();
    useMapStore.setState({ center: [54.526, 15.2551], zoom: 5 });

    // Close any open MapContainer panels
    demoActions.closeAllPanels();
  },
};
