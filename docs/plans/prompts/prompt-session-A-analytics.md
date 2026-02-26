# Session A: Analytics & Measurement

## Role

You are a senior frontend developer working on camperplanning.com. Your task is
to add analytics and measurement to a site that currently has zero tracking.

## Context

- Site is live at camperplanning.com (React 18 + Vite + TypeScript, GitHub
  Pages)
- There is a fully built but disabled V2 analytics framework at
  `v2-features/utils/analytics.ts` (517 lines, GDPR-compliant, consent-based)
- Currently: zero analytics, zero tracking, zero measurement
- Privacy Policy page explicitly says "No user accounts, no tracking cookies, no
  analytics" — this will need updating (but NOT by this session — Session D
  handles that)

## Three Deliverables

### 1. Cloudflare Web Analytics

Add this script tag to `index.html` just before `</body>`:

```html
<script
  defer
  src="https://static.cloudflareinsights.com/beacon.min.js"
  data-cf-beacon='{"token": "CLOUDFLARE_BEACON_TOKEN"}'
></script>
```

**Important:** Use the literal string `CLOUDFLARE_BEACON_TOKEN` as a
placeholder. The user will replace it manually with their actual token. Add a
comment above the script:
`<!-- Cloudflare Web Analytics — privacy-first, no cookies, GDPR-compliant -->`.

### 2. Google Search Console Verification

Add this meta tag to `index.html` inside `<head>`, after the existing meta tags:

```html
<!-- Google Search Console verification — replace TOKEN with actual verification code -->
<meta name="google-site-verification" content="GSC_VERIFICATION_TOKEN" />
```

Use the literal placeholder `GSC_VERIFICATION_TOKEN`. The user will replace it
manually.

### 3. Enable V2 Analytics Framework

This is the main implementation work:

**Step 1: Move the file**

- Copy `v2-features/utils/analytics.ts` to `src/utils/analytics.ts`
- Review and update any imports/paths that break

**Step 2: Add feature flag**

- In `src/config/features.ts`, add: `ANALYTICS: true,` in the V1 features
  section
- Add comment: `// Privacy-compliant localStorage analytics with consent`

**Step 3: Create consent banner component**

- Create `src/components/ui/ConsentBanner.tsx`
- Use the `useConsentBanner()` hook from the analytics module
- Style: a non-intrusive bottom banner with "We use local analytics to improve
  this tool. No data leaves your browser." + Accept/Decline buttons
- Use existing Tailwind design tokens (bg-white, shadow-lg, rounded-lg)
- Only show once per user (consent stored in localStorage)
- Must be dismissible
- Mount it in the app layout (likely `src/App.tsx` or the layout component)

**Step 4: Wire tracking into key components** Add `useAnalytics()` hook calls in
these components. Import the hook, destructure `track` and `trackFeature`, and
add tracking calls at the appropriate points:

a) **`src/pages/PlannerPage.tsx`** (or the component that triggers route
calculation):

- Track:
  `trackFeature('route_calculation', 'completed', { waypoints: count, distance: km })`
- Track:
  `trackFeature('route_export', 'initiated', { format: 'gpx'|'kml'|'json' })`

b) **`src/components/campsite/SimpleCampsiteLayer.tsx`**:

- Track: `trackFeature('campsite_search', 'completed', { results: count })`

c) **`src/components/campsite/CampsiteDetails.tsx`**:

- Track:
  `trackFeature('affiliate_link', 'clicked', { provider: 'booking'|'other' })`
- Track: `trackFeature('campsite_details', 'viewed')`

d) **`src/pages/SettingsPage.tsx`**:

- Add an "Analytics" section showing: consent status, event count, last activity
- Add "Export Analytics Data" button (uses `exportData()` from analytics)
- Add "Clear Analytics Data" button (uses `clearData()` from analytics)

**Step 5: Verify**

- Run `npm run type-check` — must pass
- Run `npm run lint` — must pass with zero warnings
- Run `npm run build` — must succeed
- Manual test: open dev server, accept consent, trigger a route calculation,
  check localStorage for analytics events

## File Ownership (DO NOT modify files outside this list)

- `index.html` — add Cloudflare script + GSC meta tag
- `src/config/features.ts` — add ANALYTICS flag
- `src/utils/analytics.ts` — moved from v2-features
- `src/components/ui/ConsentBanner.tsx` — new file
- `src/pages/PlannerPage.tsx` — add analytics hooks only
- `src/components/campsite/SimpleCampsiteLayer.tsx` — add analytics hooks only
- `src/components/campsite/CampsiteDetails.tsx` — add analytics hooks only
- `src/pages/SettingsPage.tsx` — add analytics section only
- `src/App.tsx` or layout — mount ConsentBanner

## DO NOT

- Modify any page's SEOHead or meta tags (Session B does that)
- Touch BookingService or blog files (Session C does that)
- Update CLAUDE.md or legal pages (Session D does that)
- Add any paid analytics services
- Add any cookies or cross-site tracking

## Branch

Work on branch: `feature/analytics-measurement`

## Commit

When done, commit with message:
`feat: add Cloudflare Web Analytics, GSC verification, and enable V2 analytics framework`
