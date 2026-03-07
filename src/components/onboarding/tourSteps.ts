// Tour Step Configuration
// Pure data — defines the 6-step spotlight guided tour with live demo actions.
//
// The tour walks through the core trip-planning loop: search → find campsites → add to route.
// Steps mirror what a real user does: add start, discover campsites, build a multi-stop trip.
//
// All user-visible strings are stored as i18n translation KEY REFERENCES (e.g. 'tour.welcome.title').
// TourTooltip.tsx resolves them at render time via t(step.titleKey).
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
  /** i18n key for the step title (displayed as heading) */
  titleKey: string;
  /** i18n key for the step description (displayed as body text) */
  descriptionKey: string;
  /** i18n key for the tip text (optional) */
  tipKey?: string;
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
  /** i18n keys for feature bullet points shown on the welcome variant */
  featureKeys?: string[];
  /** i18n key for custom CTA button text (default: tour.buttonNext, or tour.buttonFinish on last step) */
  ctaTextKey?: string;
  /** Tool items shown on the toolkit step — labels and descriptions are i18n keys */
  tools?: Array<{ emoji: string; labelKey: string; descriptionKey: string }>;
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
    titleKey: 'tour.welcome.title',
    descriptionKey: 'tour.welcome.description',
    featureKeys: ['tour.welcome.feature1', 'tour.welcome.feature2', 'tour.welcome.feature3'],
    ctaTextKey: 'tour.buttonStart',
    iconKey: 'Truck',
  },

  // ─── Step 2: Search & Add Start ─────────────────────────────────────
  {
    id: 'add-start',
    targetSelector: '[data-tour-id="search-bar"]',
    tooltipPosition: 'below',
    titleKey: 'tour.addStart.title',
    descriptionKey: 'tour.addStart.description',
    tipKey: 'tour.addStart.tip',
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
    titleKey: 'tour.findCampsites.title',
    descriptionKey: 'tour.findCampsites.description',
    tipKey: 'tour.findCampsites.tip',
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
    titleKey: 'tour.addCampsite.title',
    descriptionKey: 'tour.addCampsite.description',
    tipKey: 'tour.addCampsite.tip',
    iconKey: 'Tent',
    overlayOpacity: 0.08,
    onEnter: demoActions.addCampsitesToRoute,
  },

  // ─── Step 5: Toolkit ────────────────────────────────────────────────
  {
    id: 'toolkit',
    targetSelector: '[data-tour-id="left-toolbar"]',
    tooltipPosition: 'right',
    titleKey: 'tour.toolkit.title',
    descriptionKey: 'tour.toolkit.description',
    iconKey: 'Wrench',
    spotlightPadding: 8,
    overlayOpacity: 0.4,
    tools: [
      {
        emoji: '\uD83D\uDE90',
        labelKey: 'tour.toolkit.toolVehicleLabel',
        descriptionKey: 'tour.toolkit.toolVehicleDesc',
      },
      {
        emoji: '\uD83D\uDCCA',
        labelKey: 'tour.toolkit.toolCostsLabel',
        descriptionKey: 'tour.toolkit.toolCostsDesc',
      },
      {
        emoji: '\uD83D\uDCC5',
        labelKey: 'tour.toolkit.toolStagesLabel',
        descriptionKey: 'tour.toolkit.toolStagesDesc',
      },
      {
        emoji: '\uD83D\uDCBE',
        labelKey: 'tour.toolkit.toolSaveLabel',
        descriptionKey: 'tour.toolkit.toolSaveDesc',
      },
    ],
  },

  // ─── Step 6: Ready ──────────────────────────────────────────────────
  {
    id: 'ready',
    targetSelector: null,
    tooltipPosition: 'center',
    variant: 'final',
    titleKey: 'tour.ready.title',
    descriptionKey: 'tour.ready.description',
    ctaTextKey: 'tour.buttonFinish',
    iconKey: 'CheckCircle',
    onEnter: demoActions.closeAllPanels,
  },
];
