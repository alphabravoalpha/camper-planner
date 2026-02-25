# UX Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure the planner UX around a search-first, progressive disclosure model — shorter onboarding, decluttered toolbar, simplified campsite toggle, clear empty state, and contextual nudges.

**Architecture:** Modify existing components (tourSteps, demoActions, MapContainer, UnifiedSearch) and create 3 new components (ToolsMenu, EmptyStateCard, ContextualNudge). All changes are UI/component layer — no service layer changes.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Zustand, Leaflet

**Design doc:** `docs/plans/2026-02-24-ux-overhaul-design.md`

---

## Task 1: Rewrite Onboarding Tour Steps (10 → 6)

**Files:**
- Modify: `src/components/onboarding/tourSteps.ts` (full rewrite of SPOTLIGHT_STEPS array)
- Modify: `src/index.css` (lines 45-82, tour z-index overrides)

**Step 1: Rewrite tourSteps.ts**

Replace the entire `SPOTLIGHT_STEPS` array and `WAYPOINT_STEP_IDS` export. Keep the type definitions and imports unchanged.

New step IDs: `welcome`, `add-start`, `find-campsites`, `add-campsite`, `toolkit`, `ready`

Key changes from old steps:
- `welcome`: Cut features list from 5 to 3 items. Change body text to mention "under a minute".
- `add-start`: Merge old steps 2+3. Emphasise "+ Add" button in tip. Remove "right-clicking the map" mention.
- `find-campsites` (NEW): Replaces old step 9. Target: campsite toggle. Demo: pan to Nice + toggle campsites on.
- `add-campsite` (NEW): Combines old steps 4+5. Demo: toggle campsites off, add Lyon + Nice, pan to full route.
- `toolkit` (NEW): Replaces old steps 6+7+8. Target: left toolbar. No panels opened. Just a bullet list of tools.
- `ready`: Tightened copy. Same cleanup behaviour.

Update `WAYPOINT_STEP_IDS` to `['add-start']` (only one step needs search bar visible now).

New icon types needed in the `iconKey` union: `'Wrench'` (for toolkit step). Add to the `SpotlightStep` type.

**Step 2: Update index.css tour overrides**

Remove CSS rules for deleted steps:
- Remove `body[data-tour-step="vehicle-setup"]` rules (lines 59-66)
- Remove `body[data-tour-step="daily-stages"]` rule (lines 69-71)
- Remove `body[data-tour-step="cost-calculator"]` rule (lines 74-76)
- Remove `body[data-tour-step="campsites-map"]` rule (lines 79-82)

Add CSS rules for new steps:
- `body[data-tour-step="find-campsites"]` — boost campsite toggle to z-9998
- `body[data-tour-step="toolkit"]` — boost left toolbar (`[data-tour-id="left-toolbar"]`) to z-9998

Keep existing rules for `add-start` and `search-destination` (search-destination rule can be removed since that step no longer exists, but the add-start rule stays).

**Step 3: Run type-check and fix any issues**

Run: `npm run type-check`

**Step 4: Commit**

```bash
git add src/components/onboarding/tourSteps.ts src/index.css
git commit -m "feat: rewrite onboarding tour from 10 steps to 6"
```

---

## Task 2: Rewrite Demo Actions for New Tour Steps

**Files:**
- Modify: `src/components/onboarding/demoActions.ts` (update/add/remove actions)

**Step 1: Update demoActions**

Actions to keep (unchanged):
- `addLondon` — used by step 2 (add-start), same as before
- `cleanup` — used on tour complete/skip, same as before

Actions to remove:
- `panToFrance` — old step 3 no longer exists
- `openVehiclePanel` — old step 6 removed
- `showPlanningTools` — old step 7 removed
- `showCostCalculator` — old step 8 removed
- `showCampsites` — replaced by new `showCampsitesAtNice`

Actions to add/modify:

```typescript
/**
 * Step 3 (find-campsites): Pan to Nice area and toggle campsites on.
 */
showCampsitesAtNice: () => {
  // Pan to Nice/French Riviera area at a zoom level showing campsite markers
  useMapStore.getState().setCenter([43.7, 7.1]);
  useMapStore.getState().setZoom(11);
  // Toggle campsites on (only if currently off)
  setTimeout(() => {
    const btn = document.querySelector('[data-tour-id="campsite-toggle"]');
    if (btn && btn.className.includes('bg-white')) {
      clickByTourId('campsite-toggle');
    }
  }, 300);
},

/**
 * Step 4 (add-campsite): Toggle campsites off, add Lyon + Nice waypoints, show full route.
 */
addCampsitesToRoute: () => {
  // Turn off campsites to show clean route view
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
  // Pan to show full route
  useMapStore.getState().setCenter([47.0, 3.5]);
  useMapStore.getState().setZoom(5);
},
```

