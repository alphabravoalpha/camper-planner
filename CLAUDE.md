# CLAUDE.md

## Project Overview

**European Camper Trip Planner** — free, privacy-first camper trip planning
platform for European travelers. Live at **camperplanning.com** (GitHub Pages,
Squarespace DNS, HTTPS).

**Monetization:** Booking.com (via CJ, pending), Eurocampings (via
TradeTracker), camping.info (via Awin), Amazon Associates UK
(`camperplann04-21`), Ko-fi donations.

**Last Updated:** March 7, 2026 (UX audit — 28 fixes, European ferry system)

## Technology Stack

- **Frontend:** React 18.2 + Vite 7.1 + TypeScript 5.8
- **Mapping:** Leaflet.js 1.9 + React-Leaflet 4.2
- **State:** Zustand 4.4 with persistence
- **Styling:** Tailwind CSS 3.3
- **Routing API:** OpenRouteService (primary), OSRM (backup)
- **Data:** Overpass API (OSM), Nominatim geocoding
- **i18n:** React-i18next 13.0 + browser language detector (EN + DE live,
  FR/ES/IT stubs)
- **Testing:** Vitest 1.0 + React Testing Library (392 tests, 86% service
  coverage)
- **Quality:** ESLint 9.36 + Prettier 3.0 + Husky pre-commit hooks + lint-staged
- **PWA:** vite-plugin-pwa (Workbox, offline caching, install prompt)
- **SEO:** Open Graph, Twitter Cards, JSON-LD, SEOHead per page, sitemap.xml
- **Analytics:** Cloudflare Web Analytics + localStorage analytics
  (privacy-first)

## Development Commands

```bash
npm run dev              # Dev server (localhost:3000)
npm run build            # Production build
npm run lint             # ESLint
npm run lint:fix         # Auto-fix lint
npm run format           # Prettier
npm run type-check       # TypeScript check
npm test                 # Run tests
npm test:coverage        # Tests with coverage
npm run deploy           # Deploy to GitHub Pages
```

Pre-commit hooks: lint-staged runs ESLint + Prettier on staged files.

## Architecture

### Principles

1. **Future-Proof** — Build V1 as if V2 exists, just disabled
2. **Config-Driven** — Feature flags in `src/config/features.ts`; V2 features in
   `v2-features/`
3. **Privacy-First** — Local storage primary, no tracking, exportable data, zero
   hosting costs
4. **Progressive Enhancement** — Offline-capable, graceful API degradation

### Component Structure

```
src/components/
├── map/          # Map interface (MapContainer, WaypointManager, RouteDisplay, etc.)
├── routing/      # Route planning (RoutePlanner, RouteOptimizer, RouteInfo, etc.)
├── campsite/     # Campsite integration (SimpleCampsiteLayer, CampsiteFilter, etc.)
├── planning/     # Planning tools (CostCalculator, TripManager, etc.)
├── ui/           # Reusable UI (Button, Modal, Tooltip, ConfirmDialog, SkeletonLoader, etc.)
├── layout/       # App layout + Footer
├── search/       # UnifiedSearch
├── wizard/       # Trip planning wizard (with ferry crossing detection)
├── onboarding/   # Guided tour (6-step, v6.0)
├── analytics/    # Usage analytics
└── feedback/     # User feedback
```

### Service Layer

- **RoutingService** — OpenRouteService with vehicle restrictions
- **CampsiteService** — Overpass API, overlap-aware caching, tiered queries,
  route prefetching, reverse geocoding, Wikimedia images, data completeness
  tiers
- **CampsiteFilterService** — Advanced filtering and search
- **CampsiteOptimizationService** — Recommendation algorithms
- **RouteOptimizationService** — TSP solver for multi-stop optimization
- **TripPlanningService** — Duration estimation and itinerary planning
- **TripStorageService** — Local storage with schema versioning
- **CostCalculationService** — Fuel cost and trip budgeting
- **GPXExportService** / **RouteExportService** / **MultiFormatExportService** —
  GPX, JSON, KML export
- **BookingService** — Affiliate link generation (Booking.com, Eurocampings,
  camping.info)
- **TripWizardService** — Trip planning wizard with itinerary generation
- **DataService** — Base service with caching and rate limiting

### Key UI Patterns

