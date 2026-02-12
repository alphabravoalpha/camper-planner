// Demo Actions for Guided Tour
// Performs real actions during the onboarding tour so users see live results.
// Uses Zustand getState() for store actions, synthetic DOM clicks for local panel state.
//
// Z-index layering during the tour is managed via CSS in index.css:
//   body[data-tour-step="vehicle-setup"]   boosts the vehicle sidebar to z-9998
//   body[data-tour-step="daily-stages"]    boosts the planning tools panel to z-9998
//   body[data-tour-step="cost-calculator"] boosts right-side panels to z-9998
// This ensures panels render ABOVE the overlay (z-9997) but BELOW the tooltip (z-9999).

import { useRouteStore, useVehicleStore, useUIStore, useMapStore } from '../../store';
import { useCostStore } from '../../store/costStore';

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

const DEMO_VEHICLE = {
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
function clickByAriaLabel(label: string): boolean {
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

/** Check if a button is in its "active" state (coloured bg). */
function isButtonActive(selector: string): boolean {
  const el = document.querySelector(selector);
  if (!el) return false;
  const cls = el.className;
  // Campsite toggle: bg-green-600; Cost calculator: bg-emerald-50; Planning tools: bg-violet-50
  return cls.includes('bg-green-600') || cls.includes('bg-emerald-50') || cls.includes('bg-violet-50');
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
    // Add London
    route.addWaypoint(DEMO_WAYPOINTS[0]);
    // Pan map to London
    useMapStore.getState().setCenter([51.5, -0.1]);
    useMapStore.getState().setZoom(8);
  },

  /**
   * Step 3 (search-destination): Pan map to show France overview.
   * No API calls — just shows the map at a zoom level where
   * the user can imagine searching for a destination.
   */
  panToFrance: () => {
    useMapStore.getState().setCenter([46.5, 2.3]);
    useMapStore.getState().setZoom(6);
  },

  /**
   * Step 4 (campsite-near-lyon): Add campsite near Lyon as overnight stop.
   */
  addLyonCampsite: () => {
    const route = useRouteStore.getState();
    // Only add if not already present (idempotent)
    const hasLyon = route.waypoints.some((wp) => wp.id === 'demo-campsite-lyon');
    if (!hasLyon) {
      route.addWaypoint(DEMO_WAYPOINTS[1]);
    }
    // Pan to show both London and Lyon area
    useMapStore.getState().setCenter([48.5, 2.5]);
    useMapStore.getState().setZoom(6);
  },

  /**
   * Step 5 (campsite-destination): Add campsite near Nice as final destination.
   */
  addNiceCampsite: () => {
    const route = useRouteStore.getState();
    // Only add if not already present (idempotent)
    const hasNice = route.waypoints.some((wp) => wp.id === 'demo-campsite-nice');
    if (!hasNice) {
      route.addWaypoint(DEMO_WAYPOINTS[2]);
    }
    // Pan to show full route from London to Nice
    useMapStore.getState().setCenter([47.0, 3.5]);
    useMapStore.getState().setZoom(5);
  },

  /**
   * Step 6 (vehicle-setup): Set demo vehicle profile and open the vehicle sidebar.
   * CSS boosts the sidebar to z-9998 so it renders above the overlay.
   */
  openVehiclePanel: () => {
    // Close any MapContainer panels left over from previous steps
    if (isButtonActive('[aria-label="Toggle cost calculator"]')) {
      clickByAriaLabel('Toggle cost calculator');
    }
    if (isButtonActive('[aria-label="Toggle planning tools"]')) {
      clickByAriaLabel('Toggle planning tools');
    }
    useVehicleStore.getState().setProfile(DEMO_VEHICLE);
    useCostStore.getState().setFuelConsumptionSettings({
      consumptionType: 'l_per_100km',
      consumption: 12.5,
      fuelType: 'diesel',
      tankCapacity: 80,
    });
    // Open the vehicle sidebar panel so users see it populated
    useUIStore.getState().openVehicleSidebar();
  },

  /**
   * Step 7 (daily-stages): Close vehicle sidebar, open planning tools panel.
   * CSS boosts planning-tools-panel to z-9998 so it renders above the overlay.
   */
  showPlanningTools: () => {
    useUIStore.getState().closeVehicleSidebar();
    // Close cost calculator if open
    if (isButtonActive('[aria-label="Toggle cost calculator"]')) {
      clickByAriaLabel('Toggle cost calculator');
    }
    // Delay to let sidebar close animation finish
    setTimeout(() => {
      // Only open planning tools if not already open
      if (!isButtonActive('[aria-label="Toggle planning tools"]')) {
        clickByTourId('planning-tools-button');
      }
    }, 250);
  },

  /**
   * Step 8 (cost-calculator): Close planning tools, open cost calculator panel.
   * CSS boosts .map-panel-right to z-9998 so it renders above the overlay.
   */
  showCostCalculator: () => {
    // Close planning tools if open
    if (isButtonActive('[aria-label="Toggle planning tools"]')) {
      clickByAriaLabel('Toggle planning tools');
    }
    // Close vehicle sidebar if still open
    useUIStore.getState().closeVehicleSidebar();
    // Delay to let panels close
    setTimeout(() => {
      // Only open cost calculator if it's not already open
      if (!isButtonActive('[aria-label="Toggle cost calculator"]')) {
        clickByAriaLabel('Toggle cost calculator');
      }
    }, 250);
  },

  /**
   * Step 9 (campsites-map): Close cost calculator, toggle campsites on.
   */
  showCampsites: () => {
    // Close cost calculator if it's open
    if (isButtonActive('[aria-label="Toggle cost calculator"]')) {
      clickByAriaLabel('Toggle cost calculator');
    }
    // Close planning tools if open
    if (isButtonActive('[aria-label="Toggle planning tools"]')) {
      clickByAriaLabel('Toggle planning tools');
    }
    // Close vehicle sidebar if still open
    useUIStore.getState().closeVehicleSidebar();
    // Toggle campsites on (only if currently off)
    setTimeout(() => {
      const btn = document.querySelector('[data-tour-id="campsite-toggle"]');
      if (btn && btn.className.includes('bg-white')) {
        clickByTourId('campsite-toggle');
      }
    }, 250);
  },

  /**
   * Step 10 (ready): Close all open panels for clean state.
   */
  closeAllPanels: () => {
    // Close campsite controls if open
    if (isButtonActive('[data-tour-id="campsite-toggle"]')) {
      clickByTourId('campsite-toggle');
    }
    // Close cost calculator if open
    if (isButtonActive('[aria-label="Toggle cost calculator"]')) {
      clickByAriaLabel('Toggle cost calculator');
    }
    // Close planning tools if open
    if (isButtonActive('[aria-label="Toggle planning tools"]')) {
      clickByAriaLabel('Toggle planning tools');
    }
    // Close vehicle sidebar if still open
    useUIStore.getState().closeVehicleSidebar();
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
    useMapStore.getState().setCenter([54.526, 15.2551]);
    useMapStore.getState().setZoom(5);

    // Close any open MapContainer panels
    demoActions.closeAllPanels();
  },
};
