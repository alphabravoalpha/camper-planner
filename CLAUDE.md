# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **European Camper Trip Planner** - a free, comprehensive camper trip planning platform for European travelers. The project aims to fill the gap left by North American-focused paid tools (RV LIFE, Roadtrippers) by providing a zero-cost, privacy-first solution.

## Development Status

**Current Status:** Pre-development - Documentation and planning phase complete
**Next Phase:** Phase 1 (Foundation Setup) - Initialize React app with Vite and core dependencies

## Technology Stack (Planned)

- **Frontend:** React 18 + Vite + TypeScript (gradual adoption)
- **Mapping:** Leaflet.js + React-Leaflet
- **State Management:** Zustand
- **Styling:** Tailwind CSS
- **Routing API:** OpenRouteService (primary), OSRM (backup)
- **Data Sources:** Overpass API (OSM), Nominatim
- **Hosting:** Static site deployment (GitHub Pages/Netlify/Vercel)

## Development Commands

Since the project hasn't been initialized yet, commands will be added after Phase 1 setup. Expected commands:
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run lint` - Code linting
- `npm run typecheck` - TypeScript checking

## Architecture Principles

### 1. Future-Proof Foundation
Build V1 as if V2 already exists, just disabled. Components should be enhanceable, not replaceable.

### 2. Configuration-Driven Development
Features are enabled/disabled via feature flags. V2 components exist but are dormant in V1.

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

### Planned Structure
```
/src/components/
├── map/                 # Core V1 - Map interface components
│   ├── MapContainer.jsx
│   ├── WaypointManager.jsx
│   └── RouteDisplay.jsx
├── routing/             # Core V1 - Route planning
│   ├── RoutePlanner.jsx
│   ├── RouteOptimizer.jsx
│   └── CostCalculator.jsx
├── campsites/           # Core V1 - Campsite integration
│   ├── CampsiteLayer.jsx
│   └── CampsiteFilter.jsx
├── community/           # V2 - Dormant features
└── planning/            # V2 - Advanced planning
```

### Service Layer
All external APIs are abstracted through service classes:
- **RoutingService** - OpenRouteService integration with vehicle restrictions
- **CampsiteService** - Overpass API for OSM campsite data
- **StorageService** - Local storage with schema versioning
- **ExportService** - GPX/JSON export functionality

## Development Phases

**Must complete phases sequentially. Do not skip ahead.**

### Phase 1: Foundation (Current)
- Initialize React app with Vite
- Setup core dependencies (React Router, Leaflet, Zustand, Tailwind)
- Create basic app shell and navigation
- Configure feature flags system

### Phase 2: Core Mapping
- Interactive map with OpenStreetMap tiles
- Click-to-add waypoints with drag reordering
- Basic waypoint management and persistence

### Phase 3: Vehicle & Routing
- Vehicle profile configuration
- OpenRouteService integration with vehicle restrictions
- Route calculation and display

### Phase 4: Campsite Integration
- Overpass API integration for campsite data
- Campsite display and filtering
- Performance optimization for large datasets

### Phase 5: Planning Tools
- Route optimization algorithms
- Cost estimation
- Trip management and saving

### Phase 6: Export & Polish
- GPX export for GPS devices
- UI/UX polish and performance optimization
- Production deployment

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

1. **Start with documentation** - Read all 5 docs files before coding
2. **Build incrementally** - Complete each phase fully before proceeding
3. **Plan for growth** - V1 decisions must support V2/V3 goals
4. **Zero ongoing costs** - Leverage free tiers and static hosting
5. **Privacy by design** - No tracking, local storage primary

## Important Files

- `docs/01-project-vision.md` - Project goals and market positioning
- `docs/02-feature-requirements.md` - Detailed V1 scope and exclusions
- `docs/03-technical-architecture.md` - System design and component structure
- `docs/04-development-roadmap.md` - Phase-by-phase implementation plan
- `docs/05-data-sources-api-spec.md` - API integration specifications

## Next Steps for Development

1. **Phase 1.1:** Initialize React app with Vite
2. **Phase 1.2:** Install and configure core dependencies
3. **Phase 1.3:** Setup development tools (ESLint, Prettier)
4. **Phase 1.4:** Create basic app shell and routing
5. **Phase 1.5:** Implement basic map component

**Always refer to the roadmap documentation before implementing features.**