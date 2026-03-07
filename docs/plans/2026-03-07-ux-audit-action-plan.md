# UX Audit Action Plan — March 7, 2026

Comprehensive UX audit of camperplanning.com across all features, interactions,
pages, and viewports.

**Status:** ✅ COMPLETE — 24 of 28 issues fixed in PR #24 (merged March 7,
2026). 4 items deferred (C4 full i18n rollout, N4/N6/N7/N8 low-impact polish).

## Audit Scope

- Desktop (1280x800), Mobile (375x812), Tablet (768x1024)
- All 15 areas: first impressions, onboarding, search, map, routing, planning
  tools, trip wizard, vehicle settings, trip management, content pages,
  responsive design, loading states, accessibility, i18n, PWA

---

## CRITICAL — Broken functionality or data loss risk

### C1. ✅ Trip loading is a stub — waypoints not restored to map

- **Where:** `MapContainer.tsx:1250-1254`
- **What:** `onTripLoad` callback ignores the trip argument and just closes the
  panel. Waypoints are NOT restored. Users can save trips but never load them
  back onto the map.
- **Fix:** Implement `onTripLoad` to restore waypoints to `useRouteStore`,
  vehicle profile to `useVehicleStore`, and trip settings to
  `useTripSettingsStore`.

### C2. ✅ Trip wizard "Create Trip" silently overwrites existing route

- **Where:** `TripWizard.tsx:141-187`
- **What:** `handleCreateTrip` calls `routeStore.reorderWaypoints(newWaypoints)`
  which replaces any existing waypoints without warning.
