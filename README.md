# European Camper Trip Planner

**V1.0 - Production Ready** 🚀

A free, open-source platform for planning European camper and motorhome adventures with comprehensive trip planning, cost calculation, and campsite discovery.

## 🌟 Features

### ✅ Complete V1.0 Features

- **🗺️ Interactive European Map**
  - Leaflet-powered map with OpenStreetMap tiles
  - Click-to-add waypoints with drag reordering
  - Vehicle-specific routing with restrictions
  - Multiple map layers (Street, Satellite, Terrain)

- **🚛 Vehicle Profiles**
  - Configure vehicle dimensions (height, width, length, weight)
  - Vehicle type selection (Motorhome, Caravan, Campervan)
  - Fuel type and consumption tracking
  - Automatic restriction checking

- **🏕️ Campsite Integration**
  - 10,000+ European campsites from OpenStreetMap
  - Real-time campsite search with filters
  - Vehicle compatibility checking
  - Amenity filtering (electricity, showers, wifi, etc.)
  - Intelligent campsite recommendations
  - Add campsites directly to route

- **🎯 Route Optimization**
  - Multi-stop route optimization (TSP solver)
  - 3 optimization modes: Shortest, Fastest, Balanced
  - Waypoint locking
  - Smart waypoint insertion

- **💰 Trip Cost Calculator**
  - **Fuel costs** with configurable consumption
  - **European toll costs** for 19 countries
  - **Accommodation costs** with smart campsite fee parsing
  - Daily cost breakdown
  - Total budget estimation
  - Optimization suggestions

- **📍 Trip Planning**
  - Save and load trips
  - 8 pre-built European route templates
  - Trip comparison tools
  - Daily itinerary planning
  - Seasonal recommendations
  - Feasibility assessment

- **📤 Export & Sharing**
  - GPX export for GPS devices (Garmin, TomTom, etc.)
  - JSON/KML/CSV export formats
  - URL-based trip sharing
  - QR code generation
  - Social media sharing
  - Email and print options

- **🌍 Multi-Language Framework**
  - i18n framework ready
  - European language support prepared

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm 8+
- Modern web browser (Chrome, Firefox, Edge, Safari)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/camper-planner.git
cd camper-planner

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Deploy dist/ folder to any static hosting
```

## 📋 Development Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run type-check       # TypeScript type checking

# Testing
npm test                 # Run tests
npm run test:coverage    # Run tests with coverage
```

