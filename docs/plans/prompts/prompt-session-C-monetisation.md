# Session C: Monetisation Expansion

## Role

You are a senior developer and content strategist working on camperplanning.com.
Your task is to research and implement monetisation diversification.

## Context

- Site is live at camperplanning.com (React 18 + Vite + TypeScript, GitHub
  Pages)
- Current monetisation:
  - Ko-fi donations: live on /support page (zero income, no traffic yet)
  - Booking.com affiliate: via CJ (Commission Junction), application pending, no
    affiliate ID active
  - Pitchup: has NO public affiliate programme — remove from BookingService
  - ACSI: sells guides/cards, not bookings — remove from BookingService
- `src/services/BookingService.ts` has provider configs for booking, pitchup,
  and acsi
- Blog system: 10 articles in `src/data/blog/`, registered in
  `src/data/blog/articles.ts`
- Blog components in `src/components/blog/`

## Three Deliverables

### 1. Research Affiliate Programmes

Use web search to research these camping/travel affiliate programmes and
document your findings:

- **Eurocampings.co.uk** — do they have an affiliate programme? What commission?
- **Campsy** — affiliate programme details?
- **camping.info** — partner programme?
- **Amazon Associates UK** — commission rates for camping/outdoor gear category
- **Awin** — any relevant camping/travel advertisers?
- **CJ (Commission Junction)** — any camping-specific advertisers beyond
  Booking.com?

Write findings to `docs/plans/monetisation-research.md` with this structure:

```markdown
# Monetisation Research — 2026-02-26

## Viable Programmes

[For each: name, URL, commission rate, how to apply, relevance to our audience]

## Not Viable

[For each: name, reason it doesn't work]

## Recommended Priority

[Ranked list of what to sign up for and why]
```

### 2. Write Gear Guide Blog Article

Create `src/data/blog/essential-campervan-gear.ts` — a new blog article about
essential gear for European campervan trips.

**Follow the exact same data structure as existing articles.** Read one of the
existing files (e.g., `src/data/blog/france-road-trip.ts`) to match the format
exactly.

Article structure:

- **Title:** "Essential Gear for Your European Campervan Adventure"
- **Slug:** `essential-campervan-gear`
- **Category:** `vehicle-guides`
- **Sections:** Cover categories like: safety equipment, kitchen essentials,
  electrical/solar, navigation, comfort items, country-specific requirements
  (warning triangles, vignettes, etc.)
- **Gear links:** Use placeholder Amazon affiliate URLs in this format:
  `https://www.amazon.co.uk/dp/ASIN?tag=AMAZON_ASSOCIATE_TAG`. Use real ASINs
  where possible by searching for popular items (e.g., portable gas stove, solar
  panel, levelling ramps). Use `AMAZON_ASSOCIATE_TAG` as the literal placeholder
  tag.
- **Tone:** Practical, experienced, budget-conscious — like advice from a fellow
  traveller

Also create a simple `src/components/blog/GearLink.tsx` component:

- Renders an external link with `rel="sponsored noopener noreferrer"` and
  `target="_blank"`
- Styled as an inline link with a small external-link icon
- Shows the product name and a "View on Amazon" CTA

Register the new article in `src/data/blog/articles.ts`.

Add a hero image reference using the same `IMAGES` pattern as other articles.
Use a placeholder path `public/images/blog/campervan-gear-hero.jpg` — the user
will add the actual image file manually.

### 3. Update BookingService Providers

In `src/services/BookingService.ts`:

**Remove:** Pitchup and ACSI provider configs entirely (they don't have
affiliate programmes)

**Keep:** Booking.com (pending CJ approval)

**Add (if research confirms they have affiliate programmes):**

- Eurocampings — with proper baseUrl and config
- Campsy — with proper baseUrl and config
- Any other viable providers found in research

For new providers, use the same `BookingProvider` interface. Set
`enabled: !!import.meta.env.VITE_<PROVIDER>_AFFILIATE_ID` so they activate when
env vars are set.

### 4. Verify

- Run `npm run type-check` — must pass
- Run `npm run lint` — must pass with zero warnings
- Run `npm run build` — must succeed
- Verify the new blog article renders correctly on
  `/guides/essential-campervan-gear`

## File Ownership (DO NOT modify files outside this list)

- `docs/plans/monetisation-research.md` — new research document
- `src/data/blog/essential-campervan-gear.ts` — new blog article
- `src/data/blog/articles.ts` — register new article only
- `src/services/BookingService.ts` — update providers
- `src/components/blog/GearLink.tsx` — new component

## DO NOT

- Modify `index.html` (Session A does that)
- Touch analytics code or feature flags (Session A does that)
- Add SEOHead to any pages (Session B does that)
- Update CLAUDE.md or legal pages (Session D does that)
- Modify any existing blog article content beyond adding gear link references

## Branch

Work on branch: `feature/monetisation-expansion`

## Commit

When done, commit with message:
`feat: add monetisation research, gear guide article, and update booking providers`