Update `closeAllPanels`: Simplify — only needs to handle campsite toggle now (no more vehicle/planning/cost panel closing needed during tour).

Remove the `isButtonActive` helper for `bg-emerald-50` and `bg-violet-50` checks — those panels are no longer opened during the tour. Keep the `bg-green-600` check for campsite toggle.

**Step 2: Wire new actions to tourSteps.ts**

In tourSteps.ts, update `onEnter` references:
- Step 3 (`find-campsites`): `onEnter: demoActions.showCampsitesAtNice`
- Step 4 (`add-campsite`): `onEnter: demoActions.addCampsitesToRoute`
- Step 5 (`toolkit`): `onEnter: undefined` (no action)
- Step 6 (`ready`): `onEnter: demoActions.closeAllPanels`

**Step 3: Run type-check**

Run: `npm run type-check`

**Step 4: Commit**

```bash
git add src/components/onboarding/demoActions.ts src/components/onboarding/tourSteps.ts
git commit -m "feat: update demo actions for 6-step onboarding tour"
```

---

## Task 3: Update TourTooltip for New Step Content

**Files:**
- Modify: `src/components/onboarding/TourTooltip.tsx`

**Step 1: Add Wrench icon import**

The `toolkit` step uses `iconKey: 'Wrench'`. Add `Wrench` to the Lucide icon imports in TourTooltip.tsx and add it to the icon mapping object.

**Step 2: Handle bullet list rendering for toolkit step**

The `toolkit` step has a body that includes a bullet list of tools. Add a new optional field `tools` to `SpotlightStep` type (array of `{ icon: string; label: string; description: string }`), and render it as a compact list below the body text in TourTooltip.

Alternatively, render the bullet list as part of the body using line breaks — simpler, keep the step data as plain text with newlines if the tooltip already renders multi-line text.

Check how TourTooltip currently renders the `body` field. If it's a simple `<p>` tag, add support for rendering a `tools` array as a `<ul>` list below the body.

**Step 3: Bump onboarding version**

Find the onboarding version constant (should be in OnboardingManager or a config file — search for `5.0` or `ONBOARDING_VERSION`). Bump from `5.0` to `6.0`.

**Step 4: Run type-check and manual test**

Run: `npm run type-check`
Manual test: `npm run dev` → load app → verify 6-step tour plays through correctly

**Step 5: Commit**

```bash
git add src/components/onboarding/
git commit -m "feat: update tooltip rendering and bump onboarding to v6.0"
```

---

## Task 4: Create ToolsMenu Component

**Files:**
- Create: `src/components/map/ToolsMenu.tsx`

**Step 1: Create the ToolsMenu component**

This is a dropdown/popover that replaces the 6-8 individual toolbar buttons.

Props:
```typescript
interface ToolsMenuProps {
  waypoints: Waypoint[];
  calculatedRoute: RouteResponse | null;
  // Panel toggle callbacks (same ones MapContainer currently uses)
  onToggleTripSettings: () => void;
  onToggleTripManager: () => void;
  onToggleVehicle: () => void;
  onToggleRouteInfo: () => void;
  onTogglePlanningTools: () => void;
  onToggleCostCalculator: () => void;
  onToggleRouteOptimizer: () => void;
  onClearRoute: () => void;
  // Active states
  activePanels: {
    tripSettings: boolean;
    tripManager: boolean;
    routeInfo: boolean;
    planningTools: boolean;
    costCalculator: boolean;
    routeOptimizer: boolean;
  };
}
```

Behaviour:
- Renders a single `w-10 h-10` button with a Wrench/Menu icon and "Tools" label
- On click, toggles a popover/dropdown positioned to the right of the button
- Menu items have icon + text label
- Items conditionally shown based on waypoint count / route state:
  - Trip Settings: always
  - Trip Manager: always
  - Vehicle Setup: always
  - Route Info: when `calculatedRoute` exists
  - Planning Tools: when `waypoints.length >= 2`
  - Cost Calculator: when `waypoints.length >= 2`
  - Route Optimizer: when `waypoints.length >= 3` and `FeatureFlags.ROUTE_OPTIMIZATION`
  - Divider
  - Clear Route: when `waypoints.length > 0` (red text)
- Close menu when an item is clicked
- Close menu when clicking outside (useEffect with document click listener)
- Each active panel gets a subtle indicator dot or left border

**Step 2: Run type-check**

Run: `npm run type-check`

**Step 3: Commit**

