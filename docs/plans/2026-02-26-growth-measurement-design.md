# Growth & Measurement Design

**Date:** 2026-02-26 **Status:** Approved **Goal:** Go from zero visibility and
zero revenue to measurable traffic, proper SEO, and diversified monetisation.

## Context

The site is live at camperplanning.com with a solid product (route planning,
campsite discovery, GPX export, PWA). However:

- **Zero analytics** — no way to measure visitors, usage, or conversions
- **Zero revenue** — Ko-fi live but no traffic; Booking.com affiliate pending;
  Pitchup/ACSI don't work
- **Incomplete SEO** — only 2 of 13 pages have SEOHead meta tags
- **No Google Search Console** — unknown if Google has indexed the site

## Analytics Stack (Zero-Cost)

| Tool                      | Purpose                                                                | Cost                 |
| ------------------------- | ---------------------------------------------------------------------- | -------------------- |
| Cloudflare Web Analytics  | Cross-user traffic: pageviews, referrers, countries, devices           | Free                 |
| Google Search Console     | SEO: indexing status, search queries, crawl errors                     | Free                 |
| V2 localStorage Analytics | Feature usage: route calcs, campsite clicks, exports, affiliate clicks | Free (already built) |

## Implementation Sessions

### Session A: Analytics & Measurement (parallel)

- Add Cloudflare Web Analytics `<script>` to `index.html`
- Add Google Search Console verification `<meta>` to `index.html`
- Move `v2-features/utils/analytics.ts` → `src/utils/analytics.ts`
- Add `ANALYTICS: true` feature flag
- Wire `useAnalytics()` into PlannerPage, SimpleCampsiteLayer, CampsiteDetails,
  SettingsPage
- Add consent banner component (V2 code has `useConsentBanner()`)
- Add analytics data section to SettingsPage (view/export/clear)

**Files owned:** `index.html`, `src/config/features.ts`,
`src/utils/analytics.ts`, `src/components/ui/ConsentBanner.tsx`,
`src/pages/PlannerPage.tsx` (analytics hooks only),
`src/components/campsite/SimpleCampsiteLayer.tsx` (analytics hooks only),
`src/components/campsite/CampsiteDetails.tsx` (analytics hooks only),
`src/pages/SettingsPage.tsx` (analytics section only)

### Session B: SEO Completeness (parallel)

- Add `<SEOHead>` to 11 pages missing it (unique title, description, canonical
  per page)
- Mark private pages as noindex (Settings, NotFound, MapTest)
- Update sitemap priorities (blog 0.7, legal 0.3)
- Regenerate sitemap via build script

**Files owned:** All `src/pages/*Page.tsx` (SEOHead imports only — not
analytics, not content changes), `scripts/generate-sitemap.ts`

### Session C: Monetisation Expansion (parallel)

- Web search for viable camping/travel affiliate programmes
- Document findings in `docs/plans/monetisation-research.md`
- Write new blog article: `src/data/blog/essential-campervan-gear.ts`
- Add gear CTA component for blog articles
- Update BookingService providers (remove non-functional Pitchup/ACSI, add any
  new finds)
- Add Amazon Associates placeholder tags to 2-3 existing blog articles

**Files owned:** `docs/plans/monetisation-research.md`,
`src/data/blog/essential-campervan-gear.ts`, `src/data/blog/articles.ts`
(register new article), `src/services/BookingService.ts`,
`src/components/blog/GearCTA.tsx`

### Session D: Docs & Flags Cleanup (after A+B+C)

- Update `CLAUDE.md` with analytics, SEO, monetisation changes
- Update `PrivacyPolicyPage.tsx` to disclose Cloudflare + Amazon
- Update `AffiliateDisclosurePage.tsx` with new partners
- Verify all feature flags are correct
- Regenerate sitemap (final)
- Commit

**Files owned:** `CLAUDE.md`, `src/pages/PrivacyPolicyPage.tsx`,
`src/pages/AffiliateDisclosurePage.tsx`, `src/config/features.ts` (final
review), `scripts/generate-sitemap.ts`

## Parallel Safety

```
Timeline:
  ├── Session A (analytics)     ──┐
  ├── Session B (SEO)           ──┼── can run simultaneously
  ├── Session C (monetisation)  ──┘
  │
  └── Session D (docs cleanup)  ──── runs after A+B+C merge
```

No file conflicts: each session owns distinct files. The only shared file
(`features.ts`) is written by A (adds ANALYTICS flag) and reviewed by D (final
check).

## Manual Steps Required (User)

1. **Before Session A:** Create free Cloudflare account → Web Analytics → get
   beacon token
2. **Before Session A:** Set up Google Search Console → get verification meta
   tag token
3. **Before Session C:** Create Amazon Associates UK account → get associate tag
4. **After Session A deploys:** Submit sitemap in Google Search Console
5. **After all sessions:** Verify Cloudflare dashboard shows data within 24h
