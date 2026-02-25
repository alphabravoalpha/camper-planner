# Batch 3: Blog Image Reliability

**[Batch 3] Self-host blog images, fix broken Unsplash URLs, and optimise for performance**

```
You are working on camperplanning.com — a free European camper trip planning app built with React 18 + Vite + TypeScript, hosted on GitHub Pages. The project is at /Users/Archie/Desktop/camper-planner on the main branch.

## Summary
All 10 blog article hero images are loaded from external Unsplash CDN URLs. At least 2 are currently broken on the live site (Norway Fjords, Croatia). Download all images, optimise them, host them locally in public/, and update the blog data files.

## Context
The blog system has 10 articles in `src/data/blog/` (TypeScript data files). Each article has a `heroImage` field with an Unsplash URL like `https://images.unsplash.com/photo-XXXX?w=1600&q=80&auto=format`. These URLs are unreliable — Unsplash can rate-limit, block, or change URLs. The Norway Fjords and Croatia articles currently show broken images (alt text visible instead of images) on the live site at camperplanning.com/guides.

## Skills to Invoke
Before starting work, invoke these skills:
1. `superpowers:using-git-worktrees` — create an isolated worktree for this work
2. `superpowers:verification-before-completion` — before claiming work is done
3. `superpowers:finishing-a-development-branch` — when work is complete
4. `pr-review-toolkit:review-pr` — run on the PR before requesting merge

## Detailed Task List

### Task 1: Create a git worktree
Use `superpowers:using-git-worktrees` to create a worktree branch named `fix/blog-images-self-host` based on main.

### Task 2: Create the image directory
```bash
mkdir -p public/images/blog
```

### Task 3: Download all 10 blog hero images
For each article in `src/data/blog/`, download the Unsplash hero image. Use curl or wget:

The 10 articles and their current Unsplash URLs (read the actual files to confirm):
1. `southern-france-routes.ts` — Southern France lavender/coast
2. `first-time-motorhome.ts` — Motorhome/campervan on road
3. `portugal-campsites.ts` — Portugal coast/algarve
4. `motorhome-vs-campervan.ts` — VW van on road
5. `italian-coast.ts` — Amalfi/Italian coastline
6. `wild-camping-europe.ts` — Tent/camping sunset
7. `spain-routes.ts` — Spanish architecture/landscape
8. `norway-fjords.ts` — Norwegian fjord (BROKEN on live site)
9. `european-amenities.ts` — Campsite with tent
10. `croatia-coastal.ts` — Croatian coast/Dubrovnik (BROKEN on live site)

Download each image to `public/images/blog/` with a descriptive filename, e.g.:
```bash
curl -L "https://images.unsplash.com/photo-XXXX?w=1200&q=80&auto=format" -o public/images/blog/southern-france-hero.jpg
```
Use `w=1200` (not 1600) to save bandwidth while keeping good quality.

If any Unsplash URL fails to download, use Gemini image generation as a fallback:
- Open gemini.google.com in Chrome (MCP browser automation is available)
- Enter a prompt like: "A beautiful Norwegian fjord surrounded by dramatic mountain peaks with a small campervan on a lakeside road, photorealistic landscape photography, 16:9 aspect ratio"
- Download the generated image and save to `public/images/blog/`

### Task 4: Optimise images
For each downloaded image:
1. Resize to max 1200px wide (if larger)
2. Convert to WebP format for smaller size (keep JPG as fallback):
```bash
# If cwebp is available:
cwebp -q 80 input.jpg -o output.webp
# Or use sharp/imagemagick if available
```
3. Target file size: under 200KB per image
4. Name files consistently: `{slug}-hero.jpg` and `{slug}-hero.webp`

### Task 5: Update blog data files
Edit each file in `src/data/blog/` to use local image paths:
```typescript
// Before:
heroImage: 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=1600&q=80&auto=format',

// After:
heroImage: '/images/blog/norway-fjords-hero.jpg',
```

Keep the `heroImageAlt` and `heroImageCredit` fields unchanged (still credit the Unsplash photographers).

### Task 6: Add image error handling to BlogCard component
Edit `src/components/blog/BlogCard.tsx` to add an `onError` fallback:
```tsx
<img
  src={article.heroImage}
  alt={article.heroImageAlt}
  onError={(e) => {
    (e.target as HTMLImageElement).src = '/images/blog/fallback-hero.jpg';
  }}
/>
```
Create a generic fallback image at `public/images/blog/fallback-hero.jpg` — a pleasant campervan/landscape scene. Generate this with Gemini if needed.

### Task 7: Verify on live site
After deploying, verify on the live site using Claude in Chrome:
1. Open camperplanning.com/guides in a new tab (use tabs_context_mcp, tabs_create_mcp, navigate tools)
2. Take a screenshot to verify all 10 blog cards show images
3. Scroll down to check all cards including Norway and Croatia
4. Check console for any 404 errors on images
5. Test at mobile viewport (resize_window to 375x812) to verify responsive images

## File Boundaries
**CAN modify:**
- `public/images/blog/` (new directory and files)
- `src/data/blog/*.ts` (all 10 blog data files — heroImage field only)
- `src/components/blog/BlogCard.tsx` (add image error handling)
- `src/components/blog/BlogHero.tsx` (add image error handling if needed)

**CANNOT modify:**
- `.github/` (Batch 1's territory)
- `src/components/map/` (Batch 2's territory)
- `src/components/campsite/` (Batch 2's territory)
- `src/pages/FeedbackPage.tsx` (Batch 4's territory)
- Config files
- Any service files

## Success Criteria
1. All 10 blog hero images exist in `public/images/blog/`
2. All 10 blog data files point to local image paths
3. Total image size under 2MB (10 images x ~200KB max)
4. `npm run build` succeeds
5. Blog cards show images when previewed locally
6. Fallback image exists for error cases
7. Image credits preserved in data files

## Deploy Instructions
Do NOT deploy. Create a PR targeting main. After creating the PR, invoke `pr-review-toolkit:review-pr`.

After deploying (done in Batch 6), verify on the live site using Claude in Chrome: navigate to camperplanning.com/guides, take screenshots, verify all 10 blog cards show images, check console for errors, and test at mobile viewport (375x812).
```
