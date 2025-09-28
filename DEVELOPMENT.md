# Development Workflow Documentation

Complete guide to the European Camper Trip Planner development process.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Environment Setup](#development-environment-setup)
3. [Code Organization](#code-organization)
4. [Development Process](#development-process)
5. [Testing Strategy](#testing-strategy)
6. [Code Quality Guidelines](#code-quality-guidelines)
7. [Debugging and Troubleshooting](#debugging-and-troubleshooting)
8. [Deployment Process](#deployment-process)

## Getting Started

### Prerequisites

Before starting development, ensure you have:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm 8+** - Comes with Node.js
- **Git** - [Download here](https://git-scm.com/)
- **VS Code** - Recommended editor with extensions

### Initial Setup

1. **Clone and Setup Project**
   ```bash
   git clone <repository-url>
   cd camper-planner
   npm install
   ```

2. **Verify Installation**
   ```bash
   node verify-setup.cjs
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

## Development Environment Setup

### VS Code Configuration

The project includes comprehensive VS Code settings:

- **Auto-formatting** on save with Prettier
- **ESLint integration** with auto-fix
- **TypeScript** error checking
- **Tailwind CSS** IntelliSense
- **File nesting** for better organization
- **Recommended extensions** prompt

### Recommended Extensions

Install these VS Code extensions for optimal development experience:

```json
{
  "essential": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "dsznajder.es7-react-js-snippets"
  ],
  "productivity": [
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "eamodio.gitlens",
    "gruntfuggly.todo-tree"
  ]
}
```

### Environment Variables

Create `.env.local` file for development:

```bash
# Copy example file
cp .env.local.example .env.local

# Edit with your values
VITE_API_BASE_URL=http://localhost:3000
VITE_MAPBOX_TOKEN=your_token_here
```

## Code Organization

### File Structure

```
src/
├── components/           # React components
│   ├── ui/              # Reusable UI components
│   ├── forms/           # Form-specific components
│   ├── layout/          # Layout components
│   └── map/             # Map-related components
├── pages/               # Route/page components
├── store/               # Zustand state management
├── services/            # API services & data layer
├── utils/               # Helper functions
├── types/               # TypeScript definitions
├── config/              # App configuration
├── i18n/                # Internationalization
├── assets/              # Static assets
├── test/                # Test utilities
└── templates/           # Component templates
```

### Naming Conventions

- **Files**: PascalCase for components (`Button.tsx`), camelCase for utilities (`formatDate.ts`)
- **Components**: PascalCase (`MapContainer`)
- **Variables/Functions**: camelCase (`getUserLocation`)
- **Constants**: UPPER_SNAKE_CASE (`FEATURE_FLAGS`)
- **Types/Interfaces**: PascalCase (`RouteData`)

### Import Organization

Use configured path aliases:

```typescript
// ✅ Good - Use aliases
import Button from '@/components/ui/Button';
import { useMapStore } from '@/store';
import { FeatureFlags } from '@/config';

// ❌ Avoid - Relative imports
import Button from '../../components/ui/Button';
```

## Development Process

### 1. Feature Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/map-waypoint-system

# 2. Generate component (if needed)
./create-component.sh WaypointManager component "Manages route waypoints"

# 3. Implement feature with tests
# 4. Run quality checks
npm run lint && npm run type-check && npm test

# 5. Commit changes
git add .
git commit -m "feat: add waypoint management system"

# 6. Push and create PR
git push origin feature/map-waypoint-system
```

### 2. Component Creation

Use the component generator for consistency:

```bash
# UI Component
./create-component.sh Modal ui "Reusable modal dialog"

# Page Component
./create-component.sh RoutePage page "Route planning page"

# Feature Component
./create-component.sh MapControls "Map control panel"
```

### 3. State Management

Follow Zustand patterns:

```typescript
// Create store
export const useFeatureStore = create<FeatureState>()(
  devtools(
    persist(
      (set, get) => ({
        // State and actions
      }),
      {
        name: 'camper-planner-feature',
        partialize: (state) => ({ /* persistent fields */ }),
      }
    ),
    { name: 'feature-store' }
  )
);

// Use in components
const { data, setData } = useFeatureStore();
```

### 4. API Integration

Use the service layer pattern:

```typescript
// Create service
class RouteService extends DataService {
  async calculateRoute(waypoints: Waypoint[]): Promise<Route> {
    await this.checkRateLimit('routing');
    // Implementation
  }
}

// Use in components
const routeService = new RouteService(config);
const route = await routeService.calculateRoute(waypoints);
```

## Testing Strategy

### Test Types

1. **Unit Tests** - Individual components and functions
2. **Integration Tests** - Component interactions
3. **E2E Tests** - Full user workflows (future)

### Writing Tests

```typescript
// Component test structure
describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />);
    expect(screen.getByTestId('component')).toBeInTheDocument();
  });

  it('handles user interactions', () => {
    const mockHandler = vi.fn();
    render(<ComponentName onEvent={mockHandler} />);

    fireEvent.click(screen.getByRole('button'));
    expect(mockHandler).toHaveBeenCalled();
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Watch mode during development
npm test -- --watch

# Coverage report
npm run test:coverage

# UI mode (interactive)
npm run test:ui
```

## Code Quality Guidelines

### TypeScript Standards

- **Strict mode enabled** - No `any` types
- **Explicit return types** for functions
- **Interface definitions** for all data structures
- **Generic types** where appropriate

```typescript
// ✅ Good
interface RouteData {
  id: string;
  waypoints: Waypoint[];
  distance: number;
}

const calculateDistance = (waypoints: Waypoint[]): number => {
  // Implementation
};

// ❌ Avoid
const calculateDistance = (waypoints: any): any => {
  // Implementation
};
```

### React Best Practices

- **Functional components** with hooks
- **Proper key props** for lists
- **useCallback/useMemo** for optimization
- **Error boundaries** for error handling
- **Accessibility** attributes

```typescript
// ✅ Good component structure
const MapContainer: React.FC<MapContainerProps> = ({
  waypoints,
  onWaypointAdd
}) => {
  const handleMapClick = useCallback((event: MapEvent) => {
    onWaypointAdd(event.latlng);
  }, [onWaypointAdd]);

  return (
    <div role="application" aria-label="Interactive map">
      {/* Component content */}
    </div>
  );
};
```

### Styling Guidelines

- **Tailwind CSS classes** for styling
- **Component variants** using `cn()` utility
- **Responsive design** principles
- **Consistent spacing** using Tailwind scale

```typescript
// ✅ Good styling approach
const Button: React.FC<ButtonProps> = ({ variant, size, className }) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  );
};
```

### Performance Considerations

- **Lazy loading** for pages and large components
- **Code splitting** for vendor libraries
- **Image optimization** for assets
- **Bundle analysis** for size monitoring

## Debugging and Troubleshooting

### Common Issues and Solutions

#### 1. NPM Permission Errors

```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
npm cache clean --force
npm install
```

#### 2. TypeScript Errors

```bash
# Check types
npm run type-check

# Common fixes
- Add missing imports
- Define proper interfaces
- Check tsconfig.json configuration
```

#### 3. ESLint/Prettier Conflicts

```bash
# Fix formatting
npm run format
npm run lint:fix

# Check configuration
- Verify .prettierrc settings
- Check eslint.config.js rules
```

#### 4. Import Path Issues

```bash
# Verify path aliases in vite.config.ts
# Use absolute imports with @/ prefix
# Check tsconfig.json paths configuration
```

### Development Server Issues

```bash
# Clear cache and restart
rm -rf node_modules/.vite
npm run dev

# Check port availability
lsof -ti:3000
kill -9 <pid>
```

### VS Code Setup Issues

1. **Install recommended extensions**
2. **Reload VS Code window**
3. **Check workspace settings**
4. **Verify TypeScript version**

## Deployment Process

### Development Deployment

```bash
# Build for production
npm run build

# Preview build locally
npm run preview

# Verify build output
ls -la dist/
```

### Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

### Environment-Specific Builds

```bash
# Development build
VITE_ENV=development npm run build

# Production build
VITE_ENV=production npm run build
```

## Git Workflow

### Commit Message Format

```
type(scope): description

feat(map): add waypoint drag and drop functionality
fix(routing): resolve route calculation edge cases
docs(readme): update installation instructions
test(components): add Button component tests
```

### Branch Naming

```
feature/feature-name     # New features
bugfix/issue-description # Bug fixes
hotfix/critical-fix      # Critical production fixes
docs/documentation-update # Documentation only
```

### Pre-commit Checklist

- [ ] Code passes ESLint checks
- [ ] All tests pass
- [ ] TypeScript compiles without errors
- [ ] Code is properly formatted
- [ ] Commit message follows format
- [ ] No console.log statements in production code

## Additional Resources

- [Technical Architecture](docs/technical-architecture.md)
- [Development Roadmap](docs/development-roadmap.md)
- [API Requirements](docs/api-requirements.md)
- [Component Library](src/components/ui/README.md)

## Quick Reference

### Essential Commands

```bash
npm run dev          # Start development
npm run build        # Build production
npm test             # Run tests
npm run lint         # Check code quality
npm run format       # Format code
npm run type-check   # Check types
```

### Keyboard Shortcuts (VS Code)

- `Cmd+Shift+P` - Command palette
- `Cmd+P` - Quick file open
- `Cmd+.` - Quick fix
- `F2` - Rename symbol
- `Cmd+D` - Select next occurrence
- `Shift+Alt+F` - Format document

This documentation should be updated as the project evolves and new development patterns emerge.