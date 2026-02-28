# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

This is the **European Camper Trip Planner** - a free, comprehensive camper trip
planning platform for European travelers. The project aims to fill the gap left
by North American-focused paid tools (RV LIFE, Roadtrippers) by providing a
zero-cost, privacy-first solution.

## Development Status

**Current Status:** LIVE IN PRODUCTION at camperplanning.com **Custom Domain:**
camperplanning.com (GitHub Pages, DNS via Squarespace) — live with HTTPS
**Monetization:** Booking.com (via CJ, pending), Eurocampings (via
TradeTracker), camping.info (via Awin), Amazon Associates UK + Ko-fi donations
(live, embedded on Support page) **Last Updated:** February 28, 2026 (campsite
data enrichment)

## Technology Stack (Implemented)

- **Frontend:** React 18.2 + Vite 7.1 + TypeScript 5.8
- **Mapping:** Leaflet.js 1.9 + React-Leaflet 4.2
- **State Management:** Zustand 4.4 with persistence
- **Styling:** Tailwind CSS 3.3 with custom utilities
- **Routing API:** OpenRouteService (primary), OSRM (backup)
- **Data Sources:** Overpass API (OSM), Nominatim geocoding
- **Internationalization:** React-i18next 13.0
- **Testing:** Vitest 1.0 + React Testing Library
- **Code Quality:** ESLint 9.36 + Prettier 3.0 + Husky pre-commit hooks +
  lint-staged
- **PWA:** vite-plugin-pwa (Workbox service worker, offline caching, install
  prompt)
- **Hosting:** GitHub Pages at camperplanning.com (custom domain via Squarespace
  DNS)
- **Monetization:** BookingService (affiliate links) + Ko-fi (donations)
- **Analytics:** Cloudflare Web Analytics (server-side) + localStorage analytics
  with consent
- **SEO:** Open Graph, Twitter Cards, JSON-LD structured data, SEOHead per page,
  sitemap.xml

## Development Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Build for production
npm run build:prod       # Production build with optimizations
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues automatically
npm run format           # Format code with Prettier
npm run format:check     # Check Prettier formatting
npm run type-check       # TypeScript type checking

# Testing
npm test                 # Run tests
npm test:ui              # Run tests with UI
npm test:coverage        # Run tests with coverage report

# Deployment
npm run deploy           # Deploy to GitHub Pages

