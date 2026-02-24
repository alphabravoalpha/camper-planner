# UX Overhaul: Search-First, Progressive Disclosure

**Date:** 2026-02-24
**Status:** Approved
**Scope:** Onboarding, toolbar, campsite toggle, empty state, search results, contextual nudges, panel management

---

## Context

### The Problem

camperplanning.com is live and feature-complete, but the user experience front-loads too much information. The onboarding tour is 10 steps long, spends 30% of its time on secondary tools (vehicle setup, daily stages, cost calculator), and doesn't show the #1 differentiator (campsite discovery) until step 9. The toolbar shows up to 14 icon-only buttons. The campsite toggle has a confusing 3-state cycle. There's no clear entry point when the tour ends.

### Target Market

- **Primary:** 55-75 year old German, French, and British motorhome owners. Comfortable with tech but need simple, clear interfaces. Plan on desktop.
- **Secondary:** 25-45 van lifers/digital nomads. Tech-savvy, price-sensitive, expect modern UX.
- **Tertiary:** Holiday renters (30-45). Least experienced, highest need for guidance.
- Germany alone = 44% of European motorhome registrations (1M+ vehicles). Germany + France + UK = 72% of market.

### The Gap We Fill

No free tool combines vehicle-restriction-aware routing + campsite discovery along a route + cost estimation for European travel. Every competitor does one piece (Park4Night = campsites, Google Maps = routing without vehicle restrictions, CaraMaps = vehicle GPS but mobile-only and paid).

---

## Design Philosophy

**Trip planning is a loop: Search > Browse > Pick > Repeat.**

Everything else (costs, daily stages, vehicle setup, export) enhances a route you've already started building. The UX should be structured around this loop. Secondary tools should be discoverable but never in the way.

---

## Trip Planning Factor Analysis

### Tier 1 — The Core Loop (must be frictionless)

| Factor | Action |
|--------|--------|
| **Where am I starting?** | Empty-state card directs users to search bar. Single clear CTA. |
| **Where am I going?** | Search works. Make "+ Add" the primary action in results. |
| **Where do I sleep?** | Promote campsite discovery to onboarding step 3. Simplify toggle to on/off. |
| **What's my route?** | Auto-calculates at 2+ waypoints. No change needed. |
| **Can I add stops?** | Works. Onboarding demonstrates the multi-stop pattern. |

### Tier 2 — Important Setup (accessible, not pushed)

| Factor | Action |
|--------|--------|
| **Vehicle dimensions** | Remove from onboarding tour. Mention in toolkit step. Keep in toolbar. |
| **Daily driving limits** | Remove from onboarding tour. Progressive disclosure at 2+ waypoints is correct. |
| **Trip costs** | Remove from onboarding tour. Same progressive disclosure. |
| **Route optimisation** | No change. Correctly gated behind 3+ waypoints. |

### Tier 3 — Enhancers (discoverable, never in the way)

| Factor | Action |
|--------|--------|
| **GPX/KML export** | No change. Correctly placed in Trip Manager. |
| **Trip saving/loading** | No change. |
| **Country regulations** | V2. Note as future priority. |
| **Amenity filtering** | Keep as-is. Accessible when campsites are on. |

---

## Change 1: Onboarding Redesign (10 steps -> 6)

### Step 1: Welcome (id: `welcome`)
- **Target:** None (centered card)
- **Variant:** welcome (wide card)
- **Headline:** "Plan Your European Camper Trip"
- **Body:** "We'll show you the basics in under a minute. Let's plan a quick trip from London to the South of France."
- **3 bullet features:**
  - Search locations and build your route
  - Discover campsites along the way
  - Vehicle-safe routing that avoids low bridges and narrow roads
- **CTA:** "Show Me How"
- **Demo action:** None

### Step 2: Search & Add Your Start (id: `add-start`)
- **Target:** `[data-tour-id="search-bar"]`
- **Position:** below
- **Headline:** "Search for Your Starting Point"
- **Body:** "Type any address, city, or place. We've added London — you'll search for your own starting point."
- **Tip:** "Click '+ Add' on a result to add it to your route."
- **Demo action:** `demoActions.addLondon()`
- **Overlay opacity:** 0.3

