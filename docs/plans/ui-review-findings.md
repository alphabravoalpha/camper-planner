# UI Review Findings — camperplanning.com

**Date:** March 7, 2026 **Reviewer:** Claude (automated UI review) **Site:**
https://camperplanning.com (production) **Breakpoints tested:** Desktop
(1280px), Tablet (768px), Mobile (375px)

---

## Executive Summary

The site delivers a strong core experience — the map-first planner is fast,
search works well, and blog content is high quality. However, **one critical
z-index bug blocks the trip-saving workflow**, and several major UX issues
degrade the experience at tablet breakpoints. Internationalization coverage is
at ~5%, making the German language option feel incomplete. The console shows
excessive API error spam during viewport resizing due to missing debounce on
route recalculation.

**Totals:** 4 Critical, 7 Major, 10 Minor, 5 Nit/Info

---

## Full Issue Log

### Critical (C) — Blocks core functionality or causes data loss

| #   | Area              | Issue                                                                                                                                                                                                                                                                                           | Breakpoint      | Fix                                                                                                      |
| --- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------- |
| C1  | Trip Manager      | **"Continue Planning" button overlaps "Save Trip" / "Cancel" buttons** — the floating "Continue Planning" CTA (z-index) sits on top of the Trip Manager panel's action buttons. Clicking "Save Trip" actually opens the Trip Wizard instead. Users cannot save trips.                           | Desktop, Tablet | Lower z-index of Continue Planning button, or hide it when Trip Manager panel is open                    |
| C2  | Route Calculation | **Massive ORS error spam on viewport resize** — resizing the browser fires route recalculation with no debounce, causing 70+ "OpenRouteService failed, trying fallback" errors per resize session. Burns through the 2,000 req/day ORS quota rapidly.                                           | All             | Add debounce (300–500ms) to resize-triggered route recalculation                                         |
| C3  | i18n              | **~5% translation coverage** — switching to German (DE) translates only the header nav, tagline, and search placeholder. All other UI (route panel, vehicle setup, planning tools, trip manager, status bar, beta banner, waypoint labels) remains in English. Makes the DE option feel broken. | All             | Either complete DE translations for all visible UI, or hide the language switcher until coverage is >80% |
| C4  | Trip Manager      | **Empty state references removed "template" feature** — Trip Manager shows "Start a new trip from scratch or using a template" but the Templates tab was removed in the UX audit. Dead copy misleads users.                                                                                     | Desktop         | Remove "or using a template" from the empty state text                                                   |

### Major (M) — Significantly degrades UX

| #   | Area           | Issue                                                                                                                                                                                                                                  | Breakpoint     | Fix                                                                                                                      |
| --- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| M1  | Navigation     | **Two identical hamburger icons at tablet (768px)** — left hamburger is "Toggle sidebar" (non-functional with 0 waypoints), right hamburger is "Toggle menu" (nav). Both look identical (three horizontal lines). Extremely confusing. | Tablet         | Hide sidebar toggle on tablet when there are no waypoints, or differentiate the icons                                    |
| M2  | Waypoints      | **"Waypoint 0" zero-indexed naming** — waypoints display as "Waypoint 0", "Waypoint 1" instead of human-friendly "Waypoint 1", "Waypoint 2" or reverse-geocoded place names (e.g., "London", "Paris")                                  | All            | Use 1-indexed naming, or display reverse-geocoded city/address                                                           |
| M3  | Planning Tools | **Distance discrepancy** — Route panel shows 620.9km but Planning Tools overview shows 340km for the same London→Paris route. Likely the planning tools excludes the channel crossing portion, but no explanation is given.            | Desktop        | Either unify the distance values or add a note explaining the difference (e.g., "driving distance only, excludes ferry") |
| M4  | Mobile         | **FAB (+) button obscures "Clear" in bottom toolbar** — the teal floating action button sits directly on top of the "Clear" label in the bottom navigation bar, making it unreadable and difficult to tap                              | Mobile (375px) | Adjust FAB position or bottom nav layout to prevent overlap                                                              |
| M5  | Mobile         | **FAB partially obscures "Tools" label** — same FAB overlaps with the "Tools" text in the bottom toolbar                                                                                                                               | Mobile (375px) | Same fix as M4                                                                                                           |
| M6  | Desktop Header | **"Support" link missing from desktop header nav** — the footer has "Support This Project" but the header nav only shows: Trip Planner, Guides, About, Help. Mobile nav correctly includes Support.                                    | Desktop        | Add "Support" to desktop header nav, or at minimum ensure consistent navigation across breakpoints                       |
| M7  | Planning Tools | **Feasibility text truncated** — Planning Tools overview shows "Challeng..." instead of "Challenging" for trip feasibility rating. The container doesn't allocate enough width.                                                        | Desktop        | Widen the feasibility badge or use shorter labels (e.g., "Hard")                                                         |

