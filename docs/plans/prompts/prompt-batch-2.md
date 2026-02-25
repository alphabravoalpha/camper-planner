# Batch 2: Lint & Accessibility Cleanup

**[Batch 2] Fix all 200+ ESLint warnings — accessibility, type safety, and code quality**

```
You are working on camperplanning.com — a free European camper trip planning app built with React 18 + Vite + TypeScript, hosted on GitHub Pages. The project is at /Users/Archie/Desktop/camper-planner on the main branch.

## Summary
Fix all ~200 ESLint warnings so `npm run lint` passes with `--max-warnings 0`. Focus areas: accessibility (jsx-a11y), type safety (no-explicit-any), code cleanliness (ban-ts-comment, no-console, no-unused-vars).

## Context
The project uses ESLint 9 with jsx-a11y, typescript-eslint, react, and prettier plugins. Running `npm run lint` currently reports 200+ warnings across ~30 files. The lint script uses `--max-warnings 0` which causes it to fail. These warnings represent real accessibility gaps (forms without labels, click handlers without keyboard support) and code quality issues (any types, @ts-ignore, console.log leaks).

## Skills to Invoke
Before starting work, invoke these skills:
1. `superpowers:using-git-worktrees` — create an isolated worktree for this work
2. `superpowers:verification-before-completion` — before claiming work is done
3. `superpowers:finishing-a-development-branch` — when work is complete
4. `pr-review-toolkit:review-pr` — run on the PR before requesting merge

## Detailed Task List

### Task 1: Create a git worktree
Use `superpowers:using-git-worktrees` to create a worktree branch named `fix/lint-accessibility-cleanup` based on main.

### Task 2: Run lint and categorise all warnings
Run `npm run lint 2>&1` and categorise every warning. The main categories are:

#### Category A: jsx-a11y/label-has-associated-control (~30 warnings)
Files: `CampsiteControls.tsx`, `CampsiteFilter.tsx`, `WaypointManager.tsx`, `VehicleProfileSidebar.tsx`, `CostCalculator.tsx`, `TripCostCalculator.tsx`, `PlanningTools.tsx`
**Fix:** Add `htmlFor` attributes to `<label>` elements pointing to their corresponding `<input>` `id`, OR wrap the input inside the label. Example:
```tsx
// Before (broken):
<label>Distance</label>
<input type="range" />

// After (fixed):
<label htmlFor="distance-range">Distance</label>
<input id="distance-range" type="range" />
```

#### Category B: jsx-a11y/click-events-have-key-events + no-static-element-interactions (~20 warnings)
Files: `WaypointCluster.tsx`, `WaypointManager.tsx`, `MapContainer.tsx`
**Fix:** Add `onKeyDown` handler + `role` + `tabIndex` to interactive non-button elements:
```tsx
// Before (broken):
<div onClick={handleClick}>...</div>

// After (fixed):
<div onClick={handleClick} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }} role="button" tabIndex={0}>...</div>
```
Or better: replace `<div>` with `<button>` where semantically appropriate.

#### Category C: @typescript-eslint/no-explicit-any (~25 warnings)
Files: `CampsiteFilter.tsx`, `CampsiteLayer.tsx`, `CampsiteIcons.ts`, `WaypointManager.tsx`, `MapContainer.tsx`, `TripWizard.tsx`, `RouteExporter.tsx`, various services
**Fix:** Replace `any` with proper types. Common patterns:
- Leaflet events: use `L.LeafletMouseEvent` or `L.LeafletEvent`
- DOM events: use `React.MouseEvent<HTMLElement>` or `React.ChangeEvent<HTMLInputElement>`
- Unknown data: use `unknown` and narrow with type guards
- Map options: use `L.MapOptions`

#### Category D: @typescript-eslint/ban-ts-comment (~20 warnings)
Files: `MapContainer.tsx`, `WaypointManager.tsx`, `WaypointCluster.tsx`, `TripWizard.tsx`
**Fix:** Replace `@ts-ignore` with `@ts-expect-error` with an explanation:
```tsx
// Before:
// @ts-ignore
someCall();

