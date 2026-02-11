// Tour Step Configuration
// Pure data — defines the 10-step spotlight guided tour with live demo actions.
//
// Z-index management:
//   The overlay is always at z-9997. Steps that open panels (vehicle sidebar,
//   cost calculator) have CSS rules in index.css that boost those panels to
//   z-9998, keyed off body[data-tour-step="<stepId>"]. This means every step
//   just sets its ID and the CSS takes care of making the right panels visible.
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
export const WAYPOINT_STEP_IDS = ['search-start', 'search-paris', 'search-barcelona'];

export const SPOTLIGHT_STEPS: SpotlightStep[] = [
  // ─── Step 1: Welcome ──────────────────────────────────────────────────
  {
    id: 'welcome',
    targetSelector: null,
    tooltipPosition: 'center',
    variant: 'welcome',
    title: 'Welcome',
    headline: 'Plan Your European Camper Trip',
    body: 'Your free, privacy-first trip planner for campervans and motorhomes across Europe.',
    features: [
      'Search destinations and build multi-stop routes',
      'Set vehicle dimensions for safe road routing',
      'Find campsites with amenity filters',
      'Calculate fuel costs and trip budgets',
      'Export routes to GPX for your GPS',
    ],
    ctaText: "Let's Get Planning",
    iconKey: 'Truck',
  },

  // ─── Step 2: Search Introduction ────────────────────────────────────
  {
    id: 'search-start',
    targetSelector: '[data-tour-id="search-bar"]',
    tooltipPosition: 'below',
    title: 'Search',
    headline: 'Search for Destinations',
    body: 'Use the search bar to find cities, towns, or places of interest. Results appear as you type — click a result to navigate there or add it to your route.',
    iconKey: 'Search',
    spotlightPadding: 12,
    overlayOpacity: 0.5,
  },

  // ─── Step 3: Add Paris ──────────────────────────────────────────────
  // No spotlight target — low overlay so the Paris marker is clearly visible on the map.
  // Tooltip in bottom-right corner so it doesn't cover the marker.
  {
    id: 'search-paris',
    targetSelector: null,
    tooltipPosition: 'right',
    title: 'Search',
    headline: 'Add Your First Stop',
    body: "We've added Paris as your first waypoint — you can see the marker on the map.",
    tip: 'You can also right-click the map to add waypoints at any location.',
    iconKey: 'MapPin',
    overlayOpacity: 0.15,
    onEnter: demoActions.addParis,
  },

  // ─── Step 4: Add Barcelona ─────────────────────────────────────────
  // No spotlight target — low overlay so both markers are visible on the map.
  {
    id: 'search-barcelona',
    targetSelector: null,
    tooltipPosition: 'right',
    title: 'Search',
    headline: 'Add Another Stop',
    body: 'Now Barcelona has been added. With two or more stops, the planner shows the path between them.',
    iconKey: 'MapPin',
    overlayOpacity: 0.15,
    onEnter: demoActions.addBarcelona,
  },

  // ─── Step 5: Route Overview ────────────────────────────────────────
  {
    id: 'route-overview',
    targetSelector: null,
    tooltipPosition: 'right',
    title: 'Route',
    headline: 'Your Route at a Glance',
    body: "Here's the route from Paris to Barcelona. The planner calculates distance and travel time between your stops.",
    tip: 'Drag waypoint markers on the map to adjust your route.',
    iconKey: 'Navigation',
    overlayOpacity: 0.08,
    onEnter: demoActions.panToRoute,
  },

  // ─── Step 6: Vehicle Button ────────────────────────────────────────
  {
    id: 'vehicle-button',
    targetSelector: '[data-tour-id="vehicle-badge"]',
    tooltipPosition: 'below',
    title: 'Vehicle',
    headline: 'Set Up Your Vehicle',
    body: "This badge opens your vehicle profile. Set your campervan or motorhome dimensions so routes avoid roads that don't fit.",
    iconKey: 'Truck',
    spotlightPadding: 8,
    overlayOpacity: 0.5,
  },

  // ─── Step 7: Vehicle Panel ─────────────────────────────────────────
  // Opens the vehicle sidebar (z-50). CSS rule `body[data-tour-step="vehicle-panel"]`
  // boosts the sidebar wrapper to z-9998 (above overlay) and hides its own
  // dark backdrop (our spotlight overlay handles the dimming).
  {
    id: 'vehicle-panel',
    targetSelector: '[data-tour-id="vehicle-sidebar-panel"]',
    tooltipPosition: 'right',
    title: 'Vehicle',
    headline: 'Vehicle Configuration',
    body: "Set your vehicle's height, width, weight, and length. The planner uses these to calculate safe routes through tunnels and over bridges.",
    tip: 'Open this panel any time by clicking the vehicle badge in the header.',
    iconKey: 'Truck',
    spotlightPadding: 0,
    overlayOpacity: 0.5,
    onEnter: demoActions.openVehiclePanel,
  },

  // ─── Step 8: Tools (Cost Calculator) ───────────────────────────────
  // Opens cost calculator panel (z-40). CSS rule `body[data-tour-step="tools"]`
  // boosts right-side `.map-panel-right` to z-9998 (above overlay).
  {
    id: 'tools',
    targetSelector: '.map-panel-right',
    tooltipPosition: 'left',
    title: 'Tools',
    headline: 'Trip Cost Calculator',
    body: 'Track fuel costs, campsite fees, tolls, and more. The calculator uses your vehicle profile to estimate fuel consumption.',
    iconKey: 'Calculator',
    spotlightPadding: 0,
    overlayOpacity: 0.5,
    onEnter: demoActions.showTools,
  },

  // ─── Step 9: Campsites ─────────────────────────────────────────────
  {
    id: 'campsites',
    targetSelector: '[data-tour-id="campsite-toggle"]',
    tooltipPosition: 'right',
    title: 'Campsites',
    headline: 'Find Campsites Along Your Route',
    body: 'Toggle campsites on using this button, then zoom in to see markers. Click any marker for details, amenities, and booking links.',
    tip: 'Campsite data comes from OpenStreetMap — zoom in for more results.',
    iconKey: 'Tent',
    spotlightPadding: 8,
    overlayOpacity: 0.15,
    onEnter: demoActions.showCampsites,
  },

  // ─── Step 10: Ready ────────────────────────────────────────────────
  {
    id: 'ready',
    targetSelector: null,
    tooltipPosition: 'center',
    variant: 'final',
    title: 'Ready',
    headline: "You're All Set!",
    body: "That's the tour! When you click Start Planning, we'll clear the demo data and give you a fresh map. Right-click to add your first stop, or use the search bar at the top.",
    ctaText: 'Start Planning',
    iconKey: 'CheckCircle',
    onEnter: demoActions.closeAllPanels,
  },
];