```bash
git add src/components/map/ToolsMenu.tsx
git commit -m "feat: create ToolsMenu dropdown component"
```

---

## Task 5: Create EmptyStateCard Component

**Files:**
- Create: `src/components/map/EmptyStateCard.tsx`

**Step 1: Create the EmptyStateCard component**

This shows when there are 0 waypoints and the onboarding tour is not active.

Props:
```typescript
interface EmptyStateCardProps {
  onOpenWizard: () => void;
  onSearchFocus: () => void;
}
```

Renders a centered card on the map:
- Headline: "Where are you starting from?"
- Subtext: "Search for an address, city, or campsite to begin planning your trip"
- A search input that, when clicked/focused, focuses the actual search bar at the top (calls `onSearchFocus`)
- "or" divider
- "Use the Trip Wizard for a guided setup" link (calls `onOpenWizard`)
- "Right-click the map to add a point directly" muted hint text
- Styling: `bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto`, absolutely positioned center of map

**Step 2: Commit**

```bash
git add src/components/map/EmptyStateCard.tsx
git commit -m "feat: create EmptyStateCard component for zero-waypoint state"
```

---

## Task 6: Create ContextualNudge Component

**Files:**
- Create: `src/components/ui/ContextualNudge.tsx`

**Step 1: Create the ContextualNudge component**

A small, dismissible toast that appears at the bottom of the map.

Props:
```typescript
interface ContextualNudgeProps {
  /** Unique key for localStorage persistence */
  nudgeId: string;
  /** The nudge message */
  message: string;
  /** Whether the trigger condition is met */
  show: boolean;
  /** Auto-dismiss after N ms (default 8000) */
  autoDismissMs?: number;
}
```

Behaviour:
- On mount, check `localStorage.getItem(`nudge-dismissed-${nudgeId}`)` — if truthy, never show
- When `show` becomes true and not dismissed, render the nudge
- Auto-dismiss after `autoDismissMs` (default 8000ms)
- X button to dismiss manually
- On dismiss (auto or manual), set localStorage key
- Styling: `fixed bottom-20 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-4 py-3 text-sm text-neutral-700 z-30 max-w-md`
- Subtle slide-up animation (respect `prefers-reduced-motion`)

**Step 2: Commit**

```bash
git add src/components/ui/ContextualNudge.tsx
git commit -m "feat: create ContextualNudge toast component"
```

---

## Task 7: Restructure MapContainer Toolbar

**Files:**
- Modify: `src/components/map/MapContainer.tsx` (lines 582-757 — left toolbar)

This is the largest single change. Break it into sub-steps.

**Step 1: Replace left toolbar button groups with ToolsMenu**

In MapContainer.tsx, replace lines 616-756 (everything in the left toolbar AFTER the undo/redo group and BEFORE the closing `</div>`) with:

```tsx
{/* Tools Menu */}
<ToolsMenu
  waypoints={waypoints}
  calculatedRoute={calculatedRoute}
  onToggleTripSettings={() => setShowTripSettings(!showTripSettings)}
  onToggleTripManager={() => setShowTripManager(!showTripManager)}
  onToggleVehicle={() => openVehicleSidebar()}
  onToggleRouteInfo={() => setShowRouteInfo(!showRouteInfo)}
  onTogglePlanningTools={() => setShowPlanningTools(!showPlanningTools)}
  onToggleCostCalculator={() => setShowCostCalculator(!showCostCalculator)}
  onToggleRouteOptimizer={() => setShowRouteOptimizer(!showRouteOptimizer)}
  onClearRoute={() => setShowConfirmClear(true)}
  activePanels={{
    tripSettings: showTripSettings,
    tripManager: showTripManager,
    routeInfo: showRouteInfo,
    planningTools: showPlanningTools,
    costCalculator: showCostCalculator,
    routeOptimizer: showRouteOptimizer,
  }}
/>

{/* Campsite Toggle — simple on/off */}
{FeatureFlags.CAMPSITE_DISPLAY && (
  <div className="flex flex-col items-center gap-1">
    <button
      data-tour-id="campsite-toggle"
      onClick={() => {
        const newVisible = !campsitesVisible;
        setCampsitesVisible(newVisible);
        if (!newVisible) {
          setShowCampsiteControls(false);
          setShowCampsiteFilter(false);
        }
      }}
      className={cn(
        "w-10 h-10 flex items-center justify-center rounded-lg shadow-md transition-colors",
        campsitesVisible
          ? "bg-green-600 text-white hover:bg-green-700"
          : "bg-white text-neutral-700 hover:bg-neutral-50"
      )}
      title={campsitesVisible ? "Hide campsites" : "Show campsites"}
      aria-label="Toggle campsites"
    >
      {/* Map pin icon */}
    </button>
    {campsitesVisible && (
      <button
        onClick={() => {
          setShowCampsiteFilter(!showCampsiteFilter);
        }}
        className="w-6 h-6 flex items-center justify-center rounded bg-white shadow-sm text-neutral-500 hover:text-neutral-700 transition-colors"
        title="Campsite settings & filters"
        aria-label="Open campsite filters"
      >
        {/* Gear icon */}
      </button>
    )}
  </div>
)}
```

