# Batch 1: CI/DX Foundation

**[Batch 1] Add quality gates to CI pipeline, pre-commit hooks, and fix Playwright config**

```
You are working on camperplanning.com — a free European camper trip planning app built with React 18 + Vite + TypeScript, hosted on GitHub Pages. The project is at /Users/Archie/Desktop/camper-planner on the main branch.

## Summary
Add quality gates (test, type-check, lint) to the CI deployment pipeline, install pre-commit hooks, and fix the broken Playwright E2E configuration so tests can run.

## Context
The current `gh-pages.yml` workflow deploys to production on every push to main WITHOUT running tests, type-check, or lint first. This means broken code can ship to production. The Playwright config has a stale baseURL (`/camper-planner/` instead of `/`) from before the custom domain migration. Pre-commit hooks (husky, lint-staged) are not installed.

## Skills to Invoke
Before starting work, invoke these skills:
1. `superpowers:using-git-worktrees` — create an isolated worktree for this work
2. `superpowers:verification-before-completion` — before claiming work is done
3. `superpowers:finishing-a-development-branch` — when work is complete
4. `pr-review-toolkit:review-pr` — run on the PR before requesting merge

## Detailed Task List

### Task 1: Create a git worktree
Use `superpowers:using-git-worktrees` to create a worktree branch named `fix/ci-quality-gates` based on main.

### Task 2: Fix the CI deployment pipeline
Edit `.github/workflows/gh-pages.yml`:
1. Add a `quality-checks` job that runs BEFORE the `build` job:
   - `npm ci`
   - `npm run type-check` (runs `tsc --noEmit`)
   - `npm run lint` (NOTE: currently has 200+ warnings; change lint script or add `--max-warnings 999` temporarily so it doesn't block deploys — the lint cleanup is Batch 2's job)
   - `npx vitest run` (run tests in non-watch mode)
2. Make the `build` job depend on `quality-checks` with `needs: quality-checks`
3. Move the `env` block (affiliate secrets) from the `Copy index.html` step to the `Build application` step where it actually matters
4. Keep existing deploy and verify jobs unchanged

### Task 3: Fix Playwright configuration
Edit `playwright.config.ts`:
1. Change baseURL from `'http://localhost:3000/camper-planner/'` to `'http://localhost:3000/'`
2. Verify the webServer command starts the dev server correctly
3. Ensure the config works with both `npm run dev` locally and CI

### Task 4: Add E2E test job to CI (optional, runs after deploy)
Add to `.github/workflows/gh-pages.yml`:
1. A new `e2e-tests` job that runs AFTER the `deploy` job
2. Install Playwright browsers
3. Run E2E tests against `https://camperplanning.com/` (set `BASE_URL` env var)
4. Upload test results as artifacts
5. Mark as `continue-on-error: true` initially so it doesn't block deploys

### Task 5: Install pre-commit hooks
1. `npm install --save-dev husky lint-staged`
2. `npx husky init` (creates `.husky/` directory)
3. Create `.husky/pre-commit` that runs `npx lint-staged`
4. Add `lint-staged` config to `package.json`:
   ```json
   "lint-staged": {
     "*.{ts,tsx}": ["eslint --max-warnings 999", "prettier --check"],
     "*.{json,css,md}": ["prettier --check"]
   }
   ```
   (Use `--max-warnings 999` until Batch 2 cleans up lint — then it can be tightened to 0)

### Task 6: Verify everything works
Run these commands and confirm they pass:
- `npm run type-check`
- `npx vitest run`
- `npm run build`
- `git commit` (verify husky hook fires)

## File Boundaries
**CAN modify:**
- `.github/workflows/gh-pages.yml`
- `playwright.config.ts`
- `package.json` (add husky, lint-staged)
- `.husky/` (new directory)
- `package-lock.json` (auto-updated by npm install)

**CANNOT modify:**
- `src/` (any source code)
- `public/`
- `docs/` (except docs/plans/)
- `vite.config.ts`
- `tsconfig.json`

## Success Criteria
1. `.github/workflows/gh-pages.yml` has a quality-checks job running type-check + tests before build
2. Playwright config baseURL is `/` not `/camper-planner/`
3. `npx husky` is installed and `.husky/pre-commit` exists
4. `package.json` has lint-staged configuration
5. `npm run build` still succeeds
6. All existing tests still pass (357/357)

## Deploy Instructions
Do NOT deploy to production. Leave on branch. Create a PR targeting main.

After creating the PR, invoke `pr-review-toolkit:review-pr` to review it, then invoke `superpowers:finishing-a-development-branch`.
```
