# Campsite Data Enrichment — Design Document

**Date:** 2026-02-28 **Status:** Draft — awaiting approval

## Problem

Campsite detail cards are frequently sparse and unusable. Observed on live site:

- Many campsites display only an OSM ID as name (e.g. "campsite 1903123151")
- 0/10 amenities shown — all fields blank
- No address, opening hours, phone, website, or description
- "No booking links available" — no way to learn more
- Users have no reason to trust or visit these campsites
- Sparse cards undermine affiliate click-through because users won't book a
  place they know nothing about

## Root Causes

1. **Incomplete OSM extraction** — We query Overpass but only parse ~15 tags.
   OSM has 30+ relevant tags we ignore (stars, description, operator, policies,
   capacity details, Wikimedia images, structured addresses).
2. **No fallback for missing data** — If a campsite has no name, we show
   "campsite {id}". No reverse geocoding to provide context.
3. **Empty sections displayed** — "0/10 amenities available" and "No booking
   links" are shown rather than hidden, making cards feel broken.
4. **No external discovery links** — Users with sparse data have no path to find
   more info on other platforms.

## Solution: Smart Enrichment (Approach B)

Enrich campsite data by extracting more from OSM, adding reverse geocoding for
context, Wikimedia photos where tagged, and strategic "Find on" links to
information platforms — while keeping affiliate booking links separate.

### Non-Goals

- No third-party data imports (licensing risk)
- No unofficial APIs (Park4Night etc. — can break, legal grey area)
- No changes to the Overpass query structure (same API, more tag parsing)
- Not building a review/rating system

## Design

### 1. Extended OSM Data Extraction

**New fields on Campsite interface:**

```typescript
// Add to existing Campsite interface
stars?: number;              // 1-5, from tourism board ratings (tags.stars)
description?: string;        // Free text (tags.description or tags.description:en)
operator?: string;           // Who runs it (tags.operator)
imageUrl?: string;           // Wikimedia Commons URL (tags.image or tags.wikimedia_commons)

// Policies
policies: {
  dogs?: 'yes' | 'no' | 'leashed' | unknown;  // tags.dog
  fires?: boolean;           // tags.openfire
  bbq?: boolean;             // tags.bbq
  nudism?: boolean;          // tags.nudism
  smoking?: string;          // tags.smoking
};

// Enhanced amenities (add to existing)
amenities: {
  // ...existing 10 fields...
  sanitary_dump_station: boolean;  // tags.sanitary_dump_station — critical for motorhomes
  waste_disposal: boolean;         // tags.waste_disposal
  hot_water: boolean;              // tags.hot_water
  kitchen: boolean;                // tags.kitchen
  picnic_table: boolean;           // tags.picnic_table
  bbq: boolean;                    // tags.bbq
};

// Capacity details
capacityDetails?: {
  pitches?: number;         // tags['capacity:pitches']
  tents?: number;           // tags['capacity:tents']
  caravans?: number;        // tags['capacity:caravans']
  cabins?: number;          // tags['capacity:cabins']
  persons?: number;         // tags['capacity:persons']
};

// Power details
powerSupply?: string;       // tags.power_supply (e.g. "16A" or "CEE 16A")

// Structured address (fallback to reverse geocode)
structuredAddress?: {
  street?: string;          // tags['addr:street']
  city?: string;            // tags['addr:city']
  postcode?: string;        // tags['addr:postcode']
  country?: string;         // tags['addr:country']
};

// Data quality
dataCompleteness: 'minimal' | 'basic' | 'detailed';  // replaces quality_score number
```

**Files modified:** `CampsiteService.ts` (parseOSMElement, Campsite interface)

### 2. Reverse Geocoding for Addresses

For campsites without a name or address, use Nominatim reverse geocoding to
generate a human-readable location.

**Logic:**

- If `campsite.name` is missing or matches pattern `campsite \d+`: reverse
  geocode to get nearest place name. Display as "Campsite near {town},
  {region}".
