# Contributing to European Camper Trip Planner

Thank you for your interest in contributing to the European Camper Trip Planner! This document provides guidelines and information for contributors.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Pull Request Process](#pull-request-process)
6. [Issue Guidelines](#issue-guidelines)
7. [Feature Development](#feature-development)

## Code of Conduct

This project adheres to a code of conduct that we expect all contributors to follow:

- **Be respectful** and inclusive in all interactions
- **Be collaborative** and open to feedback
- **Focus on constructive** criticism and solutions
- **Respect different perspectives** and experience levels
- **Help create a welcoming environment** for all contributors

## Getting Started

### Prerequisites

- Node.js 18+
- npm 8+
- Git
- VS Code (recommended)

### Setup Development Environment

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/camper-planner.git
   cd camper-planner
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Verify Setup**
   ```bash
   node verify-setup.cjs
   npm run dev
   ```

4. **Install VS Code Extensions**
   Open VS Code and install recommended extensions when prompted.

## Development Workflow

### 1. Choose an Issue

- Browse [open issues](https://github.com/project/issues)
- Look for `good first issue` or `help wanted` labels
- Comment on the issue to claim it
- Ask questions if anything is unclear

### 2. Create a Branch

```bash
# Create and switch to feature branch
git checkout -b feature/issue-description

# Examples:
git checkout -b feature/add-waypoint-drag-drop
git checkout -b bugfix/fix-route-calculation
git checkout -b docs/update-api-docs
```

### 3. Make Changes

Follow the [Development Guide](DEVELOPMENT.md) for detailed instructions on:

- Creating components
- Writing tests
- Using state management
- Following code standards

### 4. Test Your Changes

```bash
# Run all quality checks
npm run lint
npm run type-check
npm test

# Test in browser
npm run dev
```

### 5. Commit Changes

Use conventional commit format:

```bash
git add .
git commit -m "feat(map): add waypoint drag and drop functionality

- Add drag handlers to waypoint markers
- Implement reorder logic in route store
- Add visual feedback during drag operations
- Include tests for drag functionality

Closes #123"
```

### 6. Push and Create PR

```bash
git push origin feature/issue-description
```

Then create a Pull Request through GitHub interface.

## Coding Standards

### TypeScript

- **Use strict TypeScript** - no `any` types
- **Define interfaces** for all data structures
- **Add return types** to functions
- **Use generics** where appropriate

```typescript
// ✅ Good
interface WaypointData {
  id: string;
  lat: number;
  lng: number;
  name: string;
}

const addWaypoint = (waypoint: WaypointData): void => {
  // Implementation
};

// ❌ Avoid
const addWaypoint = (waypoint: any) => {
  // Implementation
};
```

### React Components

- **Use functional components** with hooks
- **Follow component template** structure
- **Add proper TypeScript interfaces**
- **Include accessibility attributes**

```typescript
// ✅ Good component structure
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  onClick,
  children,
  disabled = false
}) => {
  return (
    <button
      className={cn('btn', `btn-${variant}`)}
      onClick={onClick}
      disabled={disabled}
      aria-label={typeof children === 'string' ? children : undefined}
    >
      {children}
    </button>
  );
};
```

### Testing

- **Write tests for all components**
- **Test user interactions**
- **Include edge cases**
- **Use descriptive test names**

```typescript
describe('WaypointManager', () => {
  it('adds new waypoint when map is clicked', () => {
    const mockOnAdd = vi.fn();
    render(<WaypointManager onWaypointAdd={mockOnAdd} />);

    fireEvent.click(screen.getByTestId('map-container'));
    expect(mockOnAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        lat: expect.any(Number),
        lng: expect.any(Number)
      })
    );
  });
});
```

### Styling

- **Use Tailwind CSS classes**
- **Responsive design first**
- **Consistent spacing and typography**
- **Use `cn()` utility for conditional classes**

```typescript
// ✅ Good styling
const Modal: React.FC<ModalProps> = ({ isOpen, size = 'md' }) => {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-black bg-opacity-50',
        isOpen ? 'block' : 'hidden'
      )}
    >
      <div
        className={cn(
          'bg-white rounded-lg shadow-xl p-6',
          {
            'max-w-sm': size === 'sm',
            'max-w-md': size === 'md',
            'max-w-lg': size === 'lg',
          }
        )}
      >
        {children}
      </div>
    </div>
  );
};
```

## Pull Request Process

### Before Submitting

- [ ] Code follows project standards
- [ ] All tests pass (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] TypeScript compiles (`npm run type-check`)
- [ ] Feature is behind appropriate feature flag
- [ ] Documentation is updated if needed
- [ ] Commit messages follow conventional format

### PR Description Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots to show visual changes.

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Tests added for new functionality
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)

Closes #[issue-number]
```

### Review Process

1. **Automated checks** must pass (CI/CD)
2. **At least one maintainer** review required
3. **Address feedback** promptly and respectfully
4. **Squash commits** if requested
5. **Merge** will be handled by maintainers

## Issue Guidelines

### Reporting Bugs

Use the bug report template:

```markdown
**Bug Description**
A clear description of what the bug is.

**Steps to Reproduce**
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. chrome, safari]
- Node.js version: [e.g. 18.17.0]
- Project version: [e.g. 1.0.0]
```

### Feature Requests

Use the feature request template:

```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Any other context or screenshots about the feature request.

**Implementation Notes**
Technical considerations or suggestions for implementation.
```

## Feature Development

### Phase-Based Development

This project follows a phase-based approach:

- **Phase 1**: Foundation (Complete)
- **Phase 2**: Interactive Mapping (Complete)
- **Phase 3**: Vehicle & Routing (Complete)
- **Phase 4**: Campsite Integration (Complete)
- **Phase 5**: Planning Tools (Current)
- **Phase 6**: Export & Polish

### Feature Flags

All new features must be behind feature flags:

```typescript
// Add to src/config/features.ts
export const FeatureFlags = {
  // Existing flags...
  NEW_FEATURE: false, // Phase X: Description
} as const;

// Use in components
if (!FeatureFlags.NEW_FEATURE) {
  return <FeatureDisabled name="NEW_FEATURE" />;
}
```

### API Integration

Follow the service layer pattern for external APIs:

```typescript
class NewService extends DataService {
  async fetchData(): Promise<Data> {
    await this.checkRateLimit('new-service');
    // Implementation
  }
}
```

## Development Tools

### Component Generation

Use the provided script for consistency:

```bash
./create-component.sh ComponentName [type] ["Description"]
```

### Available Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview build

# Quality
npm run lint             # Check code quality
npm run lint:fix         # Fix linting issues
npm run format           # Format code
npm run type-check       # Check TypeScript

# Testing
npm test                 # Run tests
npm run test:ui          # Interactive test UI
npm run test:coverage    # Coverage report
```

## Getting Help

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Pull Request Comments**: Code-specific discussions

### Documentation

- [README.md](README.md) - Project overview
- [DEVELOPMENT.md](DEVELOPMENT.md) - Detailed development guide
- [Technical Architecture](docs/technical-architecture.md)
- [Development Roadmap](docs/development-roadmap.md)

### Common Questions

**Q: How do I add a new page?**
A: Use `./create-component.sh PageName page` and add route to `App.tsx`

**Q: How do I add a new API service?**
A: Extend `DataService` class and follow the service layer pattern

**Q: How do I handle state management?**
A: Use Zustand stores with persistence where appropriate

**Q: What about internationalization?**
A: Add translations to `src/i18n/locales/` and use `useTranslation` hook

## Recognition

Contributors are recognized in the following ways:

- **Contributors section** in README.md
- **All-Contributors** bot for automatic recognition
- **Release notes** mention significant contributions
- **Community highlights** for exceptional contributions

## License

By contributing, you agree that your contributions will be licensed under the same MIT License that covers the project. See [LICENSE](LICENSE) file for details.

---

Thank you for contributing to make European camper trip planning better for everyone! 🚗⛺