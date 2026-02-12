// Tour Step Configuration
// Pure data — defines the 10-step spotlight guided tour with live demo actions.
//
// The tour walks through a realistic trip-planning workflow: London → French Riviera.
// Steps mirror what a real user does: add home, search destination, pick campsites,
// set vehicle, check daily stages, estimate costs, explore campsite layer.
//
// Z-index management:
//   The overlay is always at z-9997. Steps that open panels (vehicle sidebar,
//   planning tools, cost calculator) have CSS rules in index.css that boost those
//   panels to z-9998, keyed off body[data-tour-step="<stepId>"]. This means every
//   step just sets its ID and the CSS takes care of making the right panels visible.
//   The `overlayOpacity` field controls how dark the overlay is — lower values
//   let map content (waypoints, campsites) show through more clearly.

import { demoActions } from './demoActions';

export type TooltipPosition = 'above' | 'below' | 'left' | 'right' | 'center';

export interface SpotlightStep {
  id: string;
  /** CSS selector for the target element. null = no spotlight (centered card). */
  targetSelector: string | null;
  /** Preferred tooltip position relative to the spotlight cutout */
  tooltipPosition: TooltipPosition;
  /** Content */
  title: string;
  headline: string;
  body: string;
  tip?: string;
  /** Lucide icon name for the tooltip header */
  iconKey: 'Truck' | 'MapPin' | 'Tent' | 'Calculator' | 'Briefcase' | 'CheckCircle' | 'Search' | 'Navigation';
  /** Extra padding around the spotlight cutout in px (default 12) */
  spotlightPadding?: number;
  /** Overlay darkness 0-1 (default 0.6). Lower = more see-through so live changes are visible. */
  overlayOpacity?: number;
  /** Called when this step becomes active — performs live demo actions */
  onEnter?: () => void;
  /** Called when leaving this step */
  onExit?: () => void;
  /** Render variant: 'welcome' for the intro card with feature list, 'final' for the closing card */
  variant?: 'welcome' | 'final';
  /** Feature bullet points shown on the welcome variant */
  features?: string[];
  /** Custom CTA button text (default: "Next", or "Start Planning" on last step) */
  ctaText?: string;
}

/** Step IDs during which the search bar should remain visible on the map */
export const WAYPOINT_STEP_IDS = ['add-start', 'search-destination'];