### Step 3: Find Campsites (id: `find-campsites`)
- **Target:** `[data-tour-id="campsite-toggle"]`
- **Position:** right
- **Headline:** "Find Campsites Anywhere"
- **Body:** "Toggle campsites on to see real campsite data. We've zoomed to the French Riviera — zoom into any area on your trips to browse campsites there."
- **Tip:** "Click any campsite marker for details, amenities, and booking links."
- **Demo action:** Pan to Nice area [43.7, 7.1] at zoom 11, toggle campsites ON
- **Overlay opacity:** 0.15

### Step 4: Add a Campsite to Your Route (id: `add-campsite`)
- **Target:** None (transparent overlay)
- **Position:** right
- **Headline:** "Add Stops Along the Way"
- **Body:** "We've added a campsite near Nice and an overnight stop near Lyon. Click any campsite marker > 'Add to Route' to build multi-stop trips."
- **Tip:** "Drag waypoints on the map to reorder your route."
- **Demo action:** Toggle campsites OFF, add Lyon + Nice campsites, pan to full route view
- **Overlay opacity:** 0.08

### Step 5: Your Toolkit (id: `toolkit`)
- **Target:** Left toolbar Tools button group
- **Position:** right
- **Headline:** "Tools When You Need Them"
- **Body:** "Once your route is taking shape, these tools help you refine it:"
- **Bullet list:**
  - Vehicle setup — set dimensions for safe routing
  - Trip costs — fuel and budget estimates
  - Daily stages — break long drives into days
  - Save & export — save trips, export to GPS
- **Demo action:** None (just spotlight the toolbar)
- **Overlay opacity:** 0.4

### Step 6: Ready (id: `ready`)
- **Target:** None (centered card)
- **Variant:** final
- **Headline:** "You're Ready to Plan!"
- **Body:** "We'll clear the demo trip and give you a fresh map. Search for your starting point and start building your route."
- **CTA:** "Start Planning"
- **Demo action:** `demoActions.cleanup()`

### Key Metrics

| Aspect | Before | After |
|--------|--------|-------|
| Total steps | 10 | 6 |
| Estimated completion time | 2-3 min | 45-60 sec |
| Steps on core loop | 5 | 4 |
| Steps on secondary tools | 3 | 1 (no panels opened) |
| When campsite discovery shown | Step 9 | Step 3 |
| Panels opened during tour | 3 | 0 |

### Onboarding version bump: 5.0 -> 6.0

---

## Change 2: Empty State & Entry Point

### When 0 waypoints exist (after tour completes/skips):

Centered card on map:

```
+-------------------------------------------+
|                                           |
|     Where are you starting from?          |
|                                           |
|   Search for an address, city, or         |
|   campsite to begin planning your trip    |
|                                           |
|   [ Search locations...            ]      |
|                                           |
|   -- or --                                |
|                                           |
|   Use the Trip Wizard for guided setup    |
|   Right-click the map to add directly     |
|                                           |
+-------------------------------------------+
```

- Search input focuses the actual top search bar (or is the search component itself)
- Card disappears when first waypoint added
- Trip Wizard link opens existing wizard modal
- Right-click hint is muted secondary text

### When 1 waypoint exists (no route yet):

Small dismissible nudge banner:
"Add a second stop to calculate your route — search above or toggle campsites to browse"

Disappears when 2+ waypoints exist.

---

## Change 3: Toolbar Declutter

### Before (desktop, 3+ waypoint route): 10+ left buttons + 4 right buttons

```
[Undo] [Redo]
[Trip Settings] [Trip Manager] [Planning Tools] [Cost Calculator]
[Route Info] [Route Optimizer]
[Campsite Toggle]
[Clear Waypoints]
```

### After: 4 always-visible buttons

```
[Undo] [Redo]
[Tools v]
[Campsites]
```

### Tools Menu Contents (dropdown/popover)

| Icon | Label | When shown |
|------|-------|------------|
| Settings icon | Trip Settings | Always |
| Folder icon | Trip Manager | Always |
| Truck icon | Vehicle Setup | Always |
| Document icon | Route Info | Route exists |
| Calendar icon | Planning Tools | 2+ waypoints |
| Dollar icon | Cost Calculator | 2+ waypoints |
| Lightning icon | Route Optimizer | 3+ waypoints |
| Export icon | Export Route | Route exists |
| Trash icon (red) | Clear Route | Waypoints exist |

- Items with icon AND text label (no guessing)
- Unavailable items hidden, not greyed
- Section divider between setup items and route items
- Clear Route at bottom, visually separated, red text

### Right-side map controls

- Zoom +/- stays visible
- Zoom-to-fit stays visible
- Reset view, layers, fullscreen, keyboard shortcuts -> overflow (three-dot) menu