- **Fix:** Add a confirmation dialog ("This will replace your current route.
  Continue?") when waypoints already exist.

### C3. ✅ Closing trip wizard loses all work with no confirmation

- **Where:** `TripWizard.tsx:228-235`
- **What:** Clicking X calls `resetWizard()` immediately. A user halfway through
  planning loses everything.
- **Fix:** Add "Are you sure?" confirm dialog when wizard has been partially
  completed (any step beyond welcome).

### C4. ⏳ DEFERRED — i18n: Only 6 of ~50+ components use translations

- **Where:** Entire codebase (see i18n audit below for full list)
- **What:** When a German user selects "Deutsch", only the header, search
  placeholder, and empty state translate. ALL planning tools, vehicle panel,
  campsite details, routing, cost calculator, trip manager, and trip wizard
  remain in English.
- **Fix:** Systematic `useTranslation()` rollout across all user-facing
  components. Add ~200+ new translation keys to en.ts and de.ts.

---

## MAJOR — Poor UX that frustrates users or causes confusion

### M1. ✅ No Back button on wizard itinerary step

- **Where:** `TripWizard.tsx:282-304`
- **What:** Footer nav (Back/Next buttons) is hidden on the itinerary step. The
  progress bar is clickable but non-obvious. Users can't go back to edit dates
  or driving preferences.
- **Fix:** Show the Back button on the itinerary step (just hide the Next
  button).

### M2. ✅ Saved trip cost/duration estimates are fictional

- **Where:** `TripManager.tsx:209-213`
- **What:** `estimatedDuration = Math.ceil(waypoints.length / 2)` and
  `estimatedCost = 100 * waypoints.length`. A 3-waypoint trip shows "150 days"
  and "€300". These figures are shown on every saved trip card.
- **Fix:** Use actual route distance/time from `useRouteStore` and
  `CostCalculationService` if available, else show "Not calculated" instead of
  wrong numbers.

### M3. ✅ Templates tab always empty with no explanation

- **Where:** `TripManager.tsx:170-177`
- **What:** Templates service is disabled. The tab shows "Trip Templates (0)"
  with search/filter controls but zero content and no "coming soon" message.
- **Fix:** Either hide the Templates tab entirely, or show a "Templates coming
  soon" message with the tab.

### M4. ✅ `document.documentElement.lang` never updates on language switch

- **Where:** `index.html` (hardcoded `lang="en"`), no listener in App.tsx
- **What:** Screen readers pronounce German text with English phonology. Browser
  features dependent on `lang` attribute (hyphenation, spell-check) use wrong
  language.
- **Fix:** Add
  `i18n.on('languageChanged', lng => { document.documentElement.lang = lng; })`
  in App.tsx or main.tsx.

### M5. ✅ ConfirmDialog missing modal ARIA attributes

- **Where:** `src/components/ui/ConfirmDialog.tsx`
- **What:** No `role="dialog"`, `aria-modal="true"`, or `aria-labelledby`. Focus
  is not trapped inside the dialog. Screen reader users cannot identify or
  navigate the modal.
- **Fix:** Add `role="dialog"`, `aria-modal="true"`,
  `aria-labelledby="confirm-dialog-title"`, and focus trap.

### M6. ✅ "Make trip public" checkbox is misleading

- **Where:** `TripManager.tsx:1214-1225`
- **What:** Label says "Make trip public (for future sharing features)". There
  is no backend. Users may think sharing is available.
- **Fix:** Remove the checkbox entirely until sharing is implemented.

### M7. ✅ Vehicle "Clear" button has no confirmation dialog

- **Where:** `VehicleProfilePanel.tsx:724-745`
- **What:** "Clear" destroys the entire saved vehicle profile instantly with no
  confirmation. One mis-click loses all settings.
- **Fix:** Add ConfirmDialog before clearing ("This will remove your saved
  vehicle profile. Continue?").

### M8. ✅ Import panel always shows "not yet implemented" error

- **Where:** `RouteExporter.tsx:236`
- **What:** Users can drag files into the import drop zone, but
  `handleFileUpload` always throws "Import functionality not yet implemented".
  No prior warning.
- **Fix:** Add a "Coming soon" badge/overlay on the import section, or disable
  the drop zone.

### M9. ✅ Campsite details enrichment has no loading indicator

- **Where:** `MapContainer.tsx:442-446`, `CampsiteDetails.tsx`
- **What:** When clicking an unnamed campsite, the panel opens with a raw OSM ID
  as the name. Reverse geocoding happens silently in the background. No spinner,
  no "Fetching location..." placeholder.
- **Fix:** Pass `isEnriching` flag to CampsiteDetails, show subtle skeleton/
  loading text in the address area during enrichment.

### M10. ✅ Route optimization error is only a toast — no persistent state

- **Where:** `RouteOptimizer.tsx:120`
- **What:** If optimization fails, a toast notification appears and auto-
  dismisses. No persistent error message in the panel. Users may miss it.
- **Fix:** Add local `optimizationError` state rendered inline below the
  optimize button.

### M11. ✅ Trip delete uses browser `window.confirm()` not styled dialog

- **Where:** `TripManager.tsx:311`
- **What:** `window.confirm()` is visually inconsistent with the rest of the app
  which uses ConfirmDialog. Generic message doesn't name the trip.
- **Fix:** Use ConfirmDialog with the trip name in the message.

### M12. ✅ No empty state when wizard finds no campsites for a day

- **Where:** `TripWizard.tsx:1104-1163`
- **What:** If no campsites are found for a day, the "Overnight Options" section
  is simply absent. No explanation.
- **Fix:** Show "No campsites found near this route segment" message.

---

## MINOR — Polish issues, visual inconsistencies, nice-to-haves

### N1. ✅ Footer says "European Camper Planner" but header says "CamperPlanning.com"

- **Where:** `Footer.tsx:22-29` vs `Header.tsx`
- **Fix:** Align to "CamperPlanning.com" everywhere.

### N2. ✅ Planning Tools opens on "Daily Plan" tab instead of "Overview"

- **Where:** `PlanningTools.tsx:64`
- **Fix:** Change default tab to "Overview".

### N3. ✅ Non-functional Settings icon in Planning Tools header

- **Where:** `PlanningTools.tsx:236-238`
- **What:** `<Settings>` icon is not wrapped in a button, no onClick. Looks
  clickable but does nothing.
- **Fix:** Either make it open trip settings, or remove it.

### N4. ⏳ DEFERRED — Opaque metric scores (variety, difficulty, feasibility) with no tooltips

- **Where:** `PlanningTools.tsx:669-693`
- **Fix:** Add tooltip or info icon explaining what each score means.

### N5. ✅ Orphaned bullet separator when no start date is set

- **Where:** `PlanningTools.tsx:469`
- **What:** Renders " • 247km" with leading bullet when date is undefined.
- **Fix:** Conditionally render bullet only when date is present.

### N6. ⏳ DEFERRED — Saved vehicle profile always shows metric values regardless of unit toggle

- **Where:** `VehicleProfilePanel.tsx:676-686`
- **Fix:** Display saved values in the user's selected unit system.

### N7. ⏳ DEFERRED — Vehicle Save button disabled when form is unmodified — feels broken

- **Where:** `VehicleProfilePanel.tsx:692-697`
- **Fix:** Show a subtle "No changes to save" tooltip, or change button label to
  "No changes".

### N8. ⏳ DEFERRED — Routing impact explanation is below the fold in vehicle panel

- **Where:** `VehicleProfilePanel.tsx:749-753`
- **Fix:** Move the tip above the Save/Clear buttons, or add a brief note at the
  top of the panel.

### N9. ✅ `Intl.NumberFormat('en-EU')` is invalid BCP47 locale

- **Where:** `CostCalculator.tsx:203`, `TripManager.tsx:524`
- **Fix:** Use `'en-GB'` or `i18n.language`.

### N10. ✅ `text-neutral-500` on white fails AA contrast (3.8:1)

- **Where:** `CostCalculator.tsx:225`, `PlanningTools.tsx:351,383`
- **Fix:** Change to `text-neutral-600` (passes at ~4.5:1+).

### N11. ✅ Multiple ARIA gaps across components

- **Where:** Various (see accessibility audit)
- Includes: missing `aria-expanded` on collapsible buttons, vehicle tab ARIA
  pattern, mobile menu `aria-expanded`, inline SVGs without `aria-hidden`.
- **Fix:** Systematic pass to add proper ARIA attributes.

### N12. ✅ Search campsite error silently swallowed

- **Where:** `UnifiedSearch.tsx:300-303`
- **Fix:** Set `searchError` in the catch block.

### N13. ✅ Cost calculator has no retry button on error

- **Where:** `TripCostCalculator.tsx`
- **Fix:** Add "Try again" button in the error box.

### N14. ✅ Trip Manager has no retry buttons for load/save errors

- **Where:** `TripManager.tsx` error banner
- **Fix:** Add retry callbacks to the error banner.

### N15. ✅ Trip Manager initial load has no loading state

- **Where:** `TripManager.tsx:131-135`
- **Fix:** Set `isLoading(true)` before the load calls.

### N16. ✅ Mobile menu missing Settings and Feedback links

- **Where:** `Header.tsx` mobile menu
- **Fix:** Add Settings and Feedback to the hamburger menu.

### N17. ✅ `TripCostCalculator.tsx` is dead code (unused component)

- **Where:** `src/components/planning/TripCostCalculator.tsx`
- **Fix:** Delete the file to reduce bundle size and confusion.

### N18. ✅ FR/ES/IT stub languages show no indicator they're incomplete

- **Where:** `LanguageSelector.tsx`
- **Fix:** Add "(Beta)" or "(Partial)" suffix for stub languages.

### N19. ✅ LanguageSelector has no Escape key handler to close dropdown

- **Where:** `LanguageSelector.tsx`
- **Fix:** Add `onKeyDown` handler for Escape.

### N20. ✅ `formatDate` uses hardcoded `'en-US'` locale

- **Where:** `PlanningTools.tsx:147`
- **Fix:** Use `i18n.language` for locale-aware date formatting.

### N21. ✅ Wizard date validation: return date before departure is accepted

- **Where:** `TripWizard.tsx:638-651`
- **Fix:** Add `endDate > startDate` check to `canProceed`.

### N22. ✅ Trip wizard `place_id` set to array index (non-unique React keys)

- **Where:** `TripWizard.tsx:333-339`
- **Fix:** Use the actual Nominatim `place_id` or generate unique IDs.

### N23. ⏳ DEFERRED — Campsite control bar overlaps left toolbar

- **Where:** `SimpleCampsiteLayer.tsx`, `MapContainer.tsx`
- **Fix:** Adjust positioning to avoid overlap.

---

## Implementation Priority Order

### Batch 1 — Critical fixes ✅ COMPLETE

1. ✅ C1: Implement trip loading
2. ✅ C2: Add overwrite confirmation to wizard
3. ✅ C3: Add close confirmation to wizard

### Batch 2 — Major UX fixes ✅ COMPLETE

4. ✅ M1: Add Back button to wizard itinerary step
5. ✅ M2: Fix fictional trip cost/duration estimates
6. ✅ M3: Hide empty Templates tab (removed entirely)
7. ✅ M5: Add ARIA to ConfirmDialog
8. ✅ M6: Remove "Make trip public" checkbox
9. ✅ M7: Add confirmation to vehicle Clear
10. ✅ M8: Replace import drop zone with "Coming Soon" message
11. ✅ M9: Add enrichment loading indicator
12. ✅ M10: Add persistent optimization error state
13. ✅ M11: Replace window.confirm with ConfirmDialog for trip delete

### Batch 3 — i18n & a11y fundamentals ✅ COMPLETE

14. ✅ M4: Fix `document.documentElement.lang`
15. ✅ N9: Fix invalid `Intl.NumberFormat` locale → `'en-GB'`
16. ✅ N10: Fix contrast failures → `text-neutral-600`
17. ✅ N11: ARIA pass (ConfirmDialog role/aria-modal/labelledby)
18. ✅ N20: Fix hardcoded date locale → `i18n.language`

### Batch 4 — Polish & cleanup ✅ COMPLETE (20 of 23 items)

19-23: Footer branding (N1), dead code removal (N17), language Beta labels
(N18), Escape key handlers (N19), date validation (N21), unique keys (N22),
search error handling (N12), default tab fix (N2), settings icon removal (N3),
orphan bullet fix (N5), mobile menu (N16), retry buttons (N13, N14, N15).

### Deferred items (6 items)

- ⏳ C4: Full i18n rollout — large effort, separate PR recommended
- ⏳ N4: Metric score tooltips — low user impact
- ⏳ N6: Vehicle unit toggle in saved profile — low user impact
- ⏳ N7: Save button disabled tooltip — low user impact
- ⏳ N8: Routing tip positioning — low user impact
- ⏳ N23: Campsite control bar overlap — deferred from Feb audit

### Files modified in PR #24

`TripWizard.tsx`, `TripManager.tsx`, `MapContainer.tsx`, `PlanningTools.tsx`,
`VehicleProfilePanel.tsx`, `RouteExporter.tsx`, `RouteOptimizer.tsx`,
`CostCalculator.tsx`, `RouteCalculator.tsx`, `UnifiedSearch.tsx`,
`ConfirmDialog.tsx`, `LanguageSelector.tsx`, `Footer.tsx`, `main.tsx`,
`PlannerPage.tsx`, `FeedbackPage.tsx`, `store/index.ts`, `TripWizardService.ts`,
`sitemap.xml`
