// Tour Step Configuration
// Pure data — defines the 6-step spotlight guided tour with live demo actions.
//
// The tour walks through the core trip-planning loop: search → find campsites → add to route.
// Steps mirror what a real user does: add start, discover campsites, build a multi-stop trip.
//
// Z-index management:
//   The overlay is always at z-9997. Steps that spotlight UI elements have CSS rules in
//   index.css that boost those elements to z-9998, keyed off body[data-tour-step="<stepId>"].
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
  iconKey:
    | 'Truck'
    | 'MapPin'
    | 'Tent'
    | 'Calculator'
    | 'Briefcase'
    | 'CheckCircle'
    | 'Search'
    | 'Navigation'
    | 'Wrench';
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
  /** Tool items shown on the toolkit step */
  tools?: Array<{ emoji: string; label: string; description: string }>;
}

/** Step IDs during which the search bar should remain visible on the map */
export const WAYPOINT_STEP_IDS = ['add-start'];

export const SPOTLIGHT_STEPS: SpotlightStep[] = [
  // ─── Step 1: Welcome ──────────────────────────────────────────────────
  {
    id: 'welcome',
    targetSelector: null,
    tooltipPosition: 'center',
    variant: 'welcome',
    title: 'Welcome',
    headline: 'Plan Your European Camper Trip',
    body: "We'll show you the basics in under a minute. Let's plan a quick trip from London to the South of France.",
    features: [
      'Search locations and build your route',
      'Discover campsites along the way',
      'Vehicle-safe routing that avoids low bridges and narrow roads',
    ],
    ctaText: 'Show Me How',
    iconKey: 'Truck',
  },

  // ─── Step 2: Search & Add Start ─────────────────────────────────────
  {
    id: 'add-start',
    targetSelector: '[data-tour-id="search-bar"]',
    tooltipPosition: 'below',
    title: 'Start Point',
    headline: 'Search for Your Starting Point',
    body: "Type any address, city, or place. We've added London — you'll search for your own starting point.",
    tip: "Click '+ Add' on a result to add it to your route.",
    iconKey: 'MapPin',
    spotlightPadding: 12,
    overlayOpacity: 0.3,
    onEnter: demoActions.addLondon,
  },

  // ─── Step 3: Find Campsites ─────────────────────────────────────────
  {
    id: 'find-campsites',
    targetSelector: '[data-tour-id="campsite-toggle"]',
    tooltipPosition: 'right',
    title: 'Campsites',
    headline: 'Find Campsites Anywhere',
    body: "Toggle campsites on to see real campsite data. We've zoomed to the French Riviera — zoom into any area on your trips to browse campsites there.",
    tip: 'Click any campsite marker for details, amenities, and booking links.',
    iconKey: 'Tent',
    spotlightPadding: 8,
    overlayOpacity: 0.15,
    onEnter: demoActions.showCampsitesAtNice,
  },

  // ─── Step 4: Add Campsite to Route ──────────────────────────────────
  {
    id: 'add-campsite',
    targetSelector: null,
    tooltipPosition: 'right',
    title: 'Build Route',
    headline: 'Add Stops Along the Way',
    body: "We've added a campsite near Nice and an overnight stop near Lyon. Click any campsite marker → 'Add to Route' to build multi-stop trips.",
    tip: 'Drag waypoints on the map to reorder your route.',
    iconKey: 'Tent',
    overlayOpacity: 0.08,
    onEnter: demoActions.addCampsitesToRoute,
  },

  // ─── Step 5: Toolkit ────────────────────────────────────────────────
  {
    id: 'toolkit',
    targetSelector: '[data-tour-id="left-toolbar"]',
    tooltipPosition: 'right',
    title: 'Tools',
    headline: 'Tools When You Need Them',
    body: 'Once your route is taking shape, these tools help you refine it:',
    iconKey: 'Wrench',
    spotlightPadding: 8,
    overlayOpacity: 0.4,
    tools: [
      { emoji: '🚐', label: 'Vehicle setup', description: 'set dimensions for safe routing' },
      { emoji: '📊', label: 'Trip costs', description: 'fuel and budget estimates' },
      { emoji: '📅', label: 'Daily stages', description: 'break long drives into days' },
      { emoji: '💾', label: 'Save & export', description: 'save trips, export to GPS' },
    ],
  },

  // ─── Step 6: Ready ──────────────────────────────────────────────────
  {
    id: 'ready',
    targetSelector: null,
    tooltipPosition: 'center',
    variant: 'final',
    title: 'Ready',
    headline: "You're Ready to Plan!",
    body: "We'll clear the demo trip and give you a fresh map. Search for your starting point and start building your route.",
    ctaText: 'Start Planning',
    iconKey: 'CheckCircle',
    onEnter: demoActions.closeAllPanels,
  },
];