## 🏗️ Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Mapping:** Leaflet.js + React-Leaflet
- **State:** Zustand with localStorage persistence
- **Routing API:** OpenRouteService + OSRM
- **Data:** Overpass API (OSM campsites)
- **i18n:** React-i18next
- **Deployment:** Static site (GitHub Pages, Netlify, Vercel)

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/            # Reusable UI components
│   ├── map/           # Map components (MapContainer, WaypointManager)
│   ├── routing/       # Routing components (RouteCalculator, CostCalculator)
│   ├── campsite/      # Campsite components (Search, Filter, Details)
│   ├── planning/      # Trip planning (TripManager, PlanningTools)
│   └── shared/        # Shared/import components
├── services/          # API services & business logic
│   ├── RoutingService.ts
│   ├── CampsiteService.ts
│   ├── CostCalculationService.ts
│   ├── RouteOptimizationService.ts
│   ├── TripStorageService.ts
│   └── TripSharingService.ts
├── adapters/          # Data transformation layer
├── store/             # Zustand state management
├── utils/             # Helper functions
├── types/             # TypeScript definitions
├── config/            # App configuration & feature flags
└── i18n/              # Internationalization
```

## 🎯 Development Roadmap

**Phase 1:** ✅ Foundation Setup (React + Vite + Leaflet)
**Phase 2:** ✅ Core Mapping (Interactive map + waypoints)
**Phase 3:** ✅ Vehicle & Routing (Profiles + OpenRouteService)
**Phase 4:** ✅ Campsite Integration (10K+ campsites from OSM)
**Phase 5:** ✅ Planning Tools (Optimization + Cost calculation)
**Phase 6:** ✅ Export & Polish (GPX + sharing + production)

**V1.0 Status:** Production Ready 🎉

## 💡 Usage Guide

### 1. Plan Your Route

1. Click on the map to add waypoints
2. Drag waypoints to reorder them
3. Set your vehicle profile (dimensions)
4. Route automatically calculates with vehicle restrictions

### 2. Find Campsites

1. Enable campsite layer
2. Filter by type (campsite, aire, parking)
3. Filter by amenities (electricity, wifi, etc.)
4. Check vehicle compatibility
5. Add campsites to your route

### 3. Optimize & Calculate Costs

1. Use route optimizer for best order
2. Check cost calculator for:
   - Fuel costs (based on your vehicle)
   - Toll costs (19 European countries)
   - Accommodation costs (campsite fees)
3. Review daily breakdown

### 4. Save & Share

1. Save your trip locally
2. Export as GPX for GPS device
3. Share via URL or QR code
4. Export as JSON for backup

## 🌍 Supported Countries

### Routing & Navigation
All European countries via OpenRouteService

### Toll Cost Calculation
Austria, Switzerland, Czech Republic, Slovenia, Slovakia, Romania, Hungary, France, Italy, Spain, Portugal, Greece, Poland, Croatia, Germany, Netherlands, Belgium, Denmark, Sweden

### Campsite Data
30+ European countries via OpenStreetMap

## 🔧 Configuration

### Feature Flags

Control features in `src/config/features.ts`:

```typescript
export const FeatureFlags = {
  BASIC_MAP_DISPLAY: true,
  WAYPOINT_SYSTEM: true,
  VEHICLE_PROFILES: true,
  CAMPSITE_DISPLAY: true,
  ROUTE_OPTIMIZATION: true,
  DATA_EXPORT: true,
  ROUTE_SHARING: true,
  // V2 features disabled
  COMMUNITY_FEATURES: false,
  WEATHER_INTEGRATION: false,
  USER_PROFILES: false,
};
```

### API Configuration

Default free API tiers are configured. For production, consider:

- **OpenRouteService:** 2,000 requests/day (free tier)
- **Nominatim:** 1 request/second (usage policy)
- **Overpass API:** Fair use policy

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## 🎨 Design Principles

- **Privacy-First:** All data stored locally, no tracking
- **Mobile-Responsive:** Works on phones, tablets, desktops
- **Offline-Capable:** Cached data available offline
- **Zero Cost:** Free APIs, static hosting, no server costs
- **Accessible:** Semantic HTML, ARIA labels, keyboard navigation

## 📊 Performance

- **Lighthouse Score:** 90+ Performance, 95+ Accessibility
- **Bundle Size:** ~350KB gzipped
- **Initial Load:** <3s on 3G
- **Map Interaction:** <100ms response time

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Follow existing code style
4. Add tests for new features
5. Update documentation
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- **OpenStreetMap** - Campsite and map data
- **OpenRouteService** - Vehicle-aware routing
- **Leaflet.js** - Mapping library
- **Overpass API** - OSM data queries

## 📚 Documentation

- [Project Vision](docs/01-project-vision.md)
- [Feature Requirements](docs/02-feature-requirements.md)
- [Technical Architecture](docs/03-technical-architecture.md)
- [Development Roadmap](docs/04-development-roadmap.md)
- [API Specifications](docs/05-data-sources-api-spec.md)
- [CLAUDE.md](CLAUDE.md) - Development guide for AI assistants

## 🐛 Issues & Support

- **Report bugs:** GitHub Issues
- **Feature requests:** GitHub Discussions
- **Questions:** Check documentation first

## 🚀 Deployment

### GitHub Pages (Recommended)

```bash
npm run build
# Deploy dist/ folder to GitHub Pages
```

### Netlify / Vercel

1. Connect your repository
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Deploy!

## 📈 Roadmap V2.0 (Future)

- Weather integration along route
- Community features (reviews, ratings)
- Advanced booking integration
- User accounts with cloud sync
- Mobile app (React Native)
- Real-time traffic integration

---

**Built with ❤️ for the European camper community**

*Free forever. No ads. No tracking. Open source.*
