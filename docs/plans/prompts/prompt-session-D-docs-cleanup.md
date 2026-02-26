# Session D: Docs & Flags Cleanup

## Role

You are a senior developer responsible for documentation and compliance on
camperplanning.com. This session runs AFTER Sessions A, B, and C have been
merged.

## Context

- Site is live at camperplanning.com (React 18 + Vite + TypeScript, GitHub
  Pages)
- Session A added: Cloudflare Web Analytics, Google Search Console meta tag, V2
  analytics framework with consent banner
- Session B added: SEOHead to all 11 pages, updated sitemap priorities
- Session C added: monetisation research, gear guide blog article, updated
  BookingService providers
- All three branches have been merged to main

## Deliverables

### 1. Update CLAUDE.md

Add a new "Recent Updates" section for February 26, 2026 documenting:

**Analytics & Measurement:**

- Cloudflare Web Analytics integrated (privacy-first, no cookies)
- Google Search Console verification meta tag added
- V2 localStorage analytics framework enabled with consent banner
- Feature tracking: route calculations, campsite searches, exports, affiliate
  clicks
- `ANALYTICS: true` feature flag added
- Analytics data viewable/exportable/clearable in Settings page

**SEO Completeness:**

- SEOHead added to all 13 pages (unique title, description, canonical per page)
- noindex set on Settings, NotFound, MapTest pages
- Sitemap priorities updated (blog 0.7, legal 0.3)
- Sitemap excludes noindex pages

**Monetisation Expansion:**

- [Summarise findings from `docs/plans/monetisation-research.md`]
- New blog article: "Essential Gear for Your European Campervan Adventure"
- GearLink component for affiliate product links
- BookingService: removed non-functional Pitchup/ACSI, [added any new providers]

### 2. Update Privacy Policy Page

Edit `src/pages/PrivacyPolicyPage.tsx`:

- Add disclosure about Cloudflare Web Analytics: "We use Cloudflare Web
  Analytics to understand how visitors use our site. This service does not use
  cookies, does not track individuals, and does not collect personal data. It
  provides aggregate statistics only (page views, referrers, countries)."
- Add disclosure about localStorage analytics: "With your consent, we collect
  anonymous usage data stored locally on your device. This data never leaves
  your browser and can be viewed, exported, or deleted at any time from
  Settings."
- If Amazon Associates was added by Session C, add: "Some links on our site are
  affiliate links to Amazon. When you purchase through these links, we may earn
  a small commission at no extra cost to you."
- Keep the existing privacy-first tone and GDPR compliance language

### 3. Update Affiliate Disclosure Page

Edit `src/pages/AffiliateDisclosurePage.tsx`:

- Remove Pitchup and ACSI references (no longer in BookingService)
- Add Amazon Associates disclosure if applicable
- Add any new affiliate providers that Session C added to BookingService
- Ensure FTC/ASA compliance language covers all current affiliates

### 4. Review Feature Flags

Read `src/config/features.ts` and verify:

- `ANALYTICS: true` flag was added by Session A
- All other flags are still correct
- No flags were accidentally changed by other sessions

### 5. Final Sitemap Regeneration

Run the sitemap generation:

```bash
npx tsx scripts/generate-sitemap.ts
```

Verify the output includes the new blog article URL and excludes noindex pages.

### 6. Verify Everything

- Run `npm run type-check` — must pass
- Run `npm run lint` — must pass with zero warnings
- Run `npm run build` — must succeed
- Read the built sitemap and verify it's correct
- Read CLAUDE.md and verify it's accurate

## File Ownership

- `CLAUDE.md` — update with all session changes
- `src/pages/PrivacyPolicyPage.tsx` — update disclosures
- `src/pages/AffiliateDisclosurePage.tsx` — update disclosures
- `src/config/features.ts` — review only (verify, don't change unless wrong)
- `scripts/generate-sitemap.ts` — run only (don't modify unless broken)

## DO NOT

- Modify `index.html` (already done by Session A)
- Touch analytics code or consent banner (Session A)
- Modify SEOHead on any page (Session B)
- Change BookingService or blog articles (Session C)

## Branch

Work on branch: `chore/docs-flags-cleanup`

## Commit

When done, commit with message:
`chore: update CLAUDE.md, privacy policy, affiliate disclosure for analytics and monetisation changes`