- If `campsite.address` is missing and `structuredAddress` is empty: reverse
  geocode to populate `structuredAddress`.
- Rate limit: batch requests, max 1/second per Nominatim policy. Use existing
  Nominatim integration.
- Cache results in IndexedDB alongside campsite data.

**Important:** Only reverse geocode campsites that the user actually clicks on
or that appear in the visible viewport at high zoom (>= 12). Do NOT reverse
geocode all 100 results at once.

**Files modified:** `CampsiteService.ts` (new `reverseGeocode` method),
`SimpleCampsiteLayer.tsx` (trigger on marker click)

### 3. Wikimedia Commons Photos

OSM campsites sometimes have `image=*` or `wikimedia_commons=*` tags pointing to
photos.

**Logic:**

- Extract `tags.image` and `tags.wikimedia_commons` during parsing
- For `wikimedia_commons` tags: construct thumbnail URL via Wikimedia API
  `https://commons.wikimedia.org/w/thumb.php?f={filename}&w=400`
- For `image` tags: use directly if URL, skip if just a filename without domain
- Display as hero image at top of CampsiteDetails card
- Lazy load — only fetch thumbnail when detail card is opened
- Fallback: show a campsite-type-specific placeholder illustration (tent,
  camper, parking)

**Coverage estimate:** ~10-15% of European campsites have image tags in OSM.
Small win but significant visual upgrade for those that do.

**Files modified:** `CampsiteService.ts` (parse image tags),
`CampsiteDetails.tsx` (image display)

### 4. "Find On" External Links (Information Only)

Add "Learn more about this campsite" section with search links to non-competing
information platforms.

**Platforms (information only — no booking):**

| Platform    | Link format                                                  | Purpose             |
| ----------- | ------------------------------------------------------------ | ------------------- |
| Park4Night  | `https://park4night.com/search?lat={lat}&lng={lng}`          | Reviews, photos     |
| Google Maps | `https://www.google.com/maps/search/{name}/@{lat},{lng},15z` | Photos, Street View |
| ADAC        | `https://www.pincamp.de/suche?lat={lat}&lng={lng}`           | Inspection ratings  |

**Platforms NOT included here (these stay as affiliate booking links):**

- Booking.com — existing affiliate via CJ
- Eurocampings — existing affiliate via TradeTracker
- camping.info — existing affiliate via Awin

**Key rule:** A platform appears in either "Find on" OR "Book on", never both.
This prevents cannibalising affiliate revenue.

**UI placement:** Below the amenities section, above the booking section. Framed
as "Research this campsite" rather than "Book here".

**Files modified:** `CampsiteDetails.tsx` (new section)

### 5. Better Empty States & Data Quality Indicators

**Data completeness tiers:**

| Tier       | Criteria                                           | Display                           |
| ---------- | -------------------------------------------------- | --------------------------------- |
| `detailed` | Has name + 3+ amenities + contact info + hours     | Full card, no warnings            |
| `basic`    | Has name + at least 1 amenity or contact field     | Normal card                       |
| `minimal`  | Missing name OR zero amenities and no contact info | Compact card + improvement prompt |

**Empty state changes:**

