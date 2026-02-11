# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **European Camper Trip Planner** - a free, comprehensive camper trip planning platform for European travelers. The project aims to fill the gap left by North American-focused paid tools (RV LIFE, Roadtrippers) by providing a zero-cost, privacy-first solution.

## Development Status

**Current Status:** Phase 6 Complete + Monetization Infrastructure Built — Ready for Production Launch
**Custom Domain:** camperplanning.com (GitHub Pages, DNS via Squarespace)
**Monetization:** Affiliate links (Booking.com, Pitchup, ACSI) + Ko-fi donations
**Last Updated:** February 10, 2026

## Technology Stack (Implemented)

- **Frontend:** React 18.2 + Vite 7.1 + TypeScript 5.8
- **Mapping:** Leaflet.js 1.9 + React-Leaflet 4.2
- **State Management:** Zustand 4.4 with persistence
- **Styling:** Tailwind CSS 3.3 with custom utilities
- **Routing API:** OpenRouteService (primary), OSRM (backup)
- **Data Sources:** Overpass API (OSM), Nominatim geocoding
- **Internationalization:** React-i18next 13.0
- **Testing:** Vitest 1.0 + React Testing Library
- **Code Quality:** ESLint 9.36 + Prettier 3.0
- **Hosting:** GitHub Pages at camperplanning.com (custom domain via Squarespace DNS)
- **Monetization:** BookingService (affiliate links) + Ko-fi (donations)
- **SEO:** Open Graph, Twitter Cards, JSON-LD structured data, sitemap.xml

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
```

## Architecture Principles

### 1. Future-Proof Foundation
Build V1 as if V2 already exists, just disabled. Components should be enhanceable, not replaceable.

### 2. Configuration-Driven Development
Features are enabled/disabled via feature flags. V2 features are consolidated in `v2-features/` directory.

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
- **CampsiteService** - Overpass API for OSM campsite data (35KB, full implementation)
- **CampsiteFilterService** - Advanced campsite filtering and search
- **CampsiteOptimizationService** - Campsite recommendation algorithms
- **RouteOptimizationService** - TSP solver for multi-stop optimization
- **TripPlanningService** - Duration estimation and itinerary planning (27KB)
- **TripStorageService** - Local storage with schema versioning
- **CostCalculationService** - Fuel cost and trip budgeting
- **GPXExportService** - GPX export for GPS devices
- **RouteExportService** - Multi-format route export (29KB)
- **MultiFormatExportService** - JSON/KML/other formats
- **BookingService** - Affiliate link generation (Booking.com, Pitchup, ACSI) — wired to CampsiteDetails UI
- **TripWizardService** - Trip planning wizard with itinerary generation
- **DataService** - Base service with caching and rate limiting

**V2 features** are consolidated in `v2-features/` at project root (see `v2-features/README.md`).

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
- ✅ User onboarding (welcome screen, tutorial, contextual tooltips)
- ✅ Error handling improvements (user-friendly messages, retry mechanisms)
- ✅ Mobile experience polish (haptic feedback, touch optimization, bottom sheets)
- ✅ Performance optimization (bundle reduced to ~300KB gzipped)
- ✅ Design system (comprehensive design tokens)
- ✅ Loading states (skeleton loaders for all major components)
- ✅ Accessibility (focus indicators, keyboard navigation, reduced motion support)
- ✅ Launch preparation (testing, cross-browser, performance audit)

### Phase 7: Monetization & Launch Infrastructure ✅ COMPLETE
- ✅ Footer component with legal links, affiliate disclosure, donation button
- ✅ Legal pages: Privacy Policy (GDPR), Terms of Use, Affiliate Disclosure (FTC/ASA)
- ✅ Support/Donate page with Ko-fi integration
- ✅ BookingService wired to CampsiteDetails UI (affiliate links for Booking.com, Pitchup, ACSI)
- ✅ AFFILIATE_LINKS feature flag enabled in features.ts
- ✅ GitHub Actions CI/CD configured with affiliate ID secrets
- ✅ Custom domain (camperplanning.com) configured — CNAME, base path, router basename
- ✅ SEO: meta tags, Open Graph, Twitter Cards, JSON-LD structured data
- ✅ sitemap.xml and robots.txt
- ✅ Settings page made functional (data summary, export, clear data)
- ✅ Header updated with Support navigation link
- ✅ About page updated with affiliate transparency and support section

## Key Constraints

### V1 Scope Control
**SCOPE CONTROL RULE:** Any feature not explicitly listed in `docs/02-feature-requirements.md` requires separate approval before implementation.

### Explicitly Excluded from V1
- User accounts or cloud synchronization
- Real-time traffic or weather data
- Complex affiliate tracking (simple link generation is V1, advanced booking is V2)
- Advanced booking integration (availability checks, price comparison — V2)
- Community features (reviews, sharing)

### API Integration Notes
- **Rate Limiting:** Client-side throttling required (OpenRouteService: 2,000/day, Nominatim: 1/second)
- **Fallback Strategy:** Multiple backup services configured for each API
- **Caching:** Aggressive local caching to minimize API calls
- **Error Handling:** Graceful degradation when services unavailable

## Data Architecture

### Local Storage Schema
Designed for evolution - V1 data must migrate cleanly to V2. All trip data stored locally with version tracking for schema migration.

### Vehicle Restrictions
Core feature differentiator - routes must respect:
- Height (bridges, tunnels)
- Weight (road limits)
- Width (narrow roads)
- Length (turning radius)

## Development Philosophy

### Core Principles

1. **Quality AND Delivery** - Ship quality features with strategic testing. Perfect is the enemy of done.
2. **Strategic Testing** - Test business logic thoroughly (services), validate critical paths, manual test the rest.
3. **Build-Test-Ship Cycle** - Build feature → Manual test → Fix bugs → Ship. Iterate based on real usage.
4. **Focus on Impact** - Prioritize features users need over features that might be nice.
5. **Plan for Growth** - V1 decisions must support V2/V3 goals without architectural rewrites.
6. **Zero Ongoing Costs** - Leverage free tiers and static hosting to maintain sustainability.
7. **Privacy by Design** - No tracking, local storage primary, user data ownership.

### Development Standards

**Code Quality:**
- TypeScript strict mode, no `any` types
- ESLint and Prettier compliance
- Comprehensive error handling
- Clear, documented code

**Testing Strategy (Pragmatic):**
- **Services**: 80% coverage minimum (CRITICAL - business logic) ✅ ACHIEVED: 86%
- **Critical UI**: 30-40% coverage (map, waypoints, core interactions)
- **Integration**: 5 key user workflows (E2E tests with Playwright)
- **Manual**: Pre-launch validation (browsers, devices, accessibility)
- **Everything else**: Manual testing during development, fix bugs as found

**Testing Tiers:**
1. MUST TEST: Services (86% coverage, 357 tests) ✅ COMPLETE
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
- `src/pages/SupportPage.tsx` - Ko-fi donation page
- `src/pages/PrivacyPolicyPage.tsx` - GDPR-compliant privacy policy
- `src/pages/TermsPage.tsx` - Terms of use (England & Wales law)
- `src/pages/AffiliateDisclosurePage.tsx` - FTC/ASA affiliate disclosure
- `src/components/layout/Footer.tsx` - Site footer (hidden on planner, shown on content pages)
- `src/config/features.ts` - Feature flags (AFFILIATE_LINKS: true, ADVANCED_BOOKING: false)
- `src/services/BookingService.ts` - Affiliate link generation for Booking.com, Pitchup, ACSI

### SEO & Domain
- `index.html` - Meta tags, OG tags, Twitter Cards, JSON-LD structured data
- `public/CNAME` - Custom domain: camperplanning.com
- `public/sitemap.xml` - 7 URLs with priorities
- `public/robots.txt` - Allow all, disallow /settings
- `.env.local.example` - Documented affiliate env var template

### CI/CD
- `.github/workflows/gh-pages.yml` - Deploys to GitHub Pages with affiliate secrets from GitHub Secrets

## Current Development Priority: Production Launch

### Current Status: Code Complete — Awaiting Manual Launch Steps

**All code is built, tested, and production-ready.** The remaining steps are manual actions by the project owner.

**Technical Summary:**
- 14,109+ lines of code written
- **357 service tests** (99.7% pass rate) ✅
- **86% service coverage** (12/14 services tested) ✅
- **7 critical bugs fixed** during testing ✅
- Monetization infrastructure fully wired ✅
- Custom domain configured (camperplanning.com) ✅
- SEO meta tags, OG tags, sitemap, robots.txt ✅
- Production build succeeds with all new pages code-split ✅

### Manual Launch Steps Required (Owner Action)

1. **Configure Squarespace DNS** — Point camperplanning.com to GitHub Pages:
   - A records: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
   - CNAME: www → alphabravoalpha.github.io
2. **Enable HTTPS** in GitHub Pages settings after DNS propagates
3. **Create Ko-fi account** at ko-fi.com/camperplanning
4. **Apply to affiliate programs:**
   - Booking.com Affiliate Partner Programme
   - Pitchup.com partnerships
   - ACSI partner program
5. **Add affiliate IDs as GitHub Secrets** once approved:
   - `BOOKING_AFFILIATE_ID`
   - `PITCHUP_AFFILIATE_ID`
   - `ACSI_AFFILIATE_CODE`
6. **Create OG social sharing image** (1200x630px) at `public/og-image.png`

### Post-Launch Priorities

**Immediate (Week 1 after launch):**
- Monitor for bugs via GitHub Issues
- Verify affiliate links track correctly once IDs are live
- Check Google Search Console for indexing

**Short-term:**
- Performance audit with Lighthouse (target >85)
- Full WCAG AA compliance validation
- User guide / FAQ documentation
- Monitor Ko-fi donations and affiliate conversion

**Medium-term (V2 considerations):**
- Advanced booking integration (availability, price comparison)
- Community features (trip sharing, reviews)
- Multi-language content pages
- Progressive Web App (PWA) support

## Recent Updates (February 11, 2026)

### Feedback System & Bug Triage Pipeline
**New Page:**
- `FeedbackPage.tsx` — Feedback page with embedded Google Form (feature requests, bug reports, general suggestions)

**New Workflow:**
- `.github/workflows/bug-triage.yml` — Runs type-check, lint, tests, and build when a `bug`-labelled issue is opened; posts diagnostics as a comment

**Feedback Pipeline:**
- Google Form collects feedback → responses land in Google Sheet
- Bug reports auto-create GitHub Issues via Google Apps Script (`scripts/google-form-to-github-issue.gs`)
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
- `PrivacyPolicyPage.tsx` — GDPR-compliant privacy policy (local storage, no tracking, third-party API disclosure)
- `TermsPage.tsx` — Terms of use (England & Wales governing law, free tool disclaimer)
- `AffiliateDisclosurePage.tsx` — FTC/ASA-compliant affiliate disclosure (Booking.com, Pitchup, ACSI)
- `SupportPage.tsx` — Ko-fi donation page with "What your support funds" grid

**New Components (1):**
- `Footer.tsx` — Site-wide footer with nav, legal links, Ko-fi donation, affiliate disclosure line. Conditionally hidden on planner (full-screen map), shown on all content pages.

**Affiliate Integration:**
- Wired existing `BookingService` (26 tests) to `CampsiteDetails.tsx` — replaced hardcoded `AFFILIATE_CONFIGS` with dynamic `bookingService.generateBookingLinks()`
- Added `AFFILIATE_LINKS: true` feature flag in `features.ts`
- Configured GitHub Actions to inject `VITE_BOOKING_AFFILIATE_ID`, `VITE_PITCHUP_AFFILIATE_ID`, `VITE_ACSI_AFFILIATE_CODE` from GitHub Secrets
- All affiliate links use `rel="sponsored noopener noreferrer"` and include transparency labels

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
- `SettingsPage.tsx` rewritten from stub to functional page (data summary, export JSON, clear data, privacy info)
- `Header.tsx` updated with Support navigation link (Heart icon)
- `AboutPage.tsx` updated with affiliate transparency messaging and Support card section

## Previous Updates (February 6, 2026)

### Codebase Housekeeping
- Removed 5 ad-hoc JS test scripts and ~1,700 lines of dead code from `src/`
- Removed 4 empty macOS-duplicate directories and empty stubs
- Configured Vite `esbuild.pure` to strip `console.log`/`console.debug` from production builds
- Removed ~20 debug `console.log` statements from source files
- Removed unused `ui/ErrorBoundary.tsx` (duplicate of `layout/ErrorBoundary.tsx`)
- Replaced 3 `any` types in central store with proper `RouteResponse` and `WaypointActionData` types
- Consolidated 11 V2-disabled files from scattered locations into `v2-features/` directory
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
- Specialized skeletons: CampsiteCard, RouteInfo, WaypointList, MapLoading, Panel
- Shimmer animation for wave effect
- Pulse and wave animation variants

**Accessibility:**
- Focus ring utilities with keyboard navigation support
- Reduced motion support for animations
- Focus indicators on all interactive elements
- ARIA labels (already existed, validated)