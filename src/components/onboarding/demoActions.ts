// Demo Actions for Guided Tour
// Performs real actions during the onboarding tour so users see live results.
// Uses Zustand getState() for store actions, synthetic DOM clicks for local panel state.
//
// Z-index layering during the tour is managed via CSS in index.css:
//   body[data-tour-step="vehicle-panel"] boosts the vehicle sidebar to z-9998
//   body[data-tour-step="tools"]         boosts right-side panels to z-9998
// This ensures panels render ABOVE the overlay (z-9997) but BELOW the tooltip (z-9999).

import { useRouteStore, useVehicleStore, useUIStore, useMapStore } from '../../store';
import { useCostStore } from '../../store/costStore';

// =============================================================================
// Demo Data
// =============================================================================

const DEMO_WAYPOINTS = [
  {
    id: 'demo-paris',
    lat: 48.8566,
    lng: 2.3522,
    type: 'start' as const,
    name: 'Paris, France',
  },
  {
    id: 'demo-barcelona',
    lat: 41.3893,
    lng: 2.159,
    type: 'end' as const,
    name: 'Barcelona, Spain',
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
  // Toolbar buttons: active = bg-green-600; Cost calculator: active = bg-emerald-50
  return cls.includes('bg-green-600') || cls.includes('bg-emerald-50');
}

// =============================================================================
// Step Actions — all idempotent (safe to call multiple times, e.g. Back/Next)
// =============================================================================

export const demoActions = {
  /**
   * Step 3 (search-paris): Add Paris as the first waypoint and pan map.
   */
  addParis: () => {
    const route = useRouteStore.getState();
    // Clear any existing waypoints first
    if (route.waypoints.length > 0) {
      route.clearRoute();
    }
    // Add Paris
    route.addWaypoint(DEMO_WAYPOINTS[0]);
    // Pan map so Paris marker is visible in the center-left of the viewport
    // (tooltip will be bottom-right, so center the map slightly north of Paris)
    useMapStore.getState().setCenter([47.5, 2.3]);
    useMapStore.getState().setZoom(5);
  },

  /**
   * Step 4 (search-barcelona): Add Barcelona as the second waypoint.
   */
  addBarcelona: () => {
    const route = useRouteStore.getState();
    // Only add Barcelona if it doesn't already exist
    const hasBarcelona = route.waypoints.some((wp) => wp.id === 'demo-barcelona');
    if (!hasBarcelona) {
      route.addWaypoint(DEMO_WAYPOINTS[1]);
    }
    // Pan map to show both Paris (48.8N) and Barcelona (41.4N) with margin
    // Midpoint is ~45.1N, shift slightly south so both markers have padding
    useMapStore.getState().setCenter([44.5, 2.3]);
    useMapStore.getState().setZoom(5);
  },

  /**
   * Step 5 (route-overview): Pan map to show the full route between Paris and Barcelona.
   * Low overlay opacity lets the route line and markers show clearly.
   */
  panToRoute: () => {
    // Same center as Barcelona step — both markers visible, zoom 5 shows full route
    useMapStore.getState().setCenter([44.5, 2.3]);
    useMapStore.getState().setZoom(5);
  },

  /**
   * Step 7 (vehicle-panel): Set demo vehicle profile and open the vehicle sidebar.
   * CSS boosts the sidebar to z-9998 so it renders above the overlay.
   * The sidebar's own dark backdrop is hidden via CSS (our overlay handles dimming).
   */
  openVehiclePanel: () => {
    // Close any MapContainer panels left over from previous steps
    if (isButtonActive('[aria-label="Toggle cost calculator"]')) {
      clickByAriaLabel('Toggle cost calculator');
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
   * Step 8 (tools): Close vehicle sidebar, open cost calculator panel.
   * CSS boosts .map-panel-right to z-9998 so it renders above the overlay.
   * Idempotent: only clicks the toggle if cost calc is currently closed.
   */
  showTools: () => {
    useUIStore.getState().closeVehicleSidebar();
    // Delay to let sidebar close animation finish
    setTimeout(() => {
      // Only open cost calculator if it's not already open
      if (!isButtonActive('[aria-label="Toggle cost calculator"]')) {
        clickByAriaLabel('Toggle cost calculator');
      }
    }, 250);
  },

  /**
   * Step 9 (campsites): Close cost calculator, toggle campsites on.
   */
  showCampsites: () => {
    // Close cost calculator if it's open
    if (isButtonActive('[aria-label="Toggle cost calculator"]')) {
      clickByAriaLabel('Toggle cost calculator');
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
