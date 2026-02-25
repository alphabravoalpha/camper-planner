# Batch 6: Cleanup, Merge & Deploy

**[Batch 6] Merge all PRs, resolve conflicts, update CLAUDE.md, deploy to production, and verify on live site**

```
You are working on camperplanning.com — a free European camper trip planning app built with React 18 + Vite + TypeScript, hosted on GitHub Pages. The project is at /Users/Archie/Desktop/camper-planner on the main branch.

## Summary
This is the final batch. Merge PRs from Batches 1-5, resolve any conflicts, update CLAUDE.md, deploy to production, and verify everything on the live site.

## Context
Five parallel worker sessions have created PRs:
1. **Batch 1:** CI quality gates, pre-commit hooks, Playwright config fix (branch: fix/ci-quality-gates)
2. **Batch 2:** Lint & accessibility cleanup — 200+ warnings fixed (branch: fix/lint-accessibility-cleanup)
3. **Batch 3:** Blog images self-hosted from Unsplash (branch: fix/blog-images-self-host)
4. **Batch 4:** 3 open bug fixes (branch: fix/open-github-bugs)
5. **Batch 5:** PWA & offline support (branch: feature/pwa-offline)

These branches may have conflicts, particularly:
- Batch 1 + 5 both touch `vite.config.ts` and `package.json`
- Batch 2 + 4 may both touch `src/components/map/MapContainer.tsx`
- Batch 3 touches `src/data/blog/` and `public/` which should be conflict-free

## IMPORTANT: Run this batch AFTER all other batches have completed their PRs.

## Skills to Invoke
Before starting work, invoke these skills:
1. `superpowers:verification-before-completion` — before claiming work is done
2. `claude-md-management:revise-claude-md` — to update CLAUDE.md with new capabilities
3. `pr-review-toolkit:review-pr` — final review of merged state

## Detailed Task List

### Task 1: List all open PRs
```bash
gh pr list --state open
```
Verify all 5 PRs exist and have passed their reviews.

### Task 2: Merge PRs in order (least conflicts first)
Merge in this order to minimise conflicts:

**Step 1: Merge Batch 3 (blog images) — no conflicts expected**
```bash
gh pr merge <batch-3-pr-number> --merge
```

**Step 2: Merge Batch 4 (bug fixes) — may conflict with Batch 2 on MapContainer.tsx**
```bash
gh pr merge <batch-4-pr-number> --merge
```

**Step 3: Merge Batch 1 (CI/DX) — may conflict with Batch 5 on package.json**
```bash
gh pr merge <batch-1-pr-number> --merge
```

**Step 4: Merge Batch 2 (lint cleanup) — may need rebase after Batch 4**
```bash
# Pull latest main
git checkout main && git pull
# Check if Batch 2 PR has conflicts
gh pr view <batch-2-pr-number>
# If conflicts, checkout the branch, rebase, force push:
git checkout fix/lint-accessibility-cleanup
git rebase main
# Resolve any conflicts (Batch 2's lint fixes should take precedence for style, Batch 4's bug fixes for logic)
git push --force-with-lease
# Then merge
gh pr merge <batch-2-pr-number> --merge
```

**Step 5: Merge Batch 5 (PWA) — may need rebase after Batch 1**
```bash
git checkout main && git pull
git checkout feature/pwa-offline
git rebase main
# Resolve conflicts in vite.config.ts (combine both changes) and package.json (combine dependencies)
git push --force-with-lease
gh pr merge <batch-5-pr-number> --merge
```

### Task 3: Close GitHub issues
After bug fix PR is merged:
```bash
gh issue close 6 --comment "Fixed in merged PR — route calculation issue resolved"
gh issue close 5 --comment "Fixed in merged PR — back navigation uses browser history"
gh issue close 4 --comment "Fixed in merged PR — iframe has loading state and fallback link"
```

### Task 4: Verify merged state
On the main branch after all merges:
```bash
git checkout main && git pull
npm ci
npm run type-check      # Must pass
npm run lint            # Must pass with 0 warnings (Batch 2 fixed them all)
npx vitest run          # All 357+ tests must pass
npm run build           # Must succeed
```

### Task 5: Update CLAUDE.md
Invoke `claude-md-management:revise-claude-md` to update CLAUDE.md with:

**New capabilities to document:**
- PWA support (manifest, service worker, offline caching) — added by Batch 5
- Pre-commit hooks (husky + lint-staged) — added by Batch 1
- CI quality gates (type-check + tests before deploy) — added by Batch 1
- E2E tests run post-deploy — added by Batch 1
- Blog images self-hosted in `public/images/blog/` — added by Batch 3
- All lint warnings fixed (0 warnings) — done by Batch 2

**Bugs fixed to document:**
- Bug #6: Trip calculation fixed
- Bug #5: Feedback page navigation fixed
- Bug #4: Feedback iframe loading fixed

**Updated sections:**
- Development Commands: add info about husky
- Architecture: add PWA section
- Testing: note E2E tests now run in CI
- Current Status: update with these improvements

### Task 6: Deploy to production
The CI pipeline should auto-deploy on push to main (gh-pages.yml). Verify the deploy succeeds:
```bash
# Check GitHub Actions
gh run list --limit 5
# Watch the latest run
gh run watch
```

### Task 7: Verify on live site using Claude in Chrome
This is CRITICAL. After deployment, wait 60 seconds for CDN propagation, then:

1. **Get Chrome tab context:**
   Use `tabs_context_mcp` to get available tabs, then `tabs_create_mcp` to create a new tab.

2. **Desktop verification (1440x900):**
   - Navigate to camperplanning.com
   - Take screenshot — verify planner loads cleanly
   - Search for "Paris" → add as waypoint
   - Search for "Lyon" → add as waypoint
   - Verify route calculates (Bug #6 fix)
   - Click Tools menu (wrench icon) — verify it opens
   - Toggle campsites on — verify markers appear
   - Check console for errors (read_console_messages)

3. **Blog page verification:**
   - Navigate to camperplanning.com/guides
   - Take screenshot — verify ALL 10 blog cards show images (Batch 3 fix)
   - Scroll down to check Norway Fjords and Croatia cards specifically
   - Check for any 404 errors in console

4. **Feedback page verification:**
   - Navigate to camperplanning.com/feedback
   - Verify iframe loads with loading state (Bug #4 fix)
   - Click "Back to planner" — verify it uses browser back (Bug #5 fix)

5. **Mobile verification (375x812):**
   - Use resize_window to 375x812
   - Navigate to camperplanning.com
   - Take screenshot — verify mobile layout
   - Verify bottom toolbar shows
   - Navigate to camperplanning.com/guides — verify blog cards

6. **PWA verification:**
   - In Chrome DevTools (or via javascript_tool), check:
     - `navigator.serviceWorker.controller` is not null
     - Manifest is loaded
   - Or take a screenshot of Chrome's install prompt if it appears

### Task 8: Final commit
If any fixes were needed during verification, commit them:
```bash
git add -A
git commit -m "fix: post-merge cleanup and verification fixes"
git push
```

### Task 9: Generate sitemap
Verify the sitemap was regenerated correctly:
```bash
npm run build  # This runs prebuild which generates sitemap
```
Check that `public/sitemap.xml` still has all 19 URLs.

## File Boundaries
**CAN modify:**
- Everything (this is the integration batch)
- CLAUDE.md (documentation update)
- Any file needed for conflict resolution

## Success Criteria
1. All 5 PRs merged into main
2. `npm run type-check` — zero errors
3. `npm run lint` — zero warnings
4. `npx vitest run` — all tests pass
5. `npm run build` — succeeds, generates service worker
6. CLAUDE.md updated with new capabilities
7. GitHub Issues #4, #5, #6 closed
8. Live site verified: planner works, blog images show, bugs fixed, PWA active
9. Mobile viewport verified
10. No console errors on live site

## Deploy Instructions
Deploy to production via push to main (CI handles it). Verify deployment succeeds via `gh run list`.
```
