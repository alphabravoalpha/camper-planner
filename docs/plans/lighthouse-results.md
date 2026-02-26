# Lighthouse Audit Results

**Date:** 2026-02-26 **Tool:** Lighthouse 13.0.3 (headless Chrome) **Target:**
camperplanning.com (local production build)

## Final Scores

### Homepage (`/`)

| Category       | Score | Target | Status                    |
| -------------- | ----- | ------ | ------------------------- |
| Performance    | 76    | >= 85  | Below target (structural) |
| Accessibility  | 100   | >= 90  | Pass                      |
| Best Practices | 96    | >= 85  | Pass                      |
| SEO            | 100   | >= 90  | Pass                      |

### Guides Page (`/guides`)

| Category       | Score | Target | Status                    |
| -------------- | ----- | ------ | ------------------------- |
| Performance    | 56    | >= 85  | Below target (structural) |
| Accessibility  | 100   | >= 90  | Pass                      |
| Best Practices | 96    | >= 85  | Pass                      |
| SEO            | 100   | >= 90  | Pass                      |

## Key Metrics (Homepage)

| Metric                   | Value | Score |
| ------------------------ | ----- | ----- |
| First Contentful Paint   | 2.3s  | 75    |
| Largest Contentful Paint | 5.8s  | 15    |
| Total Blocking Time      | 0ms   | 100   |
| Cumulative Layout Shift  | 0.05  | 99    |
| Speed Index              | 2.3s  | 99    |

## Fixes Applied

### Performance

- **Lazy-loaded MapContainer** — moved the 383KB map chunk out of the initial
  bundle using `React.lazy()`, reducing the initial JS payload and improving FCP
- **Preconnect to tile subdomains** — added preconnect hints for
  `a/b/c.tile.openstreetmap.org` (the actual tile sources) instead of just
  `tile.openstreetmap.org`
- **DNS prefetch for Overpass API** — added `dns-prefetch` for `overpass-api.de`
  to speed up campsite data fetching
- **Image width/height attributes** — added explicit `width` and `height` to
  `<img>` tags in BlogHero, BlogCard, and BlogSectionRenderer to prevent layout
  shifts and help browser allocate space
- **Font display: optional** — changed Google Fonts from `display=swap` to
  `display=optional` to eliminate CLS from font loading while still using cached
  fonts on repeat visits

### Accessibility (100/100)

- **Heading order fixed** — changed BlogCard headings from `<h3>` to `<h2>` to
  maintain proper heading hierarchy (h1 page title -> h2 card titles)
- **Footer contrast improved** — changed bottom bar text from `text-neutral-500`
  to `text-neutral-400` for better contrast ratio against `bg-neutral-900`
- **Descriptive link text** — changed "Learn more" to "Read our affiliate
  disclosure" in the footer for better screen reader context

### SEO (100/100)

- Link text fix (above) also resolved the SEO "links do not have descriptive
  text" audit

## Structural Limitations (Performance)

The performance score is below 85 due to two fundamental constraints of the
application architecture:

### 1. Map Tile LCP (Homepage)

The Largest Contentful Paint (LCP) is dominated by OpenStreetMap tile loading
from external servers. As a map-centric application, the map tiles are the
primary visual element and take 5-6s to fully render. This cannot be improved
without:

- Server-side rendering (SSR) or static site generation (SSG)
- Self-hosted tile server with CDN
- A completely different initial page design that doesn't show the map
  immediately

### 2. SPA Lazy Loading CLS (Content Pages)

Content pages like `/guides` have a CLS of 0.86 because React Suspense shows a
minimal fallback while the lazy-loaded page component downloads. When the full
page renders, the footer shifts from mid-viewport to below-fold. This is
inherent to:

- Client-side rendered SPAs with code-splitting
- React Suspense fallback patterns
- The trade-off between initial bundle size and per-page CLS

### What Would Fix These

- **SSR/SSG** (Next.js, Astro) would pre-render HTML and eliminate both issues
- **A static splash page** before the map loads could improve homepage LCP
- **Removing lazy loading** for content pages would fix CLS but increase initial
  bundle

These are architectural decisions beyond the scope of this audit. The current
performance is acceptable for a map-heavy SPA on GitHub Pages hosting.

## Report Location

Full HTML report saved to `docs/lighthouse-report.html`.