---

## Change 4: Campsite Toggle Simplification

### Before: 3-state cycle
```
OFF -> Controls panel -> Filter panel -> OFF
```

### After: Simple on/off + gear icon
```
OFF -> ON (campsites appear)
ON -> OFF (campsites disappear)
```

- Gear icon appears next to toggle when campsites are ON
- Gear opens combined settings/filter panel (tabbed: "Settings" | "Filters")
- CampsiteControls + CampsiteFilter merged into one tabbed panel

---

## Change 5: Search Results Hierarchy

### Before
"Go" and "+ Add" are visually similar buttons side by side.

### After
- **"+ Add"** = primary action: larger, filled colour (`bg-primary-600 text-white`)
- **"Go"** = secondary action: smaller, text-only or outlined
- Tooltips: "Go" = "View on map without adding to route", "+ Add" = "Add this location to your route"

---

## Change 6: Contextual Nudges (Progressive Discovery)

Replace onboarding steps 6-8 and UserGuidance with show-once contextual nudges:

| Trigger | Nudge Text |
|---------|------------|
| First waypoint added | "Add a second stop to calculate your route — search above or toggle campsites to browse" |
| Route first calculated | "Your route is ready! Explore the Tools menu for vehicle setup, cost estimates, and daily stages." |
| Campsite toggle first turned on | "Zoom in to see individual campsites. Click any marker for details." |
| Campsite detail first opened | "Click 'Add to Route' to make this a stop on your trip." |
| 3+ waypoints added | "Tip: Drag waypoints on the map to reorder your route." |

- Small dismissible toast at bottom of map
- localStorage key per nudge (show once per user)
- Auto-dismiss after 8 seconds or click X
- Non-blocking (no overlay or modal)
- Respect reduced-motion (no slide animation)

---

## Change 7: Panel Mutual Exclusion

**Rule:** Only one right-side panel open at a time on desktop.

Panels affected: Trip Settings, Trip Manager, Planning Tools, Cost Calculator, Route Info, Route Optimizer, Campsite Details, Campsite Filter/Settings.

Implementation: `closeAllPanels()` utility called before opening any panel.

**Exception:** Campsite details can overlay Route Info (common workflow: viewing route info while clicking campsites).

---

## What Does NOT Change

- Search bar component (works well)
- Campsite details panel (comprehensive, well-designed)
- Route calculation and display
- Vehicle profile system
- Cost calculator, planning tools, route optimizer logic
- Mobile bottom toolbar (already uses the condensed pattern)
- GPX/KML export
- Trip saving/loading
- All service layer code
- Legal pages, footer, SEO, monetisation
- Trip Wizard (stays, demoted to secondary access via Tools menu + empty state link)

---

## Files Affected

| File | Change |
|------|--------|
| `src/components/onboarding/tourSteps.ts` | Rewrite 10 steps to 6 |
| `src/components/onboarding/demoActions.ts` | Update demo actions for new steps |
| `src/components/onboarding/TourTooltip.tsx` | Minor content rendering updates |
| `src/components/onboarding/useTourPositioning.ts` | Remove positioning for deleted steps |
| `src/components/map/MapContainer.tsx` | Major: toolbar restructure, empty state, panel management |
| `src/components/map/MapControls*.tsx` | Refactor into overflow menu |
| `src/components/search/UnifiedSearch.tsx` | "+ Add" / "Go" styling changes |
| `src/components/campsite/SimpleCampsiteLayer.tsx` | Toggle simplification |
| `src/components/campsite/CampsiteControls.tsx` | Merge into tabbed panel |
| `src/components/campsite/CampsiteFilter.tsx` | Merge into tabbed panel |
| `src/components/ui/UserGuidance.tsx` | Remove/replace with nudge system |
| `src/index.css` | Update tour step CSS |
| NEW: `src/components/map/ToolsMenu.tsx` | Dropdown menu component |
| NEW: `src/components/map/EmptyStateCard.tsx` | Empty state card component |
| NEW: `src/components/ui/ContextualNudge.tsx` | Nudge toast component |

---

## Implementation Priority

1. **Onboarding** (highest impact, user's primary concern)
2. **Empty state & entry point** (first impression after onboarding)
3. **Toolbar declutter** (reduces cognitive load)
4. **Campsite toggle** (removes confusion)
5. **Search results** (guides toward core loop)
6. **Contextual nudges** (replaces removed onboarding steps)
7. **Panel mutual exclusion** (cleanup)