### Minor (N) — Noticeable polish issues

| #   | Area              | Issue                                                                                                                                                                                                                     | Breakpoint | Fix                                                                       |
| --- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------- |
| N1  | Blog              | **Tags displayed as URL slugs** — article tags show "cote-d-azur", "route-planning", "southern-france" instead of human-readable "Cote d'Azur", "Route Planning", "Southern France"                                       | Desktop    | Transform slug to title case, or store display names in article data      |
| N2  | Blog              | **Double dashes instead of em dashes** — blog article text uses "--" (double hyphen) instead of "—" (em dash) throughout. Visible in article body text, e.g., "5--7 days"                                                 | Desktop    | Replace "--" with "—" in blog article data files                          |
| N3  | Navigation        | **Footer says "Travel Guides" vs header says "Guides"** — inconsistent naming for the same section                                                                                                                        | All        | Unify to one name across header and footer                                |
| N4  | Language Selector | **No visual confirmation of language change** — after switching language, the dropdown closes but there's no toast/feedback confirming the change occurred                                                                | All        | Consider a brief toast: "Language changed to Deutsch"                     |
| N5  | Search            | **Search history persists after clearing localStorage** — the search dropdown shows "Recent Searches" (London, SW1A 1AA, Barcelona) from previous sessions. Expected for returning users, but may confuse during testing. | All        | Not a bug — working as designed. Consider adding a "Clear history" option |
| N6  | Map               | **Waypoint labels overlap at low zoom** — "Waypoint 0" and "Waypoint 1" labels + route distance badge all cluster together when zoomed out to show both UK and France                                                     | Desktop    | Auto-hide labels at low zoom levels, or use collision detection           |
| N7  | Route Panel       | **"Route ready for export" shown with no prior context** — the export status line appears in the route panel even when the user hasn't expressed intent to export. Takes up space.                                        | Desktop    | Only show after user clicks export, or make it more subtle                |
| N8  | Beta Banner       | **Beta banner not translated** — "This site is in beta testing — your feedback is extremely useful!" remains in English even when language is set to German                                                               | All        | Add beta banner text to i18n translation files                            |
| N9  | Status Bar        | **Status bar not translated** — "2 waypoints · Ready" stays in English in DE mode                                                                                                                                         | All        | Add status bar text to i18n translation files                             |
| N10 | Vehicle Panel     | **"Setup Vehicle" button not translated** — remains English in DE mode, visible in header                                                                                                                                 | All        | Add to i18n translations                                                  |

### Nit / Informational (I)

| #   | Area          | Issue                                                                                                                    | Breakpoint | Notes                                                                    |
| --- | ------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------ |
| I1  | Accessibility | **7 `role="button"` divs missing `aria-label`** — found by codebase audit of component files                             | All        | Add descriptive aria-labels                                              |
| I2  | Accessibility | **SVG icons missing `aria-hidden="true"`** — decorative icons should be hidden from screen readers                       | All        | Add `aria-hidden="true"` to decorative SVGs                              |
| I3  | Accessibility | **Toggle buttons missing `aria-pressed`** — campsite toggle, auto-calculate toggle lack pressed state for screen readers | All        | Add `aria-pressed` attribute                                             |
| I4  | Performance   | **Lighthouse Performance: 76** — good but not great. Main bottleneck is likely map tile loading and JS bundle size       | Desktop    | Consider lazy-loading non-critical panels, code-splitting map components |
| I5  | Console       | **Chrome extension noise** — 10 "asynchronous response" errors from browser extensions, not app code                     | All        | Non-actionable — browser extension artifacts                             |