Note: The campsite toggle is now a simple on/off. The 3-state cycle logic is removed. A small gear button appears below it when campsites are visible.

**Step 2: Add ToolsMenu import**

Add at top of MapContainer.tsx:
```typescript
import ToolsMenu from './ToolsMenu';
```

**Step 3: Add EmptyStateCard rendering**

Add after the map info overlay (around line 783), before the mobile toolbar:

```tsx
{/* Empty State Card — shown when no waypoints and tour not active */}
{!isTourActive && waypoints.length === 0 && (
  <EmptyStateCard
    onOpenWizard={() => {/* open trip wizard */}}
    onSearchFocus={() => {
      const searchInput = document.querySelector('[data-tour-id="search-bar"] input') as HTMLInputElement;
      searchInput?.focus();
    }}
  />
)}
```

Add import for EmptyStateCard.

**Step 4: Add ContextualNudge instances**

Add after the EmptyStateCard block:

```tsx
{/* Contextual Nudges */}
<ContextualNudge
  nudgeId="first-waypoint"
  message="Add a second stop to calculate your route — search above or toggle campsites to browse."
  show={!isTourActive && waypoints.length === 1}
/>
<ContextualNudge
  nudgeId="route-ready"
  message="Your route is ready! Open the Tools menu for vehicle setup, cost estimates, and daily stages."
  show={!isTourActive && waypoints.length >= 2 && !!calculatedRoute}
/>
<ContextualNudge
  nudgeId="campsites-on"
  message="Zoom in to see individual campsites. Click any marker for details."
  show={!isTourActive && campsitesVisible}
/>
```

Add import for ContextualNudge.

**Step 5: Run type-check**

Run: `npm run type-check`

**Step 6: Commit**

```bash
git add src/components/map/MapContainer.tsx
git commit -m "feat: restructure MapContainer toolbar with ToolsMenu and EmptyStateCard"
```

---

## Task 8: Refactor MapControlsPanel into Overflow Menu

**Files:**
- Modify: `src/components/map/MapControlsPanel.tsx`

**Step 1: Split into always-visible and overflow**

Keep Zoom +/- and Zoom-to-fit as always-visible buttons (current lines 86-128).

Move Reset View, Layer Control, Fullscreen, and Keyboard Shortcuts into a dropdown triggered by a "⋮" (three-dot) button.

Structure:
```
[Zoom +]
[Zoom -]
[Zoom to fit]
[⋮] ← clicks opens dropdown with:
  - Reset to Europe view
  - Toggle layer control
  - Fullscreen
  - Keyboard shortcuts
```

**Step 2: Run type-check**

Run: `npm run type-check`

**Step 3: Commit**

```bash
git add src/components/map/MapControlsPanel.tsx
git commit -m "feat: collapse secondary map controls into overflow menu"
```

---

## Task 9: Update Search Result Button Hierarchy

**Files:**
- Modify: `src/components/search/UnifiedSearch.tsx` (lines 532-554 for location results, lines 626-631 for campsite results)

**Step 1: Restyle "Go" and "+ Add" buttons**

For location results (around line 532-554):

Change "Go" button styling from:
```
px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 rounded font-medium transition-colors
```
to:
```
px-2 py-1 text-xs text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 rounded transition-colors
```

Change "+ Add" button styling from:
```
px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded font-medium hover:bg-primary-200 transition-colors
```
to:
```
px-2.5 py-1 text-xs bg-primary-600 text-white rounded font-medium hover:bg-primary-700 transition-colors
```

For campsite results (around line 626-631): Same pattern — make "+ Add" the filled primary button, "Go" becomes muted.

Add `title` attributes:
- "Go" button: `title="View on map without adding to route"`
- "+ Add" button: `title="Add this location to your route"`

**Step 2: Commit**

```bash
git add src/components/search/UnifiedSearch.tsx
git commit -m "feat: make + Add primary action in search results"
```

---

## Task 10: Implement Panel Mutual Exclusion

**Files:**
- Modify: `src/components/map/MapContainer.tsx`

**Step 1: Create closeAllPanels helper**