- **ConfirmDialog** (`ui/ConfirmDialog.tsx`) — Reusable confirmation modal with
  `danger`/`primary`/`warning` variants, full ARIA (`role="dialog"`,
  `aria-modal`, `aria-labelledby`), Escape key close, focus trap. Used for: trip
  deletion, vehicle profile clear, wizard close, route overwrite.
- **LanguageSelector** (`ui/LanguageSelector.tsx`) — Globe icon dropdown with
  "(Beta)" labels for incomplete locales, Escape key close,
  `document.documentElement.lang` synced via `main.tsx`.

## Key Constraints

### Scope Control

Any feature not in `docs/02-feature-requirements.md` requires approval.

**Excluded from V1:** User accounts, cloud sync, real-time traffic/weather,
advanced booking (availability/price comparison), community features.

### API Rate Limits

- OpenRouteService: 2,000 req/day
- Nominatim: 1 req/sec
- Overpass: 2 req/sec
- All APIs have fallback strategies and aggressive local caching

### Vehicle Restrictions (Core Differentiator)

Routes respect height, weight, width, and length restrictions.

## Development Standards

- TypeScript strict mode, no `any` types
- ESLint + Prettier compliance
- Services: 80%+ coverage (currently 86%, 392 tests)
- Critical UI: manual testing
- Never ship untested business logic
- `Intl.NumberFormat` locale: use `'en-GB'` (never `'en-EU'` — invalid BCP47)
- Text contrast: minimum `text-neutral-600` on white for WCAG AA (~4.5:1)

## Important Files

### Docs

- `docs/01-project-vision.md` — Goals and market positioning
- `docs/02-feature-requirements.md` — V1 scope and exclusions
- `docs/03-technical-architecture.md` — System design
- `docs/04-development-roadmap.md` — Implementation plan
- `docs/05-data-sources-api-spec.md` — API specs

### Config & SEO

- `src/config/features.ts` — Feature flags (AFFILIATE_LINKS, ANALYTICS,
  MULTI_LANGUAGE_COMPLETE: true; ADVANCED_BOOKING: false)
- `index.html` — Meta tags, OG, Twitter Cards, JSON-LD, Cloudflare Analytics
- `src/components/seo/SEOHead.tsx` — Per-page dynamic meta tags
- `public/CNAME` — camperplanning.com
- `public/sitemap.xml` — 20 URLs (auto-generated via
  `scripts/generate-sitemap.ts`)

### i18n

- `src/i18n/index.ts` — Config with browser language detection
- `src/i18n/locales/{en,de}.ts` — Complete translations (120+ keys each)
- `src/i18n/locales/{fr,es,it}.ts` — Stubs (fall back to EN)
- `src/main.tsx` — `document.documentElement.lang` synced on language change
- localStorage key: `camper-planner-language`

### Monetization & Legal

- `src/services/BookingService.ts` — Affiliate link generation
- `src/pages/SupportPage.tsx` — Ko-fi donations
- `src/pages/{PrivacyPolicyPage,TermsPage,AffiliateDisclosurePage}.tsx` — Legal
  pages
- `src/components/blog/GearLink.tsx` — Affiliate product links
- `.github/workflows/gh-pages.yml` — CI/CD with affiliate secrets

### Ferry Crossings

- `src/data/ferryCrossings/` — Comprehensive European ferry route data (12
  region files)
- `src/data/ferryCrossings/index.ts` — Detection logic, landmass lookup, route
  suggestions
- `src/data/ferryCrossings/types.ts` — TypeScript interfaces for ferry routes

### Quality & Audit Docs

- `docs/plans/lighthouse-results.md` — Perf 76, A11y 100, BP 96, SEO 100
- `docs/plans/2026-03-07-ux-audit-action-plan.md` — UX audit: 28 issues found,
  24 fixed (PR #24)
- `docs/research/search-ux-comparison.md` — Competitive search UX analysis

## Current Priorities

**Status:** All phases (1-7) complete. Site live in production.

**Pending:**

- Add `BOOKING_AFFILIATE_ID` GitHub Secret once CJ approves
- Sign up for Awin (camping.info, 5.8%) and TradeTracker (Eurocampings, 3%)
- Monitor bugs, Ko-fi donations, affiliate conversion
- Full i18n rollout (C4 from UX audit — only ~6 of 50+ components use
  translations)

**V2 Considerations:**

- Advanced booking integration (availability, price comparison)
- Community features (trip sharing, reviews)
- Multi-language content pages (blog, legal)
- Full i18n coverage for all UI components