# Git Hooks (via Husky)
# Pre-commit: lint-staged runs ESLint + Prettier on staged files
# Configured in .husky/pre-commit and package.json lint-staged config
```

## Architecture Principles

### 1. Future-Proof Foundation

Build V1 as if V2 already exists, just disabled. Components should be
enhanceable, not replaceable.

### 2. Configuration-Driven Development

Features are enabled/disabled via feature flags. V2 features are consolidated in
`v2-features/` directory.

### 3. Privacy-First Design

- Local storage primary (browser as database)
- No user tracking or accounts required
- Exportable data (users own their information)
- Zero monthly hosting costs

### 4. Progressive Enhancement

- Static site capable
- Works offline once loaded
- Graceful degradation when APIs fail

## Component Architecture

### Actual Implemented Structure

```
/src/components/
├── map/                 # ✅ Phase 1-2: Map interface (10 components)
│   ├── MapContainer.tsx
│   ├── WaypointManager.tsx
│   ├── RouteDisplay.tsx
│   ├── MapControls.tsx
│   └── ... (6 more)
├── routing/             # ✅ Phase 3: Route planning (12 components)
│   ├── RoutePlanner.tsx
│   ├── RouteOptimizer.tsx
│   ├── RouteInfo.tsx
│   └── ... (9 more)
├── campsite/            # ✅ Phase 4: Campsite integration (11 components)
│   ├── SimpleCampsiteLayer.tsx
│   ├── CampsiteFilter.tsx
│   ├── CampsiteMarker.tsx
│   └── ... (8 more)
├── planning/            # ✅ Phase 5: Planning tools (8 components)
│   ├── CostCalculator.tsx
│   ├── TripManager.tsx
│   ├── OptimizationPanel.tsx
│   └── ... (5 more)
├── ui/                  # ✅ Reusable UI (14 components)
│   ├── Button.tsx
│   ├── Modal.tsx
│   ├── Tooltip.tsx
│   ├── UserGuidance.tsx
│   └── ... (10 more)
├── layout/              # ✅ App layout (9 components, includes Footer)
├── search/              # ✅ Unified search
├── wizard/              # ✅ Trip planning wizard
├── onboarding/          # ✅ User onboarding
├── analytics/           # ✅ Usage analytics
└── feedback/            # ✅ User feedback system
```

### Service Layer (All Implemented)

All external APIs are abstracted through service classes:

- **RoutingService** - OpenRouteService integration with vehicle restrictions
- **CampsiteService** - Overpass API for OSM campsite data (35KB, full
  implementation) with overlap-aware caching, tiered queries, route prefetching,
  extended OSM tag parsing (30+ tags), reverse geocoding for unnamed campsites,
  Wikimedia Commons image resolution, data completeness tiers
  (minimal/basic/detailed)
- **CampsiteFilterService** - Advanced campsite filtering and search
- **CampsiteOptimizationService** - Campsite recommendation algorithms
- **RouteOptimizationService** - TSP solver for multi-stop optimization
- **TripPlanningService** - Duration estimation and itinerary planning (27KB)
- **TripStorageService** - Local storage with schema versioning
- **CostCalculationService** - Fuel cost and trip budgeting
- **GPXExportService** - GPX export for GPS devices
- **RouteExportService** - Multi-format route export (29KB)
- **MultiFormatExportService** - JSON/KML/other formats
- **BookingService** - Affiliate link generation (Booking.com, Eurocampings,
  camping.info) — wired to CampsiteDetails UI
- **TripWizardService** - Trip planning wizard with itinerary generation
- **DataService** - Base service with caching and rate limiting

**V2 features** are consolidated in `v2-features/` at project root (see
`v2-features/README.md`).

## Development Phases

**Phases must be completed sequentially. Current: Phase 6**

### Phase 1: Foundation ✅ COMPLETE

- ✅ React app initialized with Vite
- ✅ Core dependencies configured (React Router, Leaflet, Zustand, Tailwind)
- ✅ App shell and navigation working
- ✅ Feature flags system operational
- ✅ Path aliases configured (@/components, @/services, etc.)

### Phase 2: Core Mapping ✅ COMPLETE

- ✅ Interactive map with OpenStreetMap tiles
- ✅ Click-to-add waypoints with drag reordering
- ✅ Waypoint management and persistence
- ✅ Map controls (zoom, pan, fullscreen)
- ✅ Mobile-responsive map interactions

### Phase 3: Vehicle & Routing ✅ COMPLETE

- ✅ Vehicle profile configuration UI
- ✅ OpenRouteService integration with vehicle restrictions
- ✅ Route calculation and display
- ✅ Turn-by-turn directions
- ✅ Route distance and time estimation

### Phase 4: Campsite Integration ✅ COMPLETE

- ✅ Overpass API integration for campsite data
- ✅ Campsite display with clustering
- ✅ Advanced filtering (type, amenities, distance)
- ✅ Performance optimization for large datasets
- ✅ Caching and rate limiting implemented

### Phase 5: Planning Tools ✅ COMPLETE

- ✅ Route optimization algorithms (TSP solver)
- ✅ Cost calculation (fuel estimation, trip budgeting)
- ✅ Trip management (save, load, manage multiple trips)
- ✅ Planning tools (duration estimation, itinerary planning)
- ✅ Local storage with schema versioning

### Phase 6: Export & Polish ✅ COMPLETE

- ✅ GPX export service implemented (ahead of schedule)
- ✅ Multi-format export (JSON, KML)
- ✅ User onboarding (passive guided tour — click-through feature overview)
- ✅ Error handling improvements (user-friendly messages, retry mechanisms)
- ✅ Mobile experience polish (haptic feedback, touch optimization, bottom
  sheets)
- ✅ Performance optimization (bundle reduced to ~300KB gzipped)
- ✅ Design system (comprehensive design tokens)
- ✅ Loading states (skeleton loaders for all major components)
- ✅ Accessibility (focus indicators, keyboard navigation, reduced motion
  support)
- ✅ Launch preparation (testing, cross-browser, performance audit)

### Phase 7: Monetization & Launch Infrastructure ✅ COMPLETE

- ✅ Footer component with legal links, affiliate disclosure, donation button
- ✅ Legal pages: Privacy Policy (GDPR), Terms of Use, Affiliate Disclosure
  (FTC/ASA)
- ✅ Support/Donate page with Ko-fi embedded inline (iframe widget)
- ✅ BookingService wired to CampsiteDetails UI (Booking.com affiliate via CJ)
- ✅ AFFILIATE_LINKS feature flag enabled in features.ts
- ✅ GitHub Actions CI/CD configured with affiliate ID secrets
- ✅ Custom domain (camperplanning.com) configured — CNAME, base path, router
  basename
- ✅ SEO: meta tags, Open Graph, Twitter Cards, JSON-LD structured data
- ✅ sitemap.xml and robots.txt
- ✅ Settings page made functional (data summary, export, clear data)
- ✅ Header updated with Support navigation link
- ✅ About page updated with affiliate transparency and support section

## Key Constraints

### V1 Scope Control

**SCOPE CONTROL RULE:** Any feature not explicitly listed in
`docs/02-feature-requirements.md` requires separate approval before
implementation.

### Explicitly Excluded from V1

- User accounts or cloud synchronization
- Real-time traffic or weather data
- Complex affiliate tracking (simple link generation is V1, advanced booking is
  V2)
- Advanced booking integration (availability checks, price comparison — V2)
- Community features (reviews, sharing)

### API Integration Notes

- **Rate Limiting:** Client-side throttling required (OpenRouteService:
  2,000/day, Nominatim: 1/second)
- **Fallback Strategy:** Multiple backup services configured for each API
- **Caching:** Aggressive local caching to minimize API calls
- **Error Handling:** Graceful degradation when services unavailable

## Data Architecture

### Local Storage Schema

Designed for evolution - V1 data must migrate cleanly to V2. All trip data
stored locally with version tracking for schema migration.

### Vehicle Restrictions

Core feature differentiator - routes must respect:

- Height (bridges, tunnels)
- Weight (road limits)
- Width (narrow roads)
- Length (turning radius)

## Development Philosophy

### Core Principles

1. **Quality AND Delivery** - Ship quality features with strategic testing.
   Perfect is the enemy of done.
2. **Strategic Testing** - Test business logic thoroughly (services), validate
   critical paths, manual test the rest.
3. **Build-Test-Ship Cycle** - Build feature → Manual test → Fix bugs → Ship.
   Iterate based on real usage.
4. **Focus on Impact** - Prioritize features users need over features that might
   be nice.
5. **Plan for Growth** - V1 decisions must support V2/V3 goals without
   architectural rewrites.
6. **Zero Ongoing Costs** - Leverage free tiers and static hosting to maintain
   sustainability.
7. **Privacy by Design** - No tracking, local storage primary, user data
   ownership.

### Development Standards

**Code Quality:**

- TypeScript strict mode, no `any` types
- ESLint and Prettier compliance
- Comprehensive error handling
- Clear, documented code

**Testing Strategy (Pragmatic):**

- **Services**: 80% coverage minimum (CRITICAL - business logic) ✅ ACHIEVED:
  86%
- **Critical UI**: 30-40% coverage (map, waypoints, core interactions)
- **Integration**: 5 key user workflows (E2E tests with Playwright)
- **Manual**: Pre-launch validation (browsers, devices, accessibility)
- **Everything else**: Manual testing during development, fix bugs as found

**Testing Tiers:**

1. MUST TEST: Services (86% coverage, 392 tests) ✅ COMPLETE
2. SHOULD TEST: Critical components (MapContainer, WaypointManager)
3. CAN SKIP: Simple UI (buttons, forms) - manual verification only
4. PRE-LAUNCH: 5 integration tests + cross-browser/device validation

**Before Moving to Next Phase:**

- [ ] Core features implemented and working
- [ ] Service layer tested (business logic validated)
- [ ] Critical paths manually tested
- [ ] Documentation updated
- [ ] No critical bugs in core workflows
- [ ] User feedback incorporated

**Never:**

- Ship features with untested business logic (services MUST have tests)
- Skip manual testing of user-facing features
- Ignore obvious bugs to meet deadlines
- Break existing functionality without fixing it
- Launch without validating critical user workflows

## Important Files

- `docs/01-project-vision.md` - Project goals and market positioning
- `docs/02-feature-requirements.md` - Detailed V1 scope and exclusions
- `docs/03-technical-architecture.md` - System design and component structure
- `docs/04-development-roadmap.md` - Phase-by-phase implementation plan
- `docs/05-data-sources-api-spec.md` - API integration specifications

### Monetization & Legal Pages

- `src/pages/HelpPage.tsx` - User guide with 4-step walkthrough, 8 FAQs, pro
  tips, tutorial restart
- `src/pages/SupportPage.tsx` - Ko-fi donation page (embedded iframe widget)
- `src/pages/PrivacyPolicyPage.tsx` - GDPR-compliant privacy policy
- `src/pages/TermsPage.tsx` - Terms of use (England & Wales law)
- `src/pages/AffiliateDisclosurePage.tsx` - FTC/ASA affiliate disclosure
- `src/components/layout/Footer.tsx` - Site footer (hidden on planner, shown on
  content pages)
- `src/config/features.ts` - Feature flags (AFFILIATE_LINKS: true, ANALYTICS:
  true, ADVANCED_BOOKING: false)
- `src/services/BookingService.ts` - Affiliate link generation (Booking.com,
  Eurocampings, camping.info)
- `src/utils/analytics.ts` - Privacy-first localStorage analytics (enabled by
  default, data never leaves browser)
- `src/components/blog/GearLink.tsx` - Affiliate product link component

### SEO & Domain

- `index.html` - Meta tags, OG tags, Twitter Cards, JSON-LD structured data,
  Cloudflare Web Analytics script
- `src/components/seo/SEOHead.tsx` - Per-page dynamic meta tags (title,
  description, canonical, noindex, article JSON-LD)
- `public/CNAME` - Custom domain: camperplanning.com
- `public/sitemap.xml` - 20 URLs (auto-generated at build via
  `scripts/generate-sitemap.ts`); excludes noindex pages
- `public/robots.txt` - Allow all, disallow /settings
- `.env.local.example` - Documented affiliate env var template

### CI/CD

- `.github/workflows/gh-pages.yml` - Deploys to GitHub Pages with affiliate
  secrets from GitHub Secrets

### UX Audit & Quality Documentation

- `docs/plans/ux-audit-issues.md` - Full UX audit issue log (8 issues across
  desktop/mobile/tablet)
- `docs/plans/ux-audit-summary.md` - Fix summary with verification results
- `docs/plans/lighthouse-results.md` - Lighthouse audit results (Perf 76, A11y
  100, Best Practices 96, SEO 100)

### Search UX Research

- `docs/research/search-ux-comparison.md` - Competitive analysis of search UX
  across Google Maps, Booking.com, Rome2Rio, Park4Night, and Campendium (9
  dimensions, 9 ranked recommendations)

## Current Development Priority: Post-Launch Growth

### Current Status: LIVE IN PRODUCTION

**Site is live at camperplanning.com.** All core features working.

**Technical Summary:**

- 14,109+ lines of code written
- **392 service tests** (100% pass rate) ✅
- **86% service coverage** (12/14 services tested) ✅
- **7 critical bugs fixed** during testing ✅
- Production build succeeds with all new pages code-split ✅

### Launch Checklist (Completed)

1. ✅ **Squarespace DNS configured** — camperplanning.com pointing to GitHub
   Pages
2. ✅ **HTTPS enabled** in GitHub Pages settings
3. ✅ **Ko-fi account created** — ko-fi.com/camperplanning (embedded on Support
   page)
4. ✅ **Booking.com affiliate applied** — via CJ (Commission Junction), awaiting
   approval
5. ⏳ **Add `BOOKING_AFFILIATE_ID` as GitHub Secret** — once CJ/Booking.com
   approves
6. ✅ **Amazon Associates UK** — tag `camperplann04-21` wired into gear guide
   links
7. 📋 **camping.info via Awin** — sign up for Awin, apply to camping.info
   campaign (5.8% commission)
8. 📋 **Eurocampings via TradeTracker** — sign up, apply to Eurocampings
   campaign (3% commission)
9. ✅ **OG social sharing image** created (1200×633px PNG) at
   `public/og-image.png`, wired into `index.html` OG and Twitter Card tags

### Post-Launch Priorities

**Immediate:**

- Monitor for bugs via GitHub Issues
- Add Booking.com affiliate ID once CJ approval comes through
- ~~Check Google Search Console for indexing~~ ✅ Set up
- Drive initial traffic to build stats for future partnerships

**Short-term:**

- ~~Performance audit with Lighthouse~~ ✅ Done — Perf 76 (structural, map tile
  LCP), A11y 100, BP 96, SEO 100. See `docs/plans/lighthouse-results.md`
- ~~Full WCAG AA compliance validation~~ ✅ Lighthouse Accessibility 100/100
- ~~User guide / FAQ documentation~~ ✅ Done — `HelpPage.tsx` with step-by-step
  guide, 8 FAQs, pro tips, tutorial restart
- Monitor Ko-fi donations and affiliate conversion
- Approach Pitchup directly once traffic numbers are established

**Medium-term (V2 considerations):**

- Advanced booking integration (availability, price comparison)
- Community features (trip sharing, reviews)
- Multi-language content pages
- ~~Progressive Web App (PWA) support~~ ✅ Implemented (Feb 25, 2026)

## Recent Updates (February 28, 2026)

### Campsite Data Enrichment

Campsite detail cards were frequently sparse and unusable — many showed only an
OSM ID as name, 0/10 amenities, no address, and "No booking links available".
Research confirmed no public APIs from Park4Night, ADAC, or similar platforms.
Solution: extract more from OSM data we already receive, add reverse geocoding,
Wikimedia photos, and "Find on" links to information platforms.

**Design doc:** `docs/plans/2026-02-28-campsite-data-enrichment-design.md`
**Implementation plan:**
`docs/plans/2026-02-28-campsite-data-enrichment-plan.md`

**Files modified:** `CampsiteService.ts`, `CampsiteDetails.tsx`,
`SimpleCampsiteLayer.tsx`, `MapContainer.tsx`, `CampsiteService.test.ts` (new),
`BookingService.test.ts`, `CampsiteFilterService.test.ts`,
`CampsiteOptimizationService.test.ts`

- **Extended Campsite interface:** Added 15+ new fields — `stars`,
  `description`, `operator`, `imageUrl`, `policies` (dogs/fires/bbq/nudism),
  `capacityDetails`, `powerSupply`, `structuredAddress`, `dataCompleteness`
  tier, 6 new amenity booleans (sanitary_dump_station, waste_disposal,
  hot_water, kitchen, picnic_table, bbq)
- **Extended OSM tag parsing:** `parseOSMElement` now extracts 30+ tags
  including `stars`, `description:en`, `operator`, `dog`, `openfire`, `bbq`,
  `nudism`, `capacity:*`, `power_supply`, `addr:*`, `image`, `wikimedia_commons`
- **Wikimedia Commons photos:** `resolveImageUrl()` constructs thumbnail URLs
  from `wikimedia_commons` or `image` tags. ~10-15% of European campsites have
  image tags. Hero image displayed at top of CampsiteDetails with lazy loading
  and error fallback
- **Data completeness tiers:** `calculateDataCompleteness()` classifies
  campsites as `detailed` (name + 3+ amenities + contact + hours), `basic`
  (name + 1 amenity or contact), or `minimal`. Drives display logic and sort
  order
- **Reverse geocoding:** `reverseGeocode()` and `enrichCampsiteWithLocation()`
  methods. On-demand when user clicks a campsite marker — unnamed campsites
  ("campsite 1903123151") become "Campsite near {town}, {region}". Respects
  Nominatim 1 req/sec rate limit
- **"Research This Campsite" section:** External links to Park4Night (reviews),
  Google Maps (photos/Street View), PiNCAMP/ADAC (inspection ratings). Separate
  from affiliate "Book This Campsite" section to protect revenue
- **Hidden empty sections:** 0 amenities, no contact info, and no booking links
  are now hidden rather than displayed as empty. "Limited data" amber banner
  with OSM edit link shown for `minimal` tier campsites
- **Compact map popup:** Redesigned popup with photo thumbnail, star rating, max
  6 amenity chips, "Limited data" hint, two-button layout (Add to Route + View
  Details). Removed verbose vehicle badge, contact info, and debug footer
- **Completeness-based sort:** `filterAndScoreCampsites` now sorts by
  completeness tier first (detailed > basic > minimal), then by proximity to map
  center within each tier
- **Async enrichment on click:** `handleCampsiteClick` in MapContainer.tsx is
  now async — shows detail card immediately, then enriches unnamed/addressless
  campsites via reverse geocoding in the background

### Campsite Marker Performance (9 Optimizations)

Campsite markers were taking 2-15 seconds to appear after map movement. Applied
9 complementary optimizations across 5 files to reduce perceived load time to
0.5-4 seconds.

**Files modified:** `CampsiteIcons.ts`, `SimpleCampsiteLayer.tsx`,
`MapContainer.tsx`, `CampsiteService.ts`, `RouteCalculator.tsx`

- **Icon memoization** (`CampsiteIcons.ts`): Map-based cache (max 200 entries)
  keyed by visual properties (type, amenity, selection state, size). Avoids
  rebuilding SVG HTML on every render. Cluster icons cached by child count.
- **O(n) grid-based clustering** (`SimpleCampsiteLayer.tsx`): Replaced O(n²)
  brute-force Haversine distance comparison with spatial grid hashing. Cell size
  adapts to zoom level. Merges adjacent cells via 8-neighbor lookup.
- **Campsites default to ON** (`MapContainer.tsx`): `campsitesVisible` initial
  state changed from `false` to `true` — markers load immediately at zoom >= 7.
- **Overlap-aware cache** (`CampsiteService.ts`): Tracks `lastLoadedBounds` and
  `lastLoadedCampsites`. When 70%+ of new viewport overlaps previous load,
  reuses cached data and only fetches gap strips via `computeGapRegions()`.
- **Tighter bounding box** (`SimpleCampsiteLayer.tsx`): 10% buffer around
  viewport bounds (was over-fetching). Pan threshold reduced from 30% to 20%
  since overlap-aware cache handles incremental loads.
- **Tiered Overpass queries** (`CampsiteService.ts`): Primary query fetches core
  types only (camp_site, caravan_site, aire). Secondary query (relations,
  wilderness huts, highway rest areas) fires in background after 2-second delay
  to respect Overpass 2 req/s rate limit.
- **Route corridor prefetching** (`RouteCalculator.tsx` + `CampsiteService.ts`):
  `prefetchForRoute()` warms the cache along the route geometry immediately
  after route calculation completes.
- **Progressive batched rendering** (`SimpleCampsiteLayer.tsx`): Renders 80
  markers per animation frame via `requestAnimationFrame`. Prevents UI jank when
  hundreds of markers load simultaneously.
- **Improved loading indicator** (`SimpleCampsiteLayer.tsx`): Shows count of
  campsites found so far plus progressive rendering progress bar.

### Search UX Improvements

Research-driven search improvements based on competitive analysis of 5 major
travel/mapping sites (Google Maps, Booking.com, Rome2Rio, Park4Night,
Campendium). Research documented in `docs/research/search-ux-comparison.md`.

**Files modified:** `CampsiteService.ts`, `UnifiedSearch.tsx`,
`MapContainer.tsx`

- **Cleaner location results:** Added `subtitle` field to GeocodeResult built
  from Nominatim address components ("Catalonia, Spain" instead of full
  display_name). Fallback chain: state/county + country, then last 2 parts of
  display_name
- **Smart zoom with boundingbox:** Location selection now uses `map.fitBounds()`
  with Nominatim's `boundingbox` instead of fixed zoom=10. Countries zoom out
  (~5-6), cities zoom to ~12, villages zoom tighter. Store synced via
  `map.once('moveend')`
- **Viewport-biased geocoding:** Added `viewbox` parameter to
  `geocodeLocationMultiple()` — passes current map bounds to Nominatim with
  `bounded=0` (soft bias, not restriction)
- **Contextual empty state:** Search dropdown now shows on focus even with no
  history — displays guidance text, popular destination chips (Barcelona, Lake
  Garda, Provence, Algarve, Norwegian Fjords, Tuscany), and "Use my current
  location" button
- **Popular destinations fallback:** No-results state now shows clickable
  destination chips instead of just "Try a different search term"
- **"Use my location" in dropdown:** Geolocation button in search dropdown (10s
  timeout, 5-min cache). Shows in both guidance state and at bottom of search
  history
- **Auto-show campsites on search:** Selecting a location from search now
  automatically enables campsite markers on the map (`campsitesVisible = true`
  in `MapContainer.onLocationSelect`)
- **Fixed dead sort code:** Sort in `geocodeLocationMultiple()` was operating on
  raw API response after a return statement — moved to chain on `.map()`

## Previous Updates (February 27, 2026)

### Lighthouse Audit & Fixes (PR #13)

- Full Lighthouse audit: Performance 76, Accessibility 100, Best Practices 96,
  SEO 100
- Performance gap is structural (map tile LCP 5.8s — inherent to map-centric SPA
  on GitHub Pages)
- Fixes applied: lazy-loaded MapContainer, preconnect to tile subdomains, DNS
  prefetch for Overpass, image width/height attributes, font display:optional
- Accessibility fixes: heading order in BlogCard, footer contrast, descriptive
  link text
- Results documented in `docs/plans/lighthouse-results.md`

### Brand Identity Refresh (PR #14)

- Replaced all logos, favicons, and illustration assets with consistent brand
  identity
- Updated `public/og-image.png` (1200×633), `public/logo.png`,
  `public/favicon.png`, PWA icons (`pwa-192x192.png`, `pwa-512x512.png`)

### UX Audit & Fixes (PR #15)

End-to-end UX audit across desktop (1280×800), mobile (375×812), and tablet
(768×1024) viewports. 8 issues identified, 7 fixed:

- **EmptyStateCard overlap** (Major): Card now hides when search bar is focused
  via `isSearchActive` state in `MapContainer.tsx`
- **Ko-fi iframe clipping** (Major): Widened max-width from 400px to 480px in
  `SupportPage.tsx`
- **Blog horizontal overflow** (Major): Fixed flexbox min-width bug with
  `min-w-0 overflow-x-hidden` on `<main>` in `MainLayout.tsx` +
  `overflow-x-hidden` on category tabs in `BlogListPage.tsx`
- **Planning Tools tab truncation** (Minor): Renamed "Analysis" → "Stats",
  reduced padding `px-4` → `px-3` in `PlanningTools.tsx`
- **Route debug info exposed** (Minor): Removed service name ("Osrm") and
  timestamp from `RouteCalculator.tsx` and `RouteInformation.tsx`
- **Mobile menu missing Support** (Minor): Added Support link to hamburger menu
  in `Header.tsx`
- **Deferred:** UX-007 campsite control bar overlap (low-impact cosmetic)

## Previous Updates (February 26, 2026)

### Analytics & Measurement

- Cloudflare Web Analytics integrated in `index.html` (privacy-first, no
  cookies, GDPR-compliant aggregate stats only)
- V2 localStorage analytics framework enabled (`src/utils/analytics.ts`) with
  localStorage analytics (`src/utils/analytics.ts`)
- Feature tracking wired into PlannerPage (route calculations),
  SimpleCampsiteLayer (campsite searches), CampsiteDetails (affiliate clicks)
- `ANALYTICS: true` feature flag added to `src/config/features.ts`
- Analytics data viewable, exportable, and clearable in Settings page
- All analytics data stays in browser localStorage — never sent to any server

### SEO Completeness

- `SEOHead` component added to all 13 pages with unique title, description, and
  canonical URL per page
- `noindex` set on Settings, NotFound, and MapTest pages
- Sitemap priorities updated: blog posts 0.7, legal pages 0.3
- Sitemap excludes noindex pages (Settings, NotFound, MapTest)
- SEOHead supports `type: 'article'` with JSON-LD Article schema for blog posts

### Monetisation Expansion

- Monetisation research completed (`docs/plans/monetisation-research.md`):
  identified 5 viable affiliate programmes (Eurocampings via TradeTracker,
  camping.info via Awin, Amazon Associates UK, Awin general travel, Booking.com
  via CJ)
- Non-viable programmes removed: Pitchup (no public programme), ACSI (sells
  guides not bookings), Campsy (acquired/defunct)
- BookingService updated: removed Pitchup and ACSI providers, added Eurocampings
  and camping.info with affiliate link generation
- New blog article: "Essential Gear for Your European Campervan Adventure"
  (`src/data/blog/essential-campervan-gear.ts`) — 11th blog post
- New `GearLink` component (`src/components/blog/GearLink.tsx`) for affiliate
  product links with `rel="sponsored noopener noreferrer"`
- Privacy Policy updated with Cloudflare Analytics and localStorage analytics
  disclosures
- Affiliate Disclosure updated: removed Pitchup/ACSI, added Eurocampings,
  camping.info, and Amazon Associates

## Previous Updates (February 25, 2026)

### Quality & Infrastructure Improvements (Batches 1-5)

**CI/CD Quality Gates (Batch 1 — PR #8):**

- Husky pre-commit hooks with lint-staged (ESLint + Prettier on staged files)
- CI pipeline now enforces zero lint warnings before deploy
- E2E tests (Playwright) run post-deploy against live site
- Quality checks: type-check → lint → tests → build → deploy → verify → E2E

**Lint & Accessibility Cleanup (Batch 2 — PR #12):**

- Fixed 100+ ESLint warnings across 83+ files (zero warnings remaining)
- Added jsx-a11y accessibility rules (htmlFor/id pairs, keyboard handlers, ARIA
  roles)
- Replaced all `any` types with proper TypeScript types
- ESLint config enhanced with jsx-a11y plugin

**Blog Images Self-Hosted (Batch 3 — PR #10):**

- All 10 blog hero images self-hosted in `public/images/blog/`
- Replaced broken Unsplash CDN URLs with local copies
- Blog cards and hero components use `<img>` with fallback handling

**Bug Fixes (Batch 4 — PR #9):**

- Bug #6: Trip calculation fixed (route now calculates properly)
- Bug #5: Feedback page "Back to planner" uses browser back navigation
- Bug #4: Feedback iframe has loading state and fallback link
- All 3 GitHub issues closed

**PWA & Offline Support (Batch 5 — PR #11):**

- `vite-plugin-pwa` configured with Workbox service worker
- App manifest with icons for install prompt
- Offline caching: precache app shell, runtime cache for API responses + images
- `OfflineNotice` component shows banner when connection is lost
- 55 assets precached for offline use

**Build Pipeline Fix:**

- Build script changed from `tsc -b && vite build` to `vite build` (type-check
  runs separately in CI)
- Sitemap auto-generated at build time via `scripts/generate-sitemap.ts` (19
  URLs)

## Previous Updates (February 11, 2026)

### Production Launch & Monetization Setup

- Site went live at camperplanning.com with HTTPS
- Ko-fi account created and embedded inline on Support page (replaced redirect
  button with iframe widget)
- Booking.com affiliate application submitted via CJ (Commission Junction) —
  awaiting approval
- Pitchup has no affiliate programme — will approach directly once site has
  traffic
- ACSI affiliate programme not a fit (sells guides, not campsite bookings)
- Onboarding rewritten: replaced interactive setup wizard with passive guided
  tour (no forms, click-through feature overview)
- Onboarding version bumped to 2.0 (returning users see new tour)

### Feedback System & Bug Triage Pipeline

**New Page:**

- `FeedbackPage.tsx` — Feedback page with embedded Google Form (feature
  requests, bug reports, general suggestions)

**New Workflow:**

- `.github/workflows/bug-triage.yml` — Runs type-check, lint, tests, and build
  when a `bug`-labelled issue is opened; posts diagnostics as a comment

**Feedback Pipeline:**

- Google Form collects feedback → responses land in Google Sheet
- Bug reports auto-create GitHub Issues via Google Apps Script
  (`scripts/google-form-to-github-issue.gs`)
- GitHub Actions runs automated triage on new bug issues
- Owner reviews notifications and asks Claude Code to investigate/fix

**Updated Files:**

- `App.tsx` — Added `/feedback` route
- `Header.tsx` — Added Feedback nav link (MessageSquare icon)
- `Footer.tsx` — Added Feedback link in Support column
- `HelpSystem.tsx` — "feedback form" text now links to `/feedback`
- `sitemap.xml` — Added feedback URL

## Previous Updates (February 10, 2026)

### Monetization & Launch Infrastructure

**New Pages (4):**

- `PrivacyPolicyPage.tsx` — GDPR-compliant privacy policy (local storage, no
  tracking, third-party API disclosure)
- `TermsPage.tsx` — Terms of use (England & Wales governing law, free tool
  disclaimer)
- `AffiliateDisclosurePage.tsx` — FTC/ASA-compliant affiliate disclosure
  (Booking.com, Pitchup, ACSI)
- `SupportPage.tsx` — Ko-fi donation page with "What your support funds" grid

**New Components (1):**

- `Footer.tsx` — Site-wide footer with nav, legal links, Ko-fi donation,
  affiliate disclosure line. Conditionally hidden on planner (full-screen map),
  shown on all content pages.

**Affiliate Integration:**

- Wired existing `BookingService` (26 tests) to `CampsiteDetails.tsx` — replaced
  hardcoded `AFFILIATE_CONFIGS` with dynamic
  `bookingService.generateBookingLinks()`
- Added `AFFILIATE_LINKS: true` feature flag in `features.ts`
- Configured GitHub Actions to inject affiliate IDs from GitHub Secrets
  (currently only `VITE_BOOKING_AFFILIATE_ID` relevant — awaiting CJ approval)
- All affiliate links use `rel="sponsored noopener noreferrer"` and include
  transparency labels

**Custom Domain:**

- Changed `vite.config.ts` base from `/camper-planner/` to `/`
- Changed router basename from `/camper-planner` to `/`
- CNAME file set to `camperplanning.com`
- Updated GitHub Actions verify URL to `https://camperplanning.com/`