---

## Improvement Action Plan

### Immediate (fix before next deploy)

1. **Fix C1: Continue Planning z-index overlap** — this blocks the save-trip
   workflow entirely. Either conditionally hide "Continue Planning" when any
   right panel is open, or give it a lower z-index than panels.
2. **Fix C4: Remove template reference** — simple text change in TripManager
   empty state.

### Short-term (next sprint)

3. **Fix C2: Debounce route recalculation on resize** — add a 300–500ms debounce
   to prevent API spam. This protects the 2,000/day ORS quota.
4. **Fix M1: Two hamburger icons** — hide sidebar toggle at tablet when no
   waypoints exist, or change sidebar icon to a different icon (e.g., panel
   icon).
5. **Fix M2: 1-index waypoints** — change from 0-indexed to 1-indexed naming.
   Ideally reverse-geocode to city names.
6. **Fix M4/M5: Mobile FAB overlap** — reposition FAB or adjust bottom nav
   padding.
7. **Fix M7: Feasibility truncation** — widen badge or use shorter labels.

### Medium-term (next month)

8. **Fix C3: i18n coverage** — either invest in translating all visible UI to DE
   (estimated 500+ strings), or temporarily hide the language switcher until
   ready.
9. **Fix M3: Distance discrepancy** — add explanatory note or unify calculation.
10. **Fix M6: Desktop nav consistency** — add Support link to desktop header.
11. **Fix N1/N2: Blog polish** — transform tag slugs to display names, replace
    "--" with em dashes.

### Deferred

12. **I1–I3: Accessibility gaps** — add missing aria-labels, aria-hidden,
    aria-pressed across components.
13. **I4: Performance optimization** — code-split and lazy-load for better
    Lighthouse score.

---

## Positive Observations

- **Map-first design is excellent** — planner loads instantly into a
  full-viewport map with search bar, exactly what users expect
- **Search UX is polished** — grouped results (Locations vs Campsites), recent
  search history, popular destinations, geolocation button, debounced input with
  Enter-to-search
- **Blog content quality is high** — detailed, practical articles with route
  suggestions, warning callouts, campsite recommendations, and CTAs linking back
  to the planner
- **Channel crossing detection works well** — correctly identifies UK→France
  routes and suggests ferry/tunnel options
- **Route calculation is fast** — London→Paris in seconds, with clear
  distance/time display
- **Language selector UX is clean** — "(Beta)" labels for incomplete
  translations set correct expectations
- **Mobile nav is well-organized** — bottom toolbar (Vehicle, Sites, Route,
  Tools, Clear) gives quick access to key features
- **Footer is comprehensive** — all legal pages, support links, affiliate
  disclosure present
- **404 page works** — custom branded page with navigation back to the app
- **Onboarding tour system is robust** — 6-step spotlight tour with demo data,
  no API calls during tour
- **ConfirmDialog pattern is reusable** — consistent confirmation modals with
  proper ARIA support
- **PWA capable** — offline caching, install prompt present
- **Accessible color contrast** — `text-neutral-600` on white meets WCAG AA
  after the March audit fix

---

## Non-UI Observations

### API Resilience

- OpenRouteService fallback to OSRM works correctly — route still calculates
  when ORS fails
- However, the volume of retry attempts during resize events suggests the
  fallback path is too eager — should debounce first

### SEO

- Page titles are descriptive and unique per route
- Blog articles have proper breadcrumbs, structured data likely present
- Sitemap at `/sitemap.xml` covers all pages

### Data Persistence

- Zustand state persists across page navigation correctly — route, waypoints,
  vehicle profile all survive page transitions
- Search history persists in localStorage as expected

### Monetization

- Blog CTA "Start Planning This Route" links back to planner — good funnel
- Affiliate disclosure in footer on every page — compliant
- "Research This Campsite" (free links) separated from "Book This Campsite"
  (affiliate) — ethical design

### Code Quality (from agent analysis)

- 392 tests passing, 86% service coverage — solid test foundation
- TypeScript strict mode enforced
- ESLint + Prettier + Husky pre-commit hooks in place
- Well-structured service layer with caching, rate limiting, and fallback
  strategies
