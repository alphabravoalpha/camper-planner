# Batch 5: PWA & Offline Support

**[Batch 5] Add Progressive Web App support — manifest, service worker, offline caching, install prompt**

```
You are working on camperplanning.com — a free European camper trip planning app built with React 18 + Vite + TypeScript, hosted on GitHub Pages. The project is at /Users/Archie/Desktop/camper-planner on the main branch.

## Summary
Add PWA capabilities: web app manifest, service worker with offline caching, and an install prompt. This makes the app installable on mobile/desktop and functional offline after first load.

## Context
The feature requirements doc says "works offline once loaded" but this is NOT currently true — there's no service worker, no manifest, and no offline caching. The V2 roadmap lists PWA as a planned feature. Adding basic PWA support is relatively low-effort with vite-plugin-pwa and provides high user value for a trip planning app (users often need it in areas with poor connectivity).

The app is a static SPA hosted on GitHub Pages at camperplanning.com. It uses Leaflet for maps (OpenStreetMap tiles) and makes API calls to OpenRouteService, Overpass API, and Nominatim for routing, campsites, and geocoding.

## Skills to Invoke
Before starting work, invoke these skills:
1. `superpowers:brainstorming` — design the PWA caching strategy
2. `superpowers:using-git-worktrees` — create an isolated worktree
3. `superpowers:verification-before-completion` — before claiming work is done
4. `superpowers:finishing-a-development-branch` — when work is complete
5. `pr-review-toolkit:review-pr` — run on the PR before requesting merge

## Detailed Task List

### Task 1: Brainstorm caching strategy
Invoke `superpowers:brainstorming` to design the PWA approach. Key decisions:
- **App shell caching:** Cache all static assets (JS, CSS, HTML) with a cache-first strategy
- **Map tiles:** Cache visited map tiles with a stale-while-revalidate strategy (tiles are immutable at same URL)
- **API responses:** Cache geocoding and campsite data with network-first (data can change)
- **Do NOT cache:** Route calculations (these depend on real-time road data and vehicle restrictions)

### Task 2: Create a git worktree
Use `superpowers:using-git-worktrees` to create a worktree branch named `feature/pwa-offline` based on main.

### Task 3: Install vite-plugin-pwa
```bash
npm install --save-dev vite-plugin-pwa
```

### Task 4: Create app icons
Create PWA icons at multiple sizes. You can generate these using Gemini in Chrome:
1. Open gemini.google.com in a new Chrome tab (use tabs_context_mcp, tabs_create_mcp, navigate tools)
2. Prompt: "Create a simple app icon for a European camper trip planning app. The icon should feature a simplified campervan or motorhome with a map pin, using a teal/ocean blue colour scheme on a white background. Clean, modern, flat design suitable for a mobile app icon. Square format, no text."
3. Download and save to `public/` as:
   - `public/pwa-192x192.png` (192x192)
   - `public/pwa-512x512.png` (512x512)
   - `public/apple-touch-icon.png` (180x180)

Alternatively, if generating icons is complex, create them programmatically using the existing logo or use a simple coloured square with the campervan emoji as a placeholder.

### Task 5: Configure vite-plugin-pwa
Edit `vite.config.ts` to add the PWA plugin:

```typescript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'og-image.png'],
      manifest: {
        name: 'European Camper Planner',
        short_name: 'Camper Planner',
        description: 'Free trip planning for European motorhome and campervan travel',
        theme_color: '#0d7490',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Cache OpenStreetMap tiles
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'map-tiles',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            // Cache Nominatim geocoding
            urlPattern: /^https:\/\/nominatim\.openstreetmap\.org\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'geocoding-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
          {
            // Cache Unsplash images (blog) — or local images after Batch 3
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'blog-images',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
    }),
  ],
  // ... rest of config
});
```

### Task 6: Add meta tags to index.html
Add to `<head>` in `index.html`:
```html
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<meta name="theme-color" content="#0d7490" />
```

### Task 7: Add offline fallback UI (optional but nice)
Create a simple offline notice component that shows when the user is offline:
```tsx
// src/components/ui/OfflineNotice.tsx
// Small banner at top: "You're offline — some features may be limited"
// Shows when navigator.onLine is false
```

### Task 8: Verify PWA works
1. `npm run build` — must succeed and generate service worker files in `dist/`
2. `npm run preview` — test the production build locally
3. Open Chrome DevTools → Application → Manifest — verify manifest loads
4. Open Chrome DevTools → Application → Service Workers — verify SW registers
5. Test offline: go to Network tab, switch to Offline, reload — app should still load

## File Boundaries
**CAN modify:**
- `vite.config.ts` (add VitePWA plugin)
- `index.html` (add meta tags)
- `public/` (add icon files, manifest is auto-generated)
- `package.json` (add vite-plugin-pwa dependency)
- `src/components/ui/OfflineNotice.tsx` (new file)
- `src/components/layout/` (if adding OfflineNotice to layout)

**CANNOT modify:**
- `.github/` (Batch 1's territory)
- `src/components/map/` (Batch 2's territory)
- `src/components/campsite/` (Batch 2's territory)
- `src/data/blog/` (Batch 3's territory)
- `src/pages/FeedbackPage.tsx` (Batch 4's territory)

## Success Criteria
1. `npm run build` generates `dist/sw.js` and `dist/manifest.webmanifest`
2. Chrome DevTools shows valid manifest with icons
3. Service worker registers and caches static assets
4. App loads when offline (after initial visit)
5. Map tiles are cached (revisited areas work offline)
6. `npm run type-check` passes
7. `npx vitest run` — all tests pass
8. No regression in existing functionality

## Deploy Instructions
Do NOT deploy. Create a PR targeting main. After creating the PR, invoke `pr-review-toolkit:review-pr`.

After deploying (done in Batch 6), verify on the live site using Claude in Chrome: navigate to camperplanning.com, check Chrome DevTools Application tab for manifest and service worker, test that the site loads after going offline.
```
