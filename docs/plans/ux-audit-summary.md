# UX Audit Summary — February 2026

## Scope

End-to-end visual and interaction audit of camperplanning.com across three
viewports:

- **Desktop:** 1280x800
- **Mobile:** 375x812
- **Tablet:** 768x1024

Pages audited: Planner (empty, with waypoints, all panels), Blog list, Blog
post, Support, About, Help, Settings, Privacy, Terms, Affiliate Disclosure,
Feedback.

## Findings

8 issues identified (0 Critical, 4 Major, 4 Minor). See
`docs/plans/ux-audit-issues.md` for full details.

## Fixes Applied

### UX-001 — EmptyStateCard stays visible when search active [MAJOR] — FIXED

- **File:** `src/components/map/MapContainer.tsx`
- **Fix:** Added `isSearchActive` state. EmptyStateCard is hidden when the
  search bar gains focus via the fake search bar click. Prevents confusing
  layering of search results over the card.

### UX-002 — Ko-fi iframe clipped on desktop [MAJOR] — FIXED

- **File:** `src/pages/SupportPage.tsx`
- **Fix:** Increased iframe `max-width` from `400px` to `480px`. "Buy a Coffee
  for camperplanning.com" now fully visible at all viewport widths.

### UX-003/004 — Blog page overflow at mobile and tablet [MAJOR] — FIXED

- **Files:** `src/components/layout/MainLayout.tsx`,
  `src/pages/BlogListPage.tsx`
- **Root cause:** Flexbox `min-width: auto` on the `<main>` element prevented it
  from shrinking below the intrinsic content width, causing horizontal overflow
  on narrow viewports.
- **Fix:** Added `min-w-0 overflow-x-hidden` to the `<main>` element in
  `MainLayout.tsx`. Added `overflow-x-hidden` to the category tabs sticky
  container in `BlogListPage.tsx` to contain the `-mx-4` negative margin bleed.
  Page content now stays within viewport at all breakpoints.

### UX-005 — Planning Tools "Analysis" tab truncated [MINOR] — FIXED

- **File:** `src/components/planning/PlanningTools.tsx`
- **Fix:** Renamed "Analysis" tab to "Stats" (shorter label) and reduced tab
  padding from `px-4` to `px-3`. Tabs now fit without truncation.

### UX-006 — Route debug info shown to users [MINOR] — FIXED

- **Files:** `src/components/routing/RouteInformation.tsx`,
  `src/components/routing/RouteCalculator.tsx`
- **Fix:** Removed the routing provider name ("Osrm") from the Route Summary
  header in `RouteInformation.tsx`, removed the "Last updated: HH:MM:SS"
  timestamp display, and removed the service name badge from the Route
  Calculation panel in `RouteCalculator.tsx`. All were internal debug
  information not useful to end users.

### UX-007 — Campsite control bar overlaps left toolbar [MINOR] — DEFERRED

- **Reason:** Low-impact cosmetic overlap. Fix requires reworking z-index
  layering between campsite controls and the left toolbar, which is complex
  relative to the severity. Deferred to a future pass.

### UX-008 — Support link missing from mobile menu [MINOR] — FIXED

- **File:** `src/components/layout/Header.tsx`
- **Fix:** Added "Support" link to the mobile hamburger dropdown menu,
  positioned after "Help". Uses the same active-state styling as other menu
  items.

## Verification

All fixes verified with:

- `tsc --noEmit` — zero type errors
- `eslint --max-warnings 0` — zero lint warnings
- `npm run build` — production build succeeds (58 assets precached)
- Visual verification via Playwright browser at mobile (375x812), tablet
  (768x1024), and desktop (1280x800) viewports

## Result

| Status    | Count |
| --------- | ----- |
| Fixed     | 7     |
| Deferred  | 1     |
| **Total** | **8** |

All 4 Major issues resolved. 3 of 4 Minor issues resolved. 1 Minor issue
(UX-007) deferred.
