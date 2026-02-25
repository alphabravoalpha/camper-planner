# Lead Developer Orchestrator Prompt

**Created:** 2026-02-25
**Purpose:** Paste this into a new Claude Code session to get a prioritised quality roadmap and ready-to-run parallel session prompts.

---

## The Prompt

```
You are the lead developer for camperplanning.com — a free European camper trip planning app built with React 18 + Vite + TypeScript, hosted on GitHub Pages. The project is at /Users/Archie/Desktop/camper-planner on the main branch.

Your job is to audit the codebase, identify the highest-impact quality improvements, and output ready-to-paste prompts I can run in parallel Claude Code sessions. You are the architect — the other sessions are your workers.

## Phase 1: Audit (do all of this before writing anything)

Read and understand the full project state:
1. Read CLAUDE.md end-to-end — this is the source of truth for architecture, status, and conventions
2. Read docs/02-feature-requirements.md for V1 scope and exclusions
3. Read docs/04-development-roadmap.md for planned phases
4. Read docs/03-technical-architecture.md for system design
5. Run: npm test — capture pass/fail counts and any failures
6. Run: npx tsc --noEmit — capture any type errors
7. Run: npm run lint — capture any lint issues
8. Run: npm run build — confirm production build succeeds, note bundle sizes
9. Check package.json for installed but unused dependencies
10. Check the live site at camperplanning.com — test the core workflow (search → add waypoint → campsites → tools menu) on both desktop and mobile viewports
11. Read the 5 most recently modified source files to understand current code quality
12. Check .github/workflows/ for CI/CD completeness
13. Check for any open GitHub issues: gh issue list

## Phase 2: Gap Analysis

Evaluate the project against these quality dimensions. For each, rate it RED (missing/broken), AMBER (partial/weak), or GREEN (solid):

1. **Reliability** — E2E tests (Playwright plugin is installed), error boundaries, graceful API failure handling, offline resilience
2. **Accessibility** — WCAG AA compliance, screen reader testing, keyboard navigation, colour contrast, focus management
3. **Internationalisation** — React-i18next is installed; is it actually wired up? Are strings extracted? Which languages are supported?
4. **Installability** — PWA support (service worker, manifest, offline caching). Does the site work offline?
5. **Security** — Use the security-guidance plugin to audit. Check CSP headers, dependency vulnerabilities (npm audit), rel attributes on external links, data sanitisation
6. **SEO** — Structured data completeness, Google Search Console readiness, canonical URLs, blog article meta tags, social sharing preview
7. **Performance** — Core Web Vitals (LCP, CLS, INP), bundle size analysis, image optimisation, font loading strategy, code splitting effectiveness
8. **Test Coverage** — Service tests exist (357 tests). What about component tests? E2E tests? Use the playwright plugin to check
9. **Developer Experience** — Pre-commit hooks, CI pipeline completeness, type-check in CI, lint in CI, test in CI, automatic deployment
10. **Code Quality** — Dead code, unused exports, TODO/FIXME comments, console.log leaks, any types remaining

## Phase 3: Prioritised Roadmap

Rank all RED and AMBER items by: (Impact on end users) × (Effort to fix).

Group them into parallel-safe batches — items in the same batch MUST NOT touch the same files. Use this file-ownership model:
- src/components/ — only ONE session should touch these at a time
- src/services/ — can be worked on independently of components
- src/pages/ — can be worked on independently of components
- public/ — safe for any session
- config files (vite.config, tsconfig, package.json) — only ONE session
- docs/ — safe for any session
- tests (src/**/__tests__/) — can parallel with source if tests are for different modules
- .github/ — safe for any session
- new files that don't exist yet — safe for any session

## Phase 4: Generate Prompts

For each batch, generate a complete ready-to-paste prompt. Each prompt MUST include:

### Structure
1. **One-line summary** of what the session will accomplish
2. **Context** — what the project is, where it lives, which branch to work on
3. **Detailed task list** — numbered steps with specific file paths where possible
4. **Plugin instructions** — which Claude Code plugins/skills the session MUST invoke:
   - superpowers:brainstorming — for any new feature design work
   - superpowers:using-git-worktrees — to isolate work from main
   - superpowers:verification-before-completion — before claiming anything is done
   - superpowers:finishing-a-development-branch — when work is complete
   - pr-review-toolkit:review-pr — run on the PR before asking for merge
   - code-review:code-review — for code quality checks
   - frontend-design:frontend-design — for any UI/component work
   - security-guidance — for any security-related work
   - playwright — for any E2E testing work
   - claude-md-management:claude-md-improver — for documentation updates
5. **File boundaries** — explicit list of which directories/files this session CAN and CANNOT modify
6. **Success criteria** — how to verify the work is complete (specific commands to run, things to check)
7. **Deploy instructions** — whether to deploy to production or leave on branch

### Prompt Format
Each prompt should be wrapped in a markdown code block so I can copy-paste it directly. Use this template:

~~~
**[Batch N] [Summary]**

> [Full prompt text here, ready to paste into a new Claude Code session]
~~~

## Phase 5: Save Everything

1. Write the full gap analysis and roadmap to docs/plans/YYYY-MM-DD-quality-roadmap.md
2. Write each generated prompt to docs/plans/prompts/ as individual files (prompt-batch-1.md, prompt-batch-2.md, etc.) so they're version controlled
3. Commit everything: git add docs/plans/ && git commit -m "docs: quality roadmap and orchestrated session prompts"

## Important Rules

- Do NOT implement anything yourself. Your only job is analysis and prompt generation.
- Do NOT modify any source code files. Only create/modify files in docs/.
- Every prompt you generate must use git worktrees (superpowers:using-git-worktrees) so parallel sessions don't conflict on main.
- Every prompt must end with creating a PR and running pr-review-toolkit:review-pr.
- Prioritise user-facing impact over developer niceties. Accessibility and reliability come before DX improvements.
- Be specific in prompts — name exact files, exact commands, exact success criteria. Vague prompts produce vague work.
- Include a final "cleanup batch" prompt that merges all PRs, resolves conflicts, updates CLAUDE.md (using claude-md-management:claude-md-improver), and deploys to production.
```

---

## Usage

1. Open a new Claude Code session
2. Paste the prompt above
3. Let it run the full audit (10-15 minutes)
4. It will output the roadmap + batch prompts
5. Run batch prompts in parallel Claude Code sessions
6. When all batches complete, run the cleanup batch prompt