- Replace "0/10 amenities available" with hidden section (don't show what we
  don't know)
- Replace "campsite 1903123151" with "Campsite near {town}" (via reverse
  geocode) or "Unnamed Campsite" if geocode fails
- For `minimal` tier: show yellow info banner "Limited data available" with
  link: "Help improve this listing on OpenStreetMap" → direct OSM editor link
  `https://www.openstreetmap.org/edit?node={osmId}`
- Hide "Book This Campsite" section entirely if no website AND no affiliate
  links (don't show empty booking sections)
- Hide contact section if no phone/email/website (don't show empty expandable)

**Files modified:** `CampsiteDetails.tsx`, `SimpleCampsiteLayer.tsx` (popup),
`CampsiteService.ts` (quality calculation)

### 6. Improved Popup (Map Marker Click)

The map popup currently shows sparse data identically to the detail panel. Make
the popup a compact preview that encourages clicking through to the full detail
card.

**Popup content (compact):**

```
[Photo thumbnail if available]
Camping de la Vrille            ★★★
Near Avignon, Provence
⚡ 🚿 🚻 💧                    [4 amenity icons]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[+ Add to Route]  [View Details →]
```

**For minimal data campsites:**

```
Campsite near Lyon
Limited data  •  Check Park4Night →
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[+ Add to Route]  [View Details →]
```

**Files modified:** `SimpleCampsiteLayer.tsx`

### 7. Updated Quality Score

Replace the current 0-1 float with the tiered system. The score now drives both
display decisions and sort order.

```typescript
private calculateDataCompleteness(tags: Record<string, string>): 'minimal' | 'basic' | 'detailed' {
  const hasName = !!tags.name;
  const amenityCount = [
    tags.drinking_water, tags.electricity, tags.shower,
    tags.toilets, tags.wifi, tags.internet_access,
    tags.swimming_pool, tags.shop, tags.restaurant,
    tags.playground, tags.laundry, tags.sanitary_dump_station
  ].filter(v => v === 'yes').length;
  const hasContact = !!(tags.phone || tags.website || tags.email);
  const hasHours = !!tags.opening_hours;

  if (hasName && amenityCount >= 3 && hasContact && hasHours) return 'detailed';
  if (hasName && (amenityCount >= 1 || hasContact)) return 'basic';
  return 'minimal';
}
```

Sort order: `detailed` first, then `basic`, then `minimal`. Within tiers, sort
by proximity to map centre (existing behaviour).

**Files modified:** `CampsiteService.ts`

## File Change Summary

| File                       | Changes                                                                                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `CampsiteService.ts`       | Extended Campsite interface, new tag parsing (15+ tags), reverse geocode method, Wikimedia URL construction, new completeness calculation |
| `CampsiteDetails.tsx`      | Hero image, star rating, description, policies section, "Find on" links, better empty states, hidden empty sections, OSM edit link        |
| `SimpleCampsiteLayer.tsx`  | Updated popup with compact preview, photo thumbnails, quality-aware display, "View Details" action                                        |
| `CampsiteFilterService.ts` | Filter by data completeness tier (optional)                                                                                               |

## Constraints

- **Nominatim rate limit:** 1 request/second. Only reverse geocode on user
  interaction (click), not bulk. Cache in IndexedDB.
- **Wikimedia thumbnails:** Free API, no key needed. Rate limit is generous (200
  req/s). Only load when detail card opens.
- **No new dependencies:** All done with existing APIs (Nominatim, Overpass,
  Wikimedia Commons REST API).
- **Bundle impact:** Minimal — no new data files, just more tag parsing logic.
- **Affiliate integrity:** "Find on" links only go to information platforms.
  Booking platforms stay exclusively in the affiliate section.

## Success Criteria

1. Zero campsite cards display an OSM ID as the name
2. Every campsite shows at least a location ("near {town}") even if other data
   is sparse
3. Campsites with rich OSM data show stars, description, photos, policies
4. Sparse campsites show a clear path to more info (Park4Night/Google Maps
   links)
5. Empty sections (0 amenities, no contact, no booking) are hidden rather than
   shown
6. Affiliate booking links remain prominent and separate from info links

## Risks

- **Reverse geocoding latency:** Clicking a campsite may take 200-500ms to fetch
  address. Mitigate with skeleton loading state and caching.
- **Wikimedia thumbnail availability:** Some `wikimedia_commons` tags may point
  to deleted or restricted images. Mitigate with `onerror` fallback to
  placeholder.
- **Park4Night/ADAC URL format changes:** External search URLs may change.
  Mitigate by making URL templates configurable in a constant, easy to update.