**SEO:**

- Complete `index.html` rewrite with meta description, keywords, canonical URL
- Open Graph tags (og:title, og:description, og:image, og:url, og:site_name)
- Twitter Card tags (summary_large_image)
- JSON-LD structured data (WebApplication schema, price: 0 GBP, features list)
- `sitemap.xml` with 7 URLs and priorities
- `robots.txt` (allow all, disallow /settings)

**Other Updates:**

- `SettingsPage.tsx` rewritten from stub to functional page (data summary,
  export JSON, clear data, privacy info)
- `Header.tsx` updated with Support navigation link (Heart icon)
- `AboutPage.tsx` updated with affiliate transparency messaging and Support card
  section

## Previous Updates (February 6, 2026)

### Codebase Housekeeping

- Removed 5 ad-hoc JS test scripts and ~1,700 lines of dead code from `src/`
- Removed 4 empty macOS-duplicate directories and empty stubs
- Configured Vite `esbuild.pure` to strip `console.log`/`console.debug` from
  production builds
- Removed ~20 debug `console.log` statements from source files
- Removed unused `ui/ErrorBoundary.tsx` (duplicate of
  `layout/ErrorBoundary.tsx`)
- Replaced 3 `any` types in central store with proper `RouteResponse` and
  `WaypointActionData` types
