# European Camper Trip Planner

A free, open-source platform for planning European camper and motorhome adventures.

## Overview

This application helps camper enthusiasts plan optimal routes across Europe, considering vehicle dimensions, campsite availability, and travel preferences. Built with modern web technologies for a responsive, mobile-friendly experience.

## Development Status

**Current Phase:** Phase 1.3 - Development Tools ✅
**Next Phase:** Phase 1.5 - Basic Map Implementation

## Quick Start

### Prerequisites

- Node.js 18+
- npm 8+
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd camper-planner

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

### Development Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format with Prettier
npm run format:check     # Check Prettier formatting
npm run type-check       # TypeScript type checking

# Testing
npm test                 # Run tests
npm run test:ui          # Run tests with UI
npm run test:coverage    # Run tests with coverage

# Component Generation
./create-component.sh ComponentName [type] [description]
```

## Features (Planned)

- 🗺️ Interactive European map with route planning
- 🚛 Vehicle profile configuration (height, width, weight restrictions)
- 🏕️ Campsite database integration
- 📍 Waypoint management with drag-and-drop
- 📱 Mobile-responsive design
- 🌍 Multi-language support
- 💾 Local data storage (privacy-first)

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + clsx + tailwind-merge
- **Mapping:** Leaflet.js + React-Leaflet
- **State:** Zustand with persistence
- **i18n:** React-i18next
- **Testing:** Vitest + React Testing Library
- **Code Quality:** ESLint + Prettier
- **Deployment:** Static hosting (Netlify/Vercel)

## Project Structure

```
src/
├── components/
│   ├── ui/            # Reusable UI components
│   ├── forms/         # Form components
│   ├── layout/        # Layout components
│   └── map/           # Map-related components
├── pages/             # Route/page components
├── store/             # Zustand state management
├── services/          # API services & data layer
├── utils/             # Helper functions
├── types/             # TypeScript definitions
├── config/            # App configuration & feature flags
├── i18n/              # Internationalization
├── assets/            # Static assets
├── test/              # Test utilities & setup
└── templates/         # Component templates
```

## Development Workflow

### 1. Creating Components

Use the provided script to generate components:

```bash
# UI Component
./create-component.sh Button ui "Reusable button component"

# Page Component
./create-component.sh SettingsPage page "User settings page"

# Regular Component
./create-component.sh MapControls "Map control panel"
```

### 2. Code Standards

- **TypeScript:** Strict mode enabled, no `any` types
- **React:** Functional components with hooks
- **Styling:** Tailwind CSS classes, use `cn()` utility for conditional classes
- **State:** Zustand stores with persistence where appropriate
- **Testing:** Test all components and user interactions
- **Accessibility:** ARIA labels, semantic HTML, keyboard navigation

### 3. Import Aliases

Use the configured path aliases:

```typescript
import Button from '@/components/ui/Button';
import { useMapStore } from '@/store';
import { cn } from '@/utils/cn';
import { FeatureFlags } from '@/config';
```

### 4. Feature Flags

All features are controlled by feature flags in `src/config/features.ts`:

```typescript
// Check feature availability
if (!FeatureFlags.BASIC_MAP_DISPLAY) {
  return <FeatureDisabled />;
}
```

### 5. State Management

Use Zustand stores for state management:

```typescript
// Create store
const useFeatureStore = create<FeatureState>()(...);

// Use in components
const { data, setData } = useFeatureStore();
```

### 6. Testing

Write tests for all components:

```bash
# Run tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm run test:coverage
```

### 7. Internationalization

Add translations to `src/i18n/locales/`:

```typescript
// Use in components
const { t } = useTranslation();
return <h1>{t('page.title')}</h1>;
```

## VS Code Setup

Recommended extensions:
- ES7+ React/Redux/React-Native snippets
- TypeScript Importer
- Tailwind CSS IntelliSense
- ESLint
- Prettier
- Auto Rename Tag
- Bracket Pair Colorizer

## Contributing

1. Follow the phase-based development approach (see `docs/`)
2. Use feature flags for all new functionality
3. Write tests for components and user flows
4. Follow the established code style and patterns
5. Update documentation for new features

### Pull Request Process

1. Create feature branch from `main`
2. Implement changes with tests
3. Run `npm run lint && npm run type-check && npm test`
4. Update documentation if needed
5. Submit PR with clear description

## Troubleshooting

### NPM Permission Issues

If you encounter npm permission errors:

```bash
sudo chown -R $(whoami) ~/.npm
npm cache clean --force
npm install
```

### Development Server Issues

- Check if port 3000 is available
- Clear browser cache
- Restart the development server

### Build Issues

- Run `npm run type-check` to identify TypeScript errors
- Check for missing dependencies
- Verify all imports are correct

## License

MIT License - see LICENSE file for details.

## Documentation

- [Technical Architecture](docs/technical-architecture.md)
- [Development Roadmap](docs/development-roadmap.md)
- [API Requirements](docs/api-requirements.md)
- [Deployment Guide](DEPLOYMENT.md)