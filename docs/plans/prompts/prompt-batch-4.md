# Batch 4: Open Bug Fixes

**[Batch 4] Fix 3 open GitHub bugs — trip calculation, feedback navigation, iframe loading**

```
You are working on camperplanning.com — a free European camper trip planning app built with React 18 + Vite + TypeScript, hosted on GitHub Pages. The project is at /Users/Archie/Desktop/camper-planner on the main branch.

## Summary
Fix the 3 open bugs reported by users via GitHub Issues. These are the only user-reported bugs and fixing them improves trust and reliability.

## Context
There are 3 open GitHub issues:
- **#6** — "I used the trip planner and it didn't calculate? I got to the final stage" (bug, auto-triage)
- **#5** — "the 'Back to planner' link on the feedback page should use the browser back button" (bug, auto-triage)
- **#4** — "Test: Feedback page iframe may not load on some browsers" (bug, auto-triage)

The auto-triage workflow has already run diagnostics (type-check, lint, tests, build all pass), meaning these are runtime/UX issues, not build-time errors.

## Skills to Invoke
Before starting work, invoke these skills:
1. `superpowers:using-git-worktrees` — create an isolated worktree for this work
2. `superpowers:systematic-debugging` — for investigating the trip calculation bug
3. `superpowers:verification-before-completion` — before claiming work is done
4. `superpowers:finishing-a-development-branch` — when work is complete
5. `pr-review-toolkit:review-pr` — run on the PR before requesting merge

## Detailed Task List

### Task 1: Create a git worktree
Use `superpowers:using-git-worktrees` to create a worktree branch named `fix/open-github-bugs` based on main.

### Task 2: Read the full bug reports
Run `gh issue view 6`, `gh issue view 5`, `gh issue view 4` to read the full bug descriptions and any auto-triage comments.

### Task 3: Fix Bug #6 — Trip calculation not working at final stage
**Investigation approach:**
1. Read the GitHub issue for exact reproduction steps
2. Read `src/components/routing/RouteCalculator.tsx` — find the calculation trigger logic
3. Read `src/components/map/MapContainer.tsx` around lines 950-1000 — the route calculation callbacks
4. The issue says "I got to the final stage" — this suggests the user added waypoints and expected a route to calculate, but it didn't. Check:
   - Is auto-calculate enabled by default?
   - Does the "Calculate Route" button work with 2+ waypoints?
   - Are there race conditions when adding waypoints quickly?
   - Does the OpenRouteService API call actually fire? Check error handling.
5. Test the fix by opening camperplanning.com in Chrome (MCP browser tools available):
   - Search for "Paris", add as waypoint
   - Search for "Lyon", add as waypoint
   - Verify route calculates (either auto or manual click)
   - Take screenshots as evidence

### Task 4: Fix Bug #5 — Feedback page "Back to planner" link
**Investigation approach:**
1. Read `src/pages/FeedbackPage.tsx`
2. Find the "Back to planner" link — it likely uses `<Link to="/">` (React Router) which causes a full page reload
3. **Fix:** Replace with `useNavigate()` and `navigate(-1)` to use browser back, OR use `window.history.back()`:
```tsx
// Option A (preferred — uses React Router):
const navigate = useNavigate();
<button onClick={() => navigate(-1)}>Back to planner</button>

// Option B (simpler):
<button onClick={() => window.history.back()}>Back to planner</button>
```
4. Consider: if the user arrived directly at /feedback (no history), `navigate(-1)` would leave the site. Add a fallback:
```tsx
const navigate = useNavigate();
const handleBack = () => {
  if (window.history.length > 1) {
    navigate(-1);
  } else {
    navigate('/');
  }
};
```

### Task 5: Fix Bug #4 — Feedback page iframe loading
**Investigation approach:**
1. Read `src/pages/FeedbackPage.tsx` — find the Google Form iframe
2. The issue says iframe may not load on some browsers. Check:
   - Is there a loading state while iframe loads?
   - Is there an error fallback if iframe fails?
   - Are there CSP or cross-origin issues?
3. **Fix:** Add loading state and error handling:
```tsx
const [iframeLoaded, setIframeLoaded] = useState(false);
const [iframeError, setIframeError] = useState(false);

<div className="relative">
  {!iframeLoaded && !iframeError && (
    <div className="absolute inset-0 flex items-center justify-center">
      <p>Loading feedback form...</p>
    </div>
  )}
  {iframeError && (
    <div className="text-center p-8">
      <p>Unable to load the feedback form.</p>
      <a href="GOOGLE_FORM_URL" target="_blank" rel="noopener noreferrer">
        Open feedback form in a new tab
      </a>
    </div>
  )}
  <iframe
    src="..."
    onLoad={() => setIframeLoaded(true)}
    onError={() => setIframeError(true)}
    className={iframeLoaded ? '' : 'opacity-0'}
  />
</div>
```
4. Also add a direct link fallback below the iframe for users who prefer not to use iframes.

### Task 6: Close the GitHub issues
After fixing each bug, add a comment to the issue referencing the PR:
```bash
gh issue comment 6 --body "Fixed in PR #XX — route calculation issue addressed by [description]"
gh issue comment 5 --body "Fixed in PR #XX — back navigation now uses browser history"
gh issue comment 4 --body "Fixed in PR #XX — added loading state and fallback link for iframe"
```
Do NOT close the issues yet — they should be closed when the PR merges.

### Task 7: Verify fixes
1. Run `npm run type-check`, `npx vitest run`, `npm run build` — all must pass
2. Test each fix locally using the dev server
3. For Bug #6: Use Claude in Chrome to test on the live site after deployment (Batch 6)

## File Boundaries
**CAN modify:**
- `src/pages/FeedbackPage.tsx`
- `src/components/routing/RouteCalculator.tsx` (if needed for bug #6)
- `src/components/map/MapContainer.tsx` (if needed for bug #6 — be careful, large file)
- `src/stores/` (if bug #6 requires store changes)

**CANNOT modify:**
- `.github/` (Batch 1's territory)
- `src/components/campsite/` (Batch 2's territory)
- `src/data/blog/` (Batch 3's territory)
- `public/` (Batch 3's territory)
- Config files (Batch 1's territory)

## Success Criteria
1. Bug #6: Route calculates successfully when 2+ waypoints are added (test with Paris → Lyon)
2. Bug #5: "Back to planner" navigates using browser back (preserves map state)
3. Bug #4: Feedback iframe has loading state and fallback link
4. `npm run type-check` passes
5. `npx vitest run` — 357/357 tests pass
6. `npm run build` succeeds
7. GitHub issues have comments referencing the fix PR

## Deploy Instructions
Do NOT deploy. Create a PR targeting main. After creating the PR, invoke `pr-review-toolkit:review-pr`.

After deploying (done in Batch 6), verify on the live site using Claude in Chrome: navigate to camperplanning.com, test the trip calculation workflow (search Paris, add waypoint, search Lyon, add waypoint, verify route calculates), navigate to /feedback and test back navigation, and check iframe loading.
```