Add a `closeAllPanels` function inside MapContainer (or extract to a custom hook):

```typescript
const closeAllPanels = useCallback(() => {
  setShowTripSettings(false);
  setShowTripManager(false);
  setShowPlanningTools(false);
  setShowCostCalculator(false);
  setShowRouteInfo(false);
  setShowRouteOptimizer(false);
  setShowCampsiteDetails(false);
  setShowCampsiteFilter(false);
}, []);
```

**Step 2: Update all panel open handlers**

Each panel toggle should call `closeAllPanels()` before opening:

```typescript
const toggleTripSettings = useCallback(() => {
  if (showTripSettings) {
    setShowTripSettings(false);
  } else {
    closeAllPanels();
    setShowTripSettings(true);
  }
}, [showTripSettings, closeAllPanels]);
```

Apply this pattern to all panel toggles: TripSettings, TripManager, PlanningTools, CostCalculator, RouteInfo, RouteOptimizer.

Update the ToolsMenu callbacks to use these new toggle functions instead of the simple `setShow*(!show*)` pattern.

**Step 3: Run type-check**

Run: `npm run type-check`

**Step 4: Commit**

```bash
git add src/components/map/MapContainer.tsx
git commit -m "feat: add panel mutual exclusion — one panel at a time"
```

---

## Task 11: Remove UserGuidance and Clean Up

**Files:**
- Modify/Delete: `src/components/ui/UserGuidance.tsx`
- Modify: Any file that imports UserGuidance

**Step 1: Find all UserGuidance imports**

Run: `grep -r "UserGuidance" src/`

**Step 2: Remove UserGuidance from all parent components**

Remove the `<UserGuidance />` JSX and its import from wherever it's rendered (likely MapContainer or App).

**Step 3: Delete or gut UserGuidance.tsx**

If no other code depends on it, delete the file. If other components reference its types, gut it to an empty component.

**Step 4: Remove old campsite 3-state toggle CSS**

If there are any CSS-in-JS or Tailwind utilities specifically for the old 3-state cycle, clean them up.

**Step 5: Run type-check and lint**

Run: `npm run type-check && npm run lint`

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove UserGuidance, clean up old campsite toggle styles"
```

---

## Task 12: Manual Testing & Polish

**Step 1: Full onboarding test**

Run: `npm run dev`

Clear localStorage (`localStorage.clear()` in console) and reload.

Verify:
- [ ] 6-step tour plays through correctly
- [ ] Step 3 shows campsites at Nice area
- [ ] Step 4 shows full London-Lyon-Nice route
- [ ] Step 5 spotlights the Tools menu area
- [ ] Demo data clears on "Start Planning"
- [ ] Escape key skips tour and clears demo data
- [ ] Back button works on all steps

**Step 2: Empty state test**

After tour completes:
- [ ] Empty state card appears ("Where are you starting from?")
- [ ] Clicking search input in card focuses top search bar
- [ ] Trip Wizard link opens wizard modal
- [ ] Card disappears after first waypoint added

**Step 3: Toolbar test**

- [ ] Only 4 buttons visible: Undo, Redo, Tools, Campsites
- [ ] Tools menu opens and shows correct items based on state
- [ ] Menu items open correct panels
- [ ] Only one panel open at a time

**Step 4: Campsite toggle test**

- [ ] Single click turns campsites on (green button)
- [ ] Second click turns campsites off (white button)
- [ ] Gear icon appears when campsites are on
- [ ] Gear opens filter/settings panel

**Step 5: Search results test**

- [ ] "+ Add" is visually prominent (filled blue button)
- [ ] "Go" is muted (text-only)
- [ ] Both have correct tooltips

**Step 6: Contextual nudges test**

- [ ] First waypoint nudge appears at 1 waypoint
- [ ] Route ready nudge appears at 2+ waypoints with route
- [ ] Campsite nudge appears when toggled on first time
- [ ] Nudges auto-dismiss after ~8 seconds
- [ ] Nudges don't reappear after dismissal (check localStorage)
- [ ] X button dismisses nudge

**Step 7: Fix any issues found, commit**

```bash
git add -A
git commit -m "fix: polish UX overhaul based on manual testing"
```

---

## Task 13: Build Verification

**Step 1: Run full build**

Run: `npm run build`

Expected: Build succeeds with no errors.

**Step 2: Run tests**

Run: `npm test`

Expected: All existing tests pass (or known failures only). If any test references old onboarding step IDs, update them.

**Step 3: Run lint**

Run: `npm run lint`

**Step 4: Preview production build**

Run: `npm run preview`

Manual smoke test of the production build.

**Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: resolve build/test issues from UX overhaul"
```