- Consolidated 11 V2-disabled files from scattered locations into `v2-features/`
  directory
- Moved `templates.bak/` to `templates/` at project root

## Previous Updates (October 8, 2025)

### Phase 6 Week 1-2 Completed

**Error Handling Improvements:**

- Added `ServiceError` interface with error classification
- Implemented `classifyError()` method in DataService.ts
- Enhanced SimpleCampsiteLayer.tsx with user-friendly error UI
- Added retry mechanisms with exponential backoff
- Context-specific error suggestions for users

**Mobile Experience Polish:**

- Increased touch targets from 48px to 56px on mobile
- Added haptic feedback (vibration) for waypoint drag operations
- Implemented bottom sheet design for mobile panels
- Full-width buttons and optimized layouts for small screens
- Touch-action CSS and mobile detection

**Performance Optimization:**

- Smart chunk splitting by vendor and feature
- Aggressive tree-shaking configuration
- Bundle size reduced to ~300KB gzipped (from ~500KB)
- Feature-based code splitting already in place

**Design System:**

- Created comprehensive design-tokens.css with full design system
- Colors (primary, secondary, accent, neutral, semantic)
- Spacing scale (0-24 in rem units)
- Typography (font families, sizes, weights, line heights)
- Shadows, borders, transitions, z-index hierarchy
- Utility classes for consistent styling
- Updated index.css to use CSS variables

**Loading States:**

- Created SkeletonLoader.tsx with base Skeleton component
- Specialized skeletons: CampsiteCard, RouteInfo, WaypointList, MapLoading,
  Panel
- Shimmer animation for wave effect
- Pulse and wave animation variants

**Accessibility:**

- Focus ring utilities with keyboard navigation support
- Reduced motion support for animations
- Focus indicators on all interactive elements
- ARIA labels (already existed, validated)