export const SPOTLIGHT_STEPS: SpotlightStep[] = [
  // ─── Step 1: Welcome ──────────────────────────────────────────────────
  {
    id: 'welcome',
    targetSelector: null,
    tooltipPosition: 'center',
    variant: 'welcome',
    title: 'Welcome',
    headline: 'Plan Your European Camper Trip',
    body: 'Follow along as we plan a motorhome trip from London to the French Riviera — the same workflow you\'ll use for your own trips.',
    features: [
      'Search and add stops along your route',
      'Discover campsites with amenity filters',
      'Set vehicle dimensions for safe road routing',
      'View daily driving stages and trip costs',
      'Export routes to GPX for your GPS',
    ],
    ctaText: 'Show Me How',
    iconKey: 'Truck',
  },

  // ─── Step 2: Start from Home ──────────────────────────────────────────
  {
    id: 'add-start',
    targetSelector: '[data-tour-id="search-bar"]',
    tooltipPosition: 'below',
    title: 'Start Point',
    headline: 'Start from Home',
    body: 'Every trip starts somewhere. We\'ve added London as your departure point — you\'ll do the same by searching for your address or right-clicking the map.',
    tip: 'You can search for any address, city, or place of interest.',
    iconKey: 'MapPin',
    spotlightPadding: 12,
    overlayOpacity: 0.3,
    onEnter: demoActions.addLondon,
  },

  // ─── Step 3: Search for a Destination ─────────────────────────────────
  {
    id: 'search-destination',
    targetSelector: '[data-tour-id="search-bar"]',
    tooltipPosition: 'below',
    title: 'Destination',
    headline: 'Search for a Destination',
    body: 'Now search for where you want to go. We\'re heading to the South of France — the search finds cities, towns, and campsites near any location.',
    tip: 'Results show both places and campsites. Click \'Go\' to navigate the map, or \'+ Add\' to add it to your route.',
    iconKey: 'Search',
    spotlightPadding: 12,
    overlayOpacity: 0.3,
    onEnter: demoActions.panToFrance,
  },

  // ─── Step 4: Pick a Campsite (Lyon) ───────────────────────────────────
  // No spotlight target — low overlay so map markers are clearly visible.
  {
    id: 'campsite-near-lyon',
    targetSelector: null,
    tooltipPosition: 'right',
    title: 'Overnight Stop',
    headline: 'Pick a Campsite for Your First Night',
    body: 'On a long drive, you\'ll want overnight stops. We\'ve added a campsite near Lyon — around 450km from London, a good day\'s driving.',
    tip: 'Zoom into any area and toggle campsites on to browse real data from OpenStreetMap.',
    iconKey: 'Tent',
    overlayOpacity: 0.12,
    onEnter: demoActions.addLyonCampsite,
  },

  // ─── Step 5: Final Destination Campsite (Nice) ────────────────────────
  {
    id: 'campsite-destination',
    targetSelector: null,
    tooltipPosition: 'right',
    title: 'Final Destination',
    headline: 'Add Your Destination Campsite',
    body: 'We\'ve added a campsite on the French Riviera as your final stop. With three waypoints, the planner calculates the full multi-stop route.',
    tip: 'Drag waypoint markers on the map to adjust your route at any time.',
    iconKey: 'Tent',
    overlayOpacity: 0.08,
    onEnter: demoActions.addNiceCampsite,
  },

  // ─── Step 6: Vehicle Setup ────────────────────────────────────────────
  // Opens the vehicle sidebar (z-50). CSS rule `body[data-tour-step="vehicle-setup"]`
  // boosts the sidebar wrapper to z-9998 (above overlay) and hides its own
  // dark backdrop (our spotlight overlay handles the dimming).
  {
    id: 'vehicle-setup',
    targetSelector: '[data-tour-id="vehicle-sidebar-panel"]',
    tooltipPosition: 'right',
    title: 'Vehicle',
    headline: 'Set Up Your Vehicle',
    body: 'Tell the planner your vehicle\'s dimensions so it avoids roads too narrow, bridges too low, or weight-restricted routes.',
    tip: 'Open this panel any time by clicking the vehicle badge in the header.',
    iconKey: 'Truck',
    spotlightPadding: 0,
    overlayOpacity: 0.5,
    onEnter: demoActions.openVehiclePanel,
  },

  // ─── Step 7: Daily Driving Stages ─────────────────────────────────────
  // Opens the planning tools panel. CSS rule `body[data-tour-step="daily-stages"]`
  // boosts the panel to z-9998 (above overlay).
  {
    id: 'daily-stages',
    targetSelector: '[data-tour-id="planning-tools-panel"]',
    tooltipPosition: 'left',
    title: 'Planning',
    headline: 'Daily Driving Stages',
    body: 'The planning tools split your route into daily stages based on your vehicle type. A motorhome is typically limited to around 6 hours of driving per day.',
    iconKey: 'Navigation',
    spotlightPadding: 0,
    overlayOpacity: 0.5,
    onEnter: demoActions.showPlanningTools,
  },

  // ─── Step 8: Cost Calculator ──────────────────────────────────────────
  // Opens cost calculator panel. CSS rule `body[data-tour-step="cost-calculator"]`
  // boosts .map-panel-right to z-9998 (above overlay).
  {
    id: 'cost-calculator',
    targetSelector: '.map-panel-right',
    tooltipPosition: 'left',
    title: 'Costs',
    headline: 'Estimate Trip Costs',
    body: 'The cost calculator estimates fuel costs based on your vehicle\'s consumption and fuel prices in each country along your route.',
    iconKey: 'Calculator',
    spotlightPadding: 0,
    overlayOpacity: 0.5,
    onEnter: demoActions.showCostCalculator,
  },

  // ─── Step 9: Campsite Layer ───────────────────────────────────────────
  {
    id: 'campsites-map',
    targetSelector: '[data-tour-id="campsite-toggle"]',
    tooltipPosition: 'right',
    title: 'Campsites',
    headline: 'Explore Campsites on the Map',
    body: 'Toggle campsites on to see real data from OpenStreetMap. Zoom in to see individual markers — click any for details, amenities, and booking links.',
    tip: 'Use the filters to narrow results by type, amenities, or vehicle compatibility.',
    iconKey: 'Tent',
    spotlightPadding: 8,
    overlayOpacity: 0.15,
    onEnter: demoActions.showCampsites,
  },

  // ─── Step 10: Ready ───────────────────────────────────────────────────
  {
    id: 'ready',
    targetSelector: null,
    tooltipPosition: 'center',
    variant: 'final',
    title: 'Ready',
    headline: "You're Ready to Plan!",
    body: "That's the workflow! When you click Start Planning, we'll clear the demo trip and give you a fresh map. Search for your starting point, find campsites along the way, and build your dream route.",
    ctaText: 'Start Planning',
    iconKey: 'CheckCircle',
    onEnter: demoActions.closeAllPanels,
  },
];
