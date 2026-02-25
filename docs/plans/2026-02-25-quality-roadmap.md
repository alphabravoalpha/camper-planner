# Quality Roadmap — camperplanning.com

**Date:** 2026-02-25
**Author:** Lead Developer Audit (Claude Code Orchestrator)
**Branch:** main (commit 0f133b9)

---

## Phase 1: Audit Summary

### Build & Test Health

| Check | Result |
|-------|--------|
| **TypeScript** | **PASS** — zero type errors (`tsc --noEmit` clean) |
| **Tests** | **PASS** — 357/357 tests pass (5.2s, 13 test files) |
| **Lint** | **FAIL** — 200+ warnings (0 errors). `--max-warnings 0` causes exit code 1 |
| **Build** | **PASS** — production build succeeds in 2.6s |
| **Bundle** | Total gzipped: ~310KB (react-vendor 67KB, map-vendor 45KB, index 53KB, PlannerPage 98KB) |

### Lint Warning Breakdown (200+ warnings)

| Category | Count | Severity |
|----------|-------|----------|
| `jsx-a11y/label-has-associated-control` | ~30 | Accessibility |
| `@typescript-eslint/no-explicit-any` | ~25 | Type safety |
| `@typescript-eslint/ban-ts-comment` | ~20 | Code quality |
| `no-console` | ~15 | Production leaks |
| `jsx-a11y/click-events-have-key-events` | ~10 | Accessibility |
| `jsx-a11y/no-static-element-interactions` | ~10 | Accessibility |
| `react-refresh/only-export-components` | ~5 | DX |
| `@typescript-eslint/no-unused-vars` | ~5 | Dead code |
| Other | ~80 | Mixed |

### Open GitHub Issues (3)

1. **#6** — Bug: trip planner didn't calculate (final stage)
2. **#5** — Bug: "Back to planner" link on feedback page should use browser back
3. **#4** — Bug: Feedback page iframe may not load on some browsers

### CI/CD Workflows (3)

1. `gh-pages.yml` — Deploy on push to main. **Missing:** no lint/test/type-check gates before deploy
2. `bug-triage.yml` — Runs diagnostics on bug issues (type-check, lint, tests, build)
3. `claude-fix.yml` — Claude auto-fix on @claude mentions

### Live Site Testing (camperplanning.com)

| Feature | Desktop (1440x900) | Mobile (375x812) |
|---------|-------------------|------------------|
| Page load | Clean, no console errors | Clean |
| EmptyStateCard | Shows correctly | Shows correctly |
| Search Paris | Returns locations + campsites | N/A (not re-tested) |
| Add waypoint | Paris added, map zooms | Waypoint persisted |
| Route Calculation panel | Appears automatically | Appears |
| Tools menu | Opens correctly | Bottom toolbar icons |
| Blog/Guides page | Professional design, filters work | Not tested |
| **Broken blog images** | **Norway + Croatia articles show alt text** | N/A |

---

## Phase 2: Gap Analysis

### 1. Reliability — AMBER

- E2E tests exist (18 Playwright tests) but **baseURL is stale** (`/camper-planner/` not `/`)
- E2E tests never run in CI — not in deployment pipeline
- Error boundaries exist but not verified for all paths
- API fallback strategies configured but untested
- 3 open bugs unfixed
- No monitoring or error reporting

### 2. Accessibility — AMBER

- `jsx-a11y` plugin catching ~50 real warnings
- ~30 form labels not associated with controls
- ~10 click handlers without keyboard listeners
- `autoFocus` used (a11y concern)
- Good ARIA on ToolsMenu, dialogs, close buttons
- Focus ring utilities + reduced-motion support exist
- No colour contrast audit or screen reader testing

### 3. Internationalisation — AMBER

- react-i18next configured with ~85 keys
- `MULTI_LANGUAGE_COMPLETE: false` disables switching
- Only 4 components use `useTranslation()`
- **99% of UI strings hardcoded English**
- Framework ready for V2 but unusable until strings extracted

### 4. Installability (PWA) — RED

- No manifest.json
- No service worker
- No offline caching
- Feature requirements claim "works offline" — NOT true
- PWA listed as V2 consideration

### 5. Security — GREEN

- `npm audit` — zero vulnerabilities
- External links use `rel="noopener noreferrer"`
- Affiliate links use `rel="sponsored noopener noreferrer"`
- Blog renderer uses hardcoded data only (safe)
- No CSP headers (minor for static site)
- No cookies, no tracking, localStorage only

### 6. SEO — GREEN

- Full meta tags, OG tags, Twitter Cards, JSON-LD
- SEOHead component for dynamic blog meta
- sitemap.xml (19 URLs, auto-generated)
- robots.txt configured
- OG sharing image exists
- 404.html for SPA routing

