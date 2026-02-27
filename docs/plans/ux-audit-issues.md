# UX Audit Issues — February 2026

Audit performed across Desktop (1280x800), Mobile (375x812), and Tablet
(768x1024) viewports against the live production site at camperplanning.com.

## Severity Legend

- **Critical**: Blocks core functionality or creates a broken user experience
- **Major**: Significant visual or interaction problem that degrades UX
- **Minor**: Cosmetic or low-impact issue
- **Nitpick**: Polish items, not required for this pass

---

## Issues

### UX-001 — EmptyStateCard stays visible when search is active [MAJOR]

- **Viewport:** Desktop (1280x800)
- **Page:** Planner (empty state)
- **Description:** Clicking the fake search bar on EmptyStateCard focuses the
  real search bar at top, but the EmptyStateCard remains visible underneath.
  When typing, search results dropdown overlays on top of the card, creating a
  confusing layered UI. Bottom search results are partially obscured by the
  card's "or" divider.
- **Expected:** EmptyStateCard should hide/fade when the search bar is focused
  or has input.
- **File:** `src/components/map/EmptyStateCard.tsx`,
  `src/components/map/MapContainer.tsx`

### UX-002 — Ko-fi iframe clipped on Support page (desktop) [MAJOR]

- **Viewport:** Desktop (1280x800)
- **Page:** /support
- **Description:** The Ko-fi embedded iframe widget is clipped on the left side
  — text reads "offee for planning.com" instead of "Coffee for
  camperplanning.com". The iframe container width is too narrow at desktop
  widths.
- **Expected:** Ko-fi iframe should display fully without clipping.
- **Note:** Renders correctly on mobile (375px). Issue is desktop-specific.
- **File:** `src/pages/SupportPage.tsx`

### UX-003 — Blog card grid overflows viewport at tablet width [MAJOR]

- **Viewport:** Tablet (768x1024)
- **Page:** /guides
- **Description:** The 2-column blog card grid has the right-column cards
  extending beyond the right edge of the viewport. Card titles, descriptions,
  and images are clipped. "Vehicle Guides" category filter pill also clipped.
- **Expected:** Blog card grid should be fully contained within viewport at all
  breakpoints.
- **File:** `src/pages/BlogListPage.tsx`, `src/components/blog/BlogCard.tsx`

### UX-004 — Blog hero heading truncated on mobile [MAJOR]

- **Viewport:** Mobile (375x812)
- **Page:** /guides
- **Description:** Hero heading "European Camper Travel..." is truncated at the
  right edge instead of wrapping. Subtitle text also clips. Blog card titles
  below are similarly truncated.
- **Expected:** All text should wrap within the viewport on mobile.
- **File:** `src/pages/BlogListPage.tsx` or `src/components/blog/BlogHero.tsx`

### UX-005 — Planning Tools "Analysis" tab text truncated [MINOR]

- **Viewport:** Desktop (1280x800)
- **Page:** Planner (Planning Tools panel open)
- **Description:** The "Analysis" tab in the Planning Tools panel is truncated
  to "Analysi..." — tab container is too narrow.
- **File:** `src/components/planning/PlanningTools.tsx`

### UX-006 — Route Calculation panel shows debug info [MINOR]

- **Viewport:** Desktop (1280x800)
- **Page:** Planner (with route calculated)
- **Description:** Route Calculation panel displays "Osrm" as the routing
  provider name and "Last updated: 22:50:14" timestamp — both are debug/internal
  info that shouldn't be shown to users.
- **File:** `src/components/routing/RouteInformation.tsx`

### UX-007 — Campsite control bar overlaps left toolbar [MINOR]

- **Viewport:** Desktop (1280x800)
- **Page:** Planner (campsites toggled on)
- **Description:** When campsites are toggled on, the campsite info/control bar
  at the top-left of the map overlaps with the left toolbar buttons.
- **File:** `src/components/campsite/SimpleCampsiteLayer.tsx`,
  `src/components/map/MapContainer.tsx`

### UX-008 — "Support" link missing from mobile hamburger menu [MINOR]

- **Viewport:** Mobile (375x812)
- **Page:** All pages (header)
- **Description:** The desktop header includes a "Support" navigation link, but
  the mobile hamburger dropdown does not include it. Users on mobile cannot
  easily navigate to the Support page from the header.
- **File:** `src/components/layout/Header.tsx`

---

## Summary

| Severity  | Count |
| --------- | ----- |
| Critical  | 0     |
| Major     | 4     |
| Minor     | 4     |
| **Total** | **8** |

## Fix Priority

1. UX-001 (EmptyStateCard/search interaction)
2. UX-002 (Ko-fi iframe clipping)
3. UX-003 (Blog grid overflow at tablet)
4. UX-004 (Blog hero text truncation on mobile)
5. UX-005 (Planning Tools tab truncation)
6. UX-006 (Route debug info)
7. UX-007 (Campsite bar overlap)
8. UX-008 (Mobile menu Support link)