// After:
// @ts-expect-error - Leaflet types don't expose internal _map property
someCall();
```

#### Category E: no-console (~15 warnings)
Files: `CampsiteFilter.tsx`, `CampsiteLayer.tsx`, `MapContainer.tsx`, `CampsiteSearch.tsx`, `performance.ts`, `responsive.ts`, `generate-sitemap.ts`
**Fix:**
- For `generate-sitemap.ts` (build script): Add `// eslint-disable-next-line no-console` since this is a Node script
- For all others: Remove the console.log/debug statements. The build already strips them via esbuild.pure, but they should not be in source.
- Keep `console.warn` and `console.error` for legitimate error reporting.

#### Category F: no-unused-vars (~5 warnings)
Files: `CampsiteControls.tsx`, `CampsiteIcons.ts`
**Fix:** Remove unused variables or prefix with `_` if intentionally unused.

#### Category G: react-refresh/only-export-components (~5 warnings)
Files: `CampsiteFilter.tsx`
**Fix:** Move non-component exports (constants, types) to a separate file, or add eslint-disable comment if the export is intentional.

#### Category H: no-empty-pattern (~1 warning)
File: `CampsiteLayer.tsx`
**Fix:** Replace `{}` with appropriate parameter name or remove destructuring.

#### Category I: jsx-a11y/no-autofocus (~1 warning)
File: `WaypointManager.tsx`
**Fix:** Remove `autoFocus` prop or add eslint-disable with explanation if autoFocus is essential for UX.

### Task 3: Fix all warnings systematically
Work through each file, fixing all warnings. Do NOT introduce new functionality — purely cleanup.

### Task 4: Verify lint passes cleanly
Run `npm run lint` — it MUST exit with code 0 (zero warnings).
Run `npm run type-check` — must still pass.
Run `npx vitest run` — all 357 tests must still pass.
Run `npm run build` — must succeed.

## File Boundaries
**CAN modify:**
- `src/components/campsite/CampsiteControls.tsx`
- `src/components/campsite/CampsiteFilter.tsx`
- `src/components/campsite/CampsiteIcons.ts`
- `src/components/campsite/CampsiteLayer.tsx`
- `src/components/campsite/SimpleCampsiteLayer.tsx`
- `src/components/campsite/CampsiteSearch.tsx`
- `src/components/map/MapContainer.tsx`
- `src/components/map/WaypointManager.tsx`
- `src/components/map/WaypointCluster.tsx`
- `src/components/routing/VehicleProfileSidebar.tsx`
- `src/components/routing/CostCalculator.tsx`
- `src/components/routing/RouteExporter.tsx`
- `src/components/routing/RouteInformation.tsx`
- `src/components/planning/TripCostCalculator.tsx`
- `src/components/planning/PlanningTools.tsx`
- `src/components/wizard/TripWizard.tsx`
- `src/utils/performance.ts`
- `src/utils/responsive.ts`
- `scripts/generate-sitemap.ts`
- Any other file that has lint warnings

**CANNOT modify:**
- `.github/` (Batch 1's territory)
- `public/`
- `src/data/blog/` (Batch 3's territory)
- `src/pages/FeedbackPage.tsx` (Batch 4's territory)
- `package.json` (unless adding a @types package)
- Config files (vite.config.ts, tsconfig.json, playwright.config.ts)

## Success Criteria
1. `npm run lint` exits with code 0 (zero warnings)
2. `npm run type-check` passes (zero errors)
3. `npx vitest run` — 357/357 tests pass
4. `npm run build` succeeds
5. No new functionality added — purely lint/a11y/type-safety fixes
6. No eslint-disable-next-line for accessibility rules (actually fix the issues)

## Deploy Instructions
Do NOT deploy. Create a PR targeting main. After creating the PR, invoke `pr-review-toolkit:review-pr` to review it, then invoke `superpowers:finishing-a-development-branch`.
```