### 7. Performance — GREEN

- Bundle ~310KB gzipped (good for map-heavy app)
- Code splitting working (PlannerPage, blog pages)
- esbuild.pure strips console.log
- Map vendor chunk separated (45KB)
- System fonts (no custom font downloads)
- Lighthouse optimisations done

### 8. Test Coverage — AMBER

- Service tests: 357 tests, 86% coverage — EXCELLENT
- Component tests: Only Button.test.tsx (10 tests)
- E2E tests: 2 files (18 tests) but config broken
- No tests for MapContainer, ToolsMenu, OnboardingFlow, CampsiteFilter
- Infrastructure exists but UI layer largely untested

### 9. Developer Experience — AMBER

- ESLint + Prettier configured but lint fails (200+ warnings)
- No pre-commit hooks
- CI deploys without tests/lint/type-check
- Bug triage + Claude auto-fix workflows good
- TypeScript strict mode, zero errors
- CLAUDE.md comprehensive

### 10. Code Quality — AMBER

- ~25 `any` types (Leaflet handlers, filters)
- ~20 `@ts-ignore` should be `@ts-expect-error`
- ~15 console.log in source (stripped by build)
- Only 2 TODO comments (minimal debt)
- V2 code properly isolated
- Duplicate search results for cities (API dedup issue)

### 11. Visual Polish — AMBER

- Planner UI professional and clean
- Blog/Guides page well-designed
- **2-3 blog images broken** (Unsplash CDN failing)
- All blog images external — unreliable long-term
- Mobile planner works well
- Header branding clean

---

## Phase 3: Prioritised Roadmap

### Priority Ranking (Impact x Effort)

| # | Item | Rating | Impact | Effort | Score |
|---|------|--------|--------|--------|-------|
| 1 | Fix CI pipeline — add quality gates before deploy | AMBER | HIGH | LOW | **9** |
| 2 | Fix broken blog images — self-host from Unsplash | AMBER | HIGH | LOW | **9** |
| 3 | Fix lint warnings — accessibility + type safety | AMBER | HIGH | MED | **8** |
| 4 | Fix Playwright config + run E2E in CI | AMBER | HIGH | MED | **8** |
| 5 | Fix 3 open GitHub bugs | AMBER | HIGH | MED | **7** |
| 6 | Add pre-commit hooks (husky + lint-staged) | AMBER | MED | LOW | **7** |
| 7 | PWA: manifest + service worker + offline | RED | MED | MED | **6** |
| 8 | Extract i18n strings from hardcoded English | AMBER | LOW | HIGH | **3** |
| 9 | Add component tests for critical UI | AMBER | MED | HIGH | **4** |
| 10 | Add CSP headers | GREEN | LOW | LOW | **2** |

### Batch Grouping (Parallel-Safe)

**Batch 1: CI/DX Foundation** (config files, .github/)
- Fix CI pipeline: add test/lint/type-check before deploy
- Add pre-commit hooks (husky + lint-staged)
- Fix Playwright baseURL
- Add E2E test step to CI pipeline

**Batch 2: Lint & Accessibility Cleanup** (src/components/)
- Fix all ~50 jsx-a11y warnings
- Replace ~20 @ts-ignore with @ts-expect-error
- Remove ~15 console.log statements
- Fix ~25 any types with proper types
- Fix no-unused-vars warnings

**Batch 3: Blog Image Reliability** (public/, src/data/blog/)
- Download all 10 Unsplash images to public/images/blog/
- Update blog data files to local paths
- Optimise images (WebP, responsive sizes)
- Add image fallback handling

**Batch 4: Open Bug Fixes** (src/components/, src/pages/)
- Fix #6: Trip calculation failure
- Fix #5: Feedback page back navigation
- Fix #4: Feedback iframe loading

**Batch 5: PWA & Offline** (public/, config files, new files)
- Add manifest.json with icons
- Add service worker (vite-plugin-pwa)
- Cache map tiles and static assets
- Add install prompt UI

**Batch 6: Cleanup & Deploy** (docs/, CLAUDE.md, merge PRs)
- Merge all PRs from batches 1-5
- Resolve merge conflicts
- Update CLAUDE.md
- Deploy and verify on live site

---

## Phase 4: Generated Prompts

See individual prompt files in `docs/plans/prompts/`:

1. `prompt-batch-1.md` — CI/DX Foundation
2. `prompt-batch-2.md` — Lint & Accessibility Cleanup
3. `prompt-batch-3.md` — Blog Image Reliability
4. `prompt-batch-4.md` — Open Bug Fixes
5. `prompt-batch-5.md` — PWA & Offline Support
6. `prompt-batch-6.md` — Cleanup, Merge & Deploy
