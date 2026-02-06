# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **European Camper Trip Planner** - a free, comprehensive camper trip planning platform for European travelers. The project aims to fill the gap left by North American-focused paid tools (RV LIFE, Roadtrippers) by providing a zero-cost, privacy-first solution.

## Development Status

**Current Status:** Phase 6 Week 1-2 Complete - Ready for Pre-Launch Validation
**Next Phase:** Phase 6 Week 3 - Integration tests, cross-browser validation, and production launch
**Last Updated:** October 8, 2025

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
- **Hosting:** GitHub Pages (configured at /camper-planner/)

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
├── layout/              # ✅ App layout (8 components)
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
- **BookingService** - Affiliate link integration framework
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

### Phase 6: Export & Polish 🔄 CURRENT PHASE (Week 1-2 Complete)
- ✅ GPX export service implemented (ahead of schedule)
- ✅ Multi-format export (JSON, KML)
- ✅ User onboarding (welcome screen, tutorial, contextual tooltips)
- ✅ Error handling improvements (user-friendly messages, retry mechanisms)
- ✅ Mobile experience polish (haptic feedback, touch optimization, bottom sheets)
- ✅ Performance optimization (bundle reduced to ~300KB gzipped)
- ✅ Design system (comprehensive design tokens)
- ✅ Loading states (skeleton loaders for all major components)
- ✅ Accessibility (focus indicators, keyboard navigation, reduced motion support)
- ⏳ Launch preparation (testing, cross-browser, performance audit) - Week 3

## Key Constraints

### V1 Scope Control
**SCOPE CONTROL RULE:** Any feature not explicitly listed in `docs/02-feature-requirements.md` requires separate approval before implementation.

### Explicitly Excluded from V1
- User accounts or cloud synchronization
- Real-time traffic or weather data
- Complex affiliate tracking
- Advanced booking integration
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

## Current Development Priority: Phase 6 - Polish & Launch

### Current Status: Service Layer VALIDATED ✅

**Phase 1-5 Status:** Features implemented and service layer tested
- 14,109 lines of code written
- **357 service tests** (99.7% pass rate) ✅
- **86% service coverage** (12/14 services tested) ✅
- **7 critical bugs fixed** during testing ✅
- Business logic is production-ready ✅

**Phase 6 Status:** Feature completion + UX polish + pre-launch validation

### Professional Approach: Ship Quality Features

**Build features → Test manually → Fix bugs → Ship → Iterate based on usage**

#### Phase 6 Tasks (2-3 Weeks to Launch)

**Week 1: Feature Completion** ✅ COMPLETE
1. ✅ Service testing (86% coverage, 357 tests) - COMPLETE
2. ✅ User onboarding (welcome screen, tutorial, tooltips) - COMPLETE
3. ✅ Error handling improvements (better messages, retry mechanisms) - COMPLETE
4. ✅ Mobile experience polish (touch controls, responsive refinement) - COMPLETE
5. ✅ Performance optimization (code splitting, lazy loading, bundle size) - COMPLETE

**Week 2: UX Polish** ✅ COMPLETE
1. ✅ Visual consistency (spacing, colors, typography standardization) - COMPLETE
2. ✅ Loading states (skeletons, spinners, optimistic updates) - COMPLETE
3. ✅ Accessibility (keyboard navigation, ARIA labels, screen reader support) - COMPLETE
4. ✅ Feature refinements (drag-and-drop polish, better filtering, export preview) - COMPLETE

**Week 3: Pre-Launch Validation**
1. ✅ Integration tests (5 key workflows with Playwright)
2. ✅ Cross-browser testing (Chrome, Firefox, Safari, Edge)
3. ✅ Device testing (desktop, tablet, mobile)
4. ✅ Performance audit (Lighthouse >85, bundle optimization)
5. ✅ Security review (input validation, XSS prevention)
6. 📚 Documentation (user guide, FAQ, README)
7. 🚀 Production deployment

#### Success Criteria for Launch

**Must Have (Blockers):**
- [x] Service layer tested (86% coverage, 357 tests)
- [x] User onboarding complete (first-time user can figure out app)
- [x] Error handling with user-friendly messages and retry mechanisms
- [x] Mobile experience optimized (touch targets, haptic feedback)
- [x] Performance optimized (bundle ~300KB gzipped)
- [ ] No critical bugs in core workflows (add waypoints, calculate route, export)
- [ ] Works on Chrome, Firefox, Safari (latest versions)
- [ ] Responsive on desktop, tablet, mobile (needs validation)
- [ ] 5 integration tests passing (key user workflows)
- [ ] Basic accessibility (keyboard navigation works - needs validation)

**Should Have (Launch with known issues okay):**
- [x] Visual consistency (design tokens standardized)
- [x] Loading states (skeleton loaders implemented)
- [ ] Performance >85 Lighthouse score (needs audit)
- [ ] Cross-browser edge compatibility
- [ ] Full WCAG AA compliance (partially complete)
- [ ] Comprehensive documentation

**Post-Launch (Iterate):**
- Monitor user feedback (GitHub issues)
- Fix bugs based on real usage
- Add features based on user requests
- Performance improvements based on metrics

### Next Immediate Actions

**Week 3 (Pre-Launch Validation):**
1. Write 5 integration tests (Playwright) for key user workflows:
   - Add waypoints → Calculate route → View directions
   - Search campsite → Filter results → Add to route
   - Configure vehicle → Calculate route with restrictions
   - Create trip → Export GPX → Import GPX
   - Plan multi-day trip → Calculate costs → Save trip
2. Cross-browser testing (Chrome, Firefox, Safari on desktop + mobile)
3. Performance audit with Lighthouse (target >85 score)
4. Accessibility validation (keyboard navigation, screen reader)
5. User guide and documentation
6. Production deployment to GitHub Pages

**Use the app yourself** - Plan a real trip, find bugs, fix them immediately.

**Approach:** Build → Manual Test → Fix → Ship → Iterate

## Recent Updates (February 6, 2026)

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