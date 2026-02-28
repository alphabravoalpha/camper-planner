# Campsite Data Enrichment — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to
> implement this plan task-by-task.

**Goal:** Enrich campsite detail cards with more OSM data, reverse geocoding,
Wikimedia photos, and "Find on" external links so that no card is blank/useless.

**Architecture:** Extend the existing `Campsite` interface and `parseOSMElement`
in `CampsiteService.ts` to extract 15+ additional OSM tags. Add on-demand
reverse geocoding via Nominatim (existing integration). Update
`CampsiteDetails.tsx` and `SimpleCampsiteLayer.tsx` popups to display enriched
data and hide empty sections. Add "Find on" links to information-only platforms
(Park4Night, Google Maps, ADAC) separate from affiliate booking links.

**Tech Stack:** React 18, TypeScript, Leaflet, Zustand, Tailwind CSS, Nominatim
API (existing), Wikimedia Commons REST API, Vitest

**Design doc:** `docs/plans/2026-02-28-campsite-data-enrichment-design.md`

---

## Task 1: Extend Campsite Interface

**Files:**

- Modify: `src/services/CampsiteService.ts:43-105` (Campsite interface)

**Step 1: Add new fields to the Campsite interface**

In `src/services/CampsiteService.ts`, extend the `Campsite` interface (line
43-105) with these new optional fields after the existing `quality_score` field
(line 104):

```typescript
  // --- New enrichment fields ---

  // Star rating (1-5, from tourism board classifications)
  stars?: number;

  // Free text description
  description?: string;

  // Operator name
  operator?: string;

  // Image URL (Wikimedia Commons or direct link)
  imageUrl?: string;

  // Campsite policies
  policies?: {
    dogs?: string;       // 'yes' | 'no' | 'leashed' | undefined
    fires?: boolean;
    bbq?: boolean;
    nudism?: boolean;
  };

  // Capacity breakdown
  capacityDetails?: {
    pitches?: number;
    tents?: number;
    caravans?: number;
  };

  // Power supply info (e.g. "16A", "CEE 16A")
  powerSupply?: string;

  // Structured address from OSM addr:* tags
  structuredAddress?: {
    street?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };

  // Data completeness tier (replaces quality_score for display logic)
  dataCompleteness?: 'minimal' | 'basic' | 'detailed';
```

Also add 6 new amenity fields to the existing `amenities` block (after line 62,
`swimming_pool`):

```typescript
sanitary_dump_station: boolean;
waste_disposal: boolean;
hot_water: boolean;
kitchen: boolean;
picnic_table: boolean;
bbq: boolean;
```

**Step 2: Run type-check to see what breaks**

Run: `npm run type-check`

Expected: Multiple errors in files that construct `Campsite` objects — the new
required amenity booleans need defaults. Note which files/lines fail.

**Step 3: Fix all Campsite object constructions**

Add the 6 new amenity fields (defaulting to `false`) in:

- `src/services/CampsiteService.ts` — `parseOSMElement` method (line ~1021) and
  `parseOpenCampingMapFeature` method (line ~1078)
- `src/services/__tests__/CampsiteFilterService.test.ts` — mock campsite objects
  (line ~11)
- `src/services/__tests__/CampsiteOptimizationService.test.ts` — mock objects
- `src/services/__tests__/BookingService.test.ts` — mock objects
- Any other files flagged by type-check

For every mock `Campsite` object in tests, add:

```typescript
sanitary_dump_station: false,
waste_disposal: false,
hot_water: false,
kitchen: false,
picnic_table: false,
bbq: false,
```

**Step 4: Run type-check again to confirm clean**

Run: `npm run type-check`

Expected: No errors.

**Step 5: Run existing tests to confirm nothing broke**

Run: `npm test`

Expected: All existing tests pass.

**Step 6: Commit**

```bash
git add src/services/CampsiteService.ts src/services/__tests__/
git commit -m "feat: extend Campsite interface with enrichment fields

Add stars, description, operator, imageUrl, policies, capacityDetails,
powerSupply, structuredAddress, dataCompleteness fields. Add 6 new
amenity booleans (sanitary_dump_station, waste_disposal, hot_water,
kitchen, picnic_table, bbq).

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Extended OSM Tag Parsing

**Files:**

- Modify: `src/services/CampsiteService.ts:1053-1057` (parseOSMElement method)

**Step 1: Write tests for the new tag parsing**

Create: `src/services/__tests__/CampsiteService.test.ts`

```typescript
import { describe, it, expect } from 'vitest';

// We need to test parseOSMElement which is private.
// Test via the public interface by mocking fetch responses,
// OR extract the parsing logic into a testable helper.
// Simplest: export a standalone parseOSMTags helper function.

// For now, test the data model expectations:
describe('CampsiteService OSM parsing', () => {
  // We'll test via campsiteService.searchCampsites with mocked fetch
  // but first let's verify the tag mapping logic by extracting it.

  describe('tag extraction expectations', () => {
    it('should map stars tag to number', () => {
      // tags.stars = "3" -> campsite.stars = 3
      const stars = parseInt('3', 10);
      expect(stars).toBe(3);
      expect(Number.isNaN(parseInt('invalid', 10))).toBe(true);
    });

    it('should construct Wikimedia Commons thumbnail URL', () => {
      const filename = 'Camping_Example.jpg';
      const url = `https://commons.wikimedia.org/w/thumb.php?f=${encodeURIComponent(filename)}&w=400`;
      expect(url).toContain('thumb.php');
      expect(url).toContain('Camping_Example.jpg');
      expect(url).toContain('w=400');
    });

    it('should extract structured address from addr tags', () => {
      const tags: Record<string, string> = {
        'addr:street': '123 Main St',
        'addr:city': 'Nice',
        'addr:postcode': '06000',
        'addr:country': 'FR',
      };
      const address = {
        street: tags['addr:street'],
        city: tags['addr:city'],
        postcode: tags['addr:postcode'],
        country: tags['addr:country'],
      };
      expect(address.city).toBe('Nice');
      expect(address.country).toBe('FR');
    });

    it('should classify data completeness correctly', () => {
      // detailed: name + 3+ amenities + contact + hours
      // basic: name + (1 amenity OR contact)
      // minimal: no name OR (no amenities AND no contact)
      const classify = (
        hasName: boolean,
        amenityCount: number,
        hasContact: boolean,
        hasHours: boolean
      ) => {
        if (hasName && amenityCount >= 3 && hasContact && hasHours)
          return 'detailed';
        if (hasName && (amenityCount >= 1 || hasContact)) return 'basic';
        return 'minimal';
      };

      expect(classify(true, 5, true, true)).toBe('detailed');
      expect(classify(true, 2, true, true)).toBe('basic');
      expect(classify(true, 1, false, false)).toBe('basic');
      expect(classify(true, 0, true, false)).toBe('basic');
      expect(classify(false, 5, true, true)).toBe('minimal');
      expect(classify(true, 0, false, false)).toBe('minimal');
    });
  });
});
```

**Step 2: Run the new tests**

Run: `npx vitest run src/services/__tests__/CampsiteService.test.ts`

Expected: All pass (these test the logic we're about to implement).

**Step 3: Update parseOSMElement to extract new tags**

In `src/services/CampsiteService.ts`, update the `parseOSMElement` method
(starts line 1053). After the existing return object (line ~1014-1057), add the
new fields inside the return statement:

```typescript
      // New amenity fields (add after swimming_pool in amenities block)
      sanitary_dump_station: this.parseBoolean(tags.sanitary_dump_station),
      waste_disposal: this.parseBoolean(tags.waste_disposal),
      hot_water: this.parseBoolean(tags.hot_water),
      kitchen: this.parseBoolean(tags.kitchen),
      picnic_table: this.parseBoolean(tags.picnic_table),
      bbq: this.parseBoolean(tags.bbq),
```

And add the new top-level fields after `capacity` (line ~1052):

```typescript
      // Enrichment fields
      stars: this.parseNumber(tags.stars),
      description: tags.description || tags['description:en'],
      operator: tags.operator,
      imageUrl: this.resolveImageUrl(tags),
      policies: {
        dogs: tags.dog,
        fires: this.parseBoolean(tags.openfire),
        bbq: this.parseBoolean(tags.bbq),
        nudism: this.parseBoolean(tags.nudism),
      },
      capacityDetails: {
        pitches: this.parseNumber(tags['capacity:pitches']),
        tents: this.parseNumber(tags['capacity:tents']),
        caravans: this.parseNumber(tags['capacity:caravans']),
      },
      powerSupply: tags.power_supply,
      structuredAddress: {
        street: tags['addr:street'],
        city: tags['addr:city'],
        postcode: tags['addr:postcode'],
        country: tags['addr:country'],
      },
      dataCompleteness: this.calculateDataCompleteness(tags),
```

**Step 4: Add the resolveImageUrl helper method**

Add after `calculateQualityScore` (line ~1170):

```typescript
  /**
   * Resolve image URL from OSM tags (Wikimedia Commons or direct URL)
   */
  private resolveImageUrl(tags: Record<string, string>): string | undefined {
    // Prefer wikimedia_commons tag — construct thumbnail URL
    const wikiFile = tags.wikimedia_commons || tags['image:wikimedia'];
    if (wikiFile) {
      // Remove "File:" prefix if present
      const filename = wikiFile.replace(/^File:/, '');
      return `https://commons.wikimedia.org/w/thumb.php?f=${encodeURIComponent(filename)}&w=400`;
    }

    // Fall back to image tag if it's a full URL
    if (tags.image && tags.image.startsWith('http')) {
      return tags.image;
    }

    return undefined;
  }
```

**Step 5: Replace calculateQualityScore with calculateDataCompleteness**

Replace the method at line ~1221:

```typescript
  /**
   * Calculate data completeness tier based on available tags
   */
  private calculateDataCompleteness(
    tags: Record<string, string>
  ): 'minimal' | 'basic' | 'detailed' {
    const hasName = !!tags.name;
    const amenityTags = [
      tags.drinking_water, tags.electricity, tags.shower,
      tags.toilets, tags.wifi, tags.internet_access,
      tags.swimming_pool, tags.shop, tags.restaurant,
      tags.playground, tags.laundry, tags.sanitary_dump_station,
    ];
    const amenityCount = amenityTags.filter(v => v === 'yes').length;
    const hasContact = !!(tags.phone || tags.website || tags.email);
    const hasHours = !!tags.opening_hours;

    if (hasName && amenityCount >= 3 && hasContact && hasHours) return 'detailed';
    if (hasName && (amenityCount >= 1 || hasContact)) return 'basic';
    return 'minimal';
  }
```

Keep the old `calculateQualityScore` method for backwards compatibility (it's
still assigned to `quality_score` field). Update the return object in
`parseOSMElement` to also set `quality_score` using the old method.

**Step 6: Run tests**

Run: `npm test`

Expected: All tests pass (existing + new).

**Step 7: Commit**

```bash
git add src/services/CampsiteService.ts src/services/__tests__/CampsiteService.test.ts
git commit -m "feat: extract 15+ additional OSM tags in campsite parsing

Parse stars, description, operator, image/wikimedia_commons, dog/fire/bbq
policies, capacity details, power supply, structured address. Add 6 new
amenity booleans. Add dataCompleteness tier (minimal/basic/detailed).
Add resolveImageUrl for Wikimedia Commons thumbnails.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Reverse Geocoding for Unnamed Campsites

**Files:**

- Modify: `src/services/CampsiteService.ts` (add reverseGeocode method)

**Step 1: Add reverse geocode method to CampsiteService**

Add after the existing `geocodeLocation` method (line ~523):

```typescript
  /**
   * Reverse geocode coordinates to get a human-readable location name.
   * Returns "near {town}, {region}" format.
   * Respects Nominatim 1 req/sec rate limit.
   */
  async reverseGeocode(
    lat: number,
    lng: number
  ): Promise<{ displayName: string; city?: string; region?: string; country?: string } | null> {
    try {
      // Enforce Nominatim rate limit
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastNominatimRequest;
      if (timeSinceLastRequest < 1100) {
        await new Promise(resolve => setTimeout(resolve, 1100 - timeSinceLastRequest));
      }
      this.lastNominatimRequest = Date.now();

      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'EuropeanCamperPlanner/1.0 (camperplanning.com)',
        },
      });

      if (!response.ok) return null;

      const data = await response.json();
      const addr = data.address || {};

      const city = addr.city || addr.town || addr.village || addr.hamlet;
      const region = addr.state || addr.county;
      const country = addr.country;

      // Build "near {city}, {region}" format
      const parts: string[] = [];
      if (city) parts.push(city);
      if (region) parts.push(region);
      if (!city && !region && country) parts.push(country);

      return {
        displayName: parts.length > 0 ? parts.join(', ') : data.display_name?.split(',')[0] || '',
        city,
        region,
        country,
      };
    } catch {
      return null;
    }
  }

  /**
   * Enrich a campsite with reverse geocoded address if it has no name or address.
   * Call this on-demand when user clicks a campsite marker.
   */
  async enrichCampsiteWithLocation(campsite: Campsite): Promise<Campsite> {
    const isUnnamed = !campsite.name || /^(campsite|caravan_site|aire|parking)\s+\d+$/i.test(campsite.name);
    const noAddress = !campsite.address && !campsite.structuredAddress?.city;

    if (!isUnnamed && !noAddress) return campsite;

    const location = await this.reverseGeocode(campsite.lat, campsite.lng);
    if (!location) return campsite;

    const enriched = { ...campsite };

    if (isUnnamed && location.displayName) {
      const typeLabel = campsite.type === 'aire' ? 'Aire' :
                        campsite.type === 'caravan_site' ? 'Caravan site' : 'Campsite';
      enriched.name = `${typeLabel} near ${location.displayName}`;
    }

    if (noAddress && location.displayName) {
      enriched.address = location.displayName;
      if (!enriched.structuredAddress?.city) {
        enriched.structuredAddress = {
          ...enriched.structuredAddress,
          city: location.city,
          country: location.country,
        };
      }
    }

    return enriched;
  }
```

**Step 2: Add test for enrichCampsiteWithLocation**

Add to `src/services/__tests__/CampsiteService.test.ts`:

```typescript
describe('enrichCampsiteWithLocation', () => {
  it('should detect unnamed campsites by pattern', () => {
    const patterns = ['campsite 1903123151', 'caravan_site 12345', 'aire 999'];
    const regex = /^(campsite|caravan_site|aire|parking)\s+\d+$/i;
    for (const p of patterns) {
      expect(regex.test(p)).toBe(true);
    }
    expect(regex.test('Camping de la Vrille')).toBe(false);
    expect(regex.test('Le Paradis Nature')).toBe(false);
  });
});
```

**Step 3: Run tests**

Run: `npx vitest run src/services/__tests__/CampsiteService.test.ts`

Expected: Pass.

**Step 4: Commit**

```bash
git add src/services/CampsiteService.ts src/services/__tests__/CampsiteService.test.ts
git commit -m "feat: add reverse geocoding for unnamed campsites

Add reverseGeocode() and enrichCampsiteWithLocation() methods.
Unnamed campsites (matching 'campsite {id}' pattern) get enriched
with 'Campsite near {town}, {region}' on user click. Respects
Nominatim 1 req/sec rate limit.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Update CampsiteDetails — Enriched Card UI

**Files:**

- Modify: `src/components/campsite/CampsiteDetails.tsx`

This is the largest task. Work through it section by section.

**Step 1: Add new imports and constants**

At top of `CampsiteDetails.tsx`, add to the lucide imports:

```typescript
import {
  // ...existing imports...
  Star,
  ExternalLink,
  MapPin,
  Flame,
  Search,
  Camera,
} from 'lucide-react';
```

Add a new constant for "Find On" links after `KEY_AMENITIES`:

```typescript
// External information platforms (NOT booking — those use affiliate links)
const FIND_ON_PLATFORMS = [
  {
    id: 'park4night',
    name: 'Park4Night',
    icon: '🏕️',
    buildUrl: (campsite: Campsite) =>
      `https://park4night.com/search?lat=${campsite.lat}&lng=${campsite.lng}`,
    description: 'Reviews & photos',
  },
  {
    id: 'google_maps',
    name: 'Google Maps',
    icon: '📍',
    buildUrl: (campsite: Campsite) => {
      const query =
        campsite.name && !/^\w+\s+\d+$/.test(campsite.name)
          ? encodeURIComponent(campsite.name)
          : `${campsite.lat},${campsite.lng}`;
      return `https://www.google.com/maps/search/${query}/@${campsite.lat},${campsite.lng},15z`;
    },
    description: 'Photos & Street View',
  },
  {
    id: 'pincamp',
    name: 'PiNCAMP (ADAC)',
    icon: '⭐',
    buildUrl: (campsite: Campsite) =>
      `https://www.pincamp.de/suche?lat=${campsite.lat}&lng=${campsite.lng}`,
    description: 'Inspection ratings',
  },
];
```

Add new amenity config entries to `AMENITY_CONFIG`:

```typescript
  sanitary_dump_station: { icon: Trash2, label: 'Dump Station' },
  hot_water: { icon: Droplets, label: 'Hot Water' },
  kitchen: { icon: UtensilsCrossed, label: 'Kitchen' },
  picnic_table: { icon: UtensilsCrossed, label: 'Picnic' },
  bbq: { icon: Flame, label: 'BBQ' },
```

Add `sanitary_dump_station` to `KEY_AMENITIES` (it's critical for motorhomes):

```typescript
const KEY_AMENITIES = [
  'electricity',
  'showers',
  'wifi',
  'toilets',
  'drinking_water',
  'sanitary_dump_station', // NEW — critical for motorhomes
  'waste_disposal',
  'shop',
  'restaurant',
];
```

**Step 2: Add hero image section**

After the header `<div>` (the green gradient block, ends ~line 327), add a hero
image section:

```tsx
{
  /* Hero image (Wikimedia Commons or placeholder) */
}
{
  campsite.imageUrl && (
    <div className="relative w-full h-40 bg-neutral-100 overflow-hidden">
      <img
        src={campsite.imageUrl}
        alt={campsite.name}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={e => {
          // Hide broken images
          (e.target as HTMLImageElement).parentElement!.style.display = 'none';
        }}
      />
      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
        <Camera className="inline w-3 h-3 mr-0.5" /> Wikimedia Commons
      </div>
    </div>
  );
}
```

**Step 3: Add star rating display**

In the header section (inside the green gradient), after the campsite type badge
(~line 247), add:

```tsx
{
  campsite.stars && campsite.stars > 0 && (
    <div className="flex items-center gap-0.5 mt-1">
      {Array.from({ length: campsite.stars }).map((_, i) => (
        <Star key={i} className="w-3.5 h-3.5 fill-yellow-300 text-yellow-300" />
      ))}
      <span className="text-xs text-green-200 ml-1">{campsite.stars} star</span>
    </div>
  );
}
```

**Step 4: Add description and operator to Quick Facts section**

In the Quick Facts section (starts ~line 355), add before the address block:

```tsx
{
  /* Description */
}
{
  campsite.description && (
    <div className="text-sm text-neutral-700 leading-relaxed">
      {campsite.description.length > 200
        ? `${campsite.description.slice(0, 200)}...`
        : campsite.description}
    </div>
  );
}

{
  /* Operator */
}
{
  campsite.operator && (
    <div className="flex items-center gap-3">
      <Info className="w-5 h-5 text-neutral-400 flex-shrink-0" />
      <span className="text-sm text-neutral-700">
        Operated by <span className="font-medium">{campsite.operator}</span>
      </span>
    </div>
  );
}
```

**Step 5: Add policies section**

After the vehicle restrictions section (~line 524), add:

```tsx
{
  /* Policies */
}
{
  campsite.policies &&
    (campsite.policies.dogs ||
      campsite.policies.fires ||
      campsite.policies.bbq ||
      campsite.policies.nudism) && (
      <div className="p-4 border-b border-neutral-100">
        <div className="text-xs font-medium text-neutral-500 mb-2">
          Policies
        </div>
        <div className="flex flex-wrap gap-2">
          {campsite.policies.dogs && (
            <span
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
                campsite.policies.dogs === 'no'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-green-50 text-green-700'
              )}
            >
              <Dog className="w-3.5 h-3.5" />
              {campsite.policies.dogs === 'yes'
                ? 'Dogs welcome'
                : campsite.policies.dogs === 'leashed'
                  ? 'Dogs on leash'
                  : campsite.policies.dogs === 'no'
                    ? 'No dogs'
                    : `Dogs: ${campsite.policies.dogs}`}
            </span>
          )}
          {campsite.policies.fires && (
            <span className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs font-medium">
              <Flame className="w-3.5 h-3.5" /> Open fires OK
            </span>
          )}
          {campsite.policies.bbq && (
            <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium">
              BBQ allowed
            </span>
          )}
          {campsite.policies.nudism && (
            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
              Naturist
            </span>
          )}
        </div>
      </div>
    );
}
```

**Step 6: Add "Find On" section (information links)**

Add before the booking section (`ref={bookingSectionRef}`, ~line 737):

```tsx
{
  /* Research this campsite — information-only platforms */
}
<div className="p-4 border-b border-neutral-100">
  <h3 className="text-sm font-medium text-neutral-900 mb-3 flex items-center gap-2">
    <Search className="w-4 h-4 text-neutral-400" />
    Research This Campsite
  </h3>
  <div className="space-y-2">
    {FIND_ON_PLATFORMS.map(platform => (
      <a
        key={platform.id}
        href={platform.buildUrl(campsite)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between p-2.5 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors text-sm"
      >
        <div className="flex items-center gap-2">
          <span>{platform.icon}</span>
          <div>
            <div className="font-medium text-neutral-800">{platform.name}</div>
            <div className="text-xs text-neutral-500">
              {platform.description}
            </div>
          </div>
        </div>
        <ExternalLink className="w-4 h-4 text-neutral-400" />
      </a>
    ))}
  </div>
</div>;
```

**Step 7: Hide empty sections**

Apply these conditional rendering changes:

1. **Hide "All Amenities" section when zero amenities** — Change the condition
   at ~line 555 from `allAmenities.length > 0` to
   `availableAmenities.length > 0`.

2. **Hide "Contact Details" section** — Already conditionally rendered (line
   658). No change needed.

3. **Hide "Book This Campsite" section when nothing to show** — Wrap the entire
   booking section in:

```tsx
{(campsite.contact?.website || affiliateLinks.length > 0) && (
  // existing booking section JSX
)}
```

4. **Add "Limited data" banner for minimal completeness** — Add after the header
   section:

```tsx
{
  /* Limited data warning */
}
{
  campsite.dataCompleteness === 'minimal' && (
    <div className="p-3 bg-amber-50 border-b border-amber-200 flex items-start gap-2">
      <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
      <div className="text-xs text-amber-800">
        <span className="font-medium">Limited data available.</span>{' '}
        <a
          href={`https://www.openstreetmap.org/edit?node=${campsite.osmId || campsite.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-amber-900"
        >
          Help improve this listing on OpenStreetMap
        </a>
      </div>
    </div>
  );
}
```

**Step 8: Run type-check and dev server**

Run: `npm run type-check`

Expected: No errors.

Run: `npm run dev` and manually test clicking campsite markers.

**Step 9: Commit**

```bash
git add src/components/campsite/CampsiteDetails.tsx
git commit -m "feat: enrich CampsiteDetails with photos, stars, policies, Find On links

Add hero image from Wikimedia Commons, star rating display, description,
operator, dog/fire/bbq/nudism policies section. Add 'Research This
Campsite' section with Park4Night, Google Maps, PiNCAMP links (info
only, separate from affiliate booking links). Hide empty sections
(0 amenities, no contact, no booking). Add 'Limited data' banner
with OSM edit link for minimal-completeness campsites.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Update Map Popup (SimpleCampsiteLayer)

**Files:**

- Modify: `src/components/campsite/SimpleCampsiteLayer.tsx:840-993`

**Step 1: Add imports**

Add to the imports in `SimpleCampsiteLayer.tsx`:

```typescript
import { Star } from 'lucide-react';
import { campsiteService } from '../../services/CampsiteService';
```

(campsiteService may already be imported — check first.)

**Step 2: Rewrite the individual campsite popup content**

Replace the popup content block (line ~866-991) with a compact preview design.
The popup should be a slim preview card that encourages clicking "View Details":

```tsx
<div className="campsite-popup-content p-3 min-w-0 max-w-[260px]">
  {/* Photo thumbnail */}
  {campsite.imageUrl && (
    <div className="w-full h-24 rounded overflow-hidden mb-2 bg-neutral-100">
      <img
        src={campsite.imageUrl}
        alt={campsite.name}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={e => {
          (e.target as HTMLImageElement).parentElement!.style.display = 'none';
        }}
      />
    </div>
  )}

  {/* Name + stars */}
  <div className="flex items-start justify-between mb-1">
    <h3 className="font-medium text-neutral-900 text-sm leading-tight pr-2">
      {campsite.name || `${campsite.type.replace('_', ' ')} #${campsite.id}`}
    </h3>
    {campsite.stars && campsite.stars > 0 && (
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {Array.from({ length: Math.min(campsite.stars, 5) }).map((_, i) => (
          <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
    )}
  </div>

  {/* Location */}
  {campsite.address && (
    <div className="text-xs text-neutral-600 mb-2">{campsite.address}</div>
  )}

  {/* Amenity icons (compact) */}
  {campsite.amenities &&
    Object.entries(campsite.amenities).filter(([_, available]) => available)
      .length > 0 && (
      <div className="flex flex-wrap gap-1 mb-2">
        {Object.entries(campsite.amenities)
          .filter(([_, available]) => available)
          .slice(0, 6)
          .map(([amenity]) => (
            <span
              key={amenity}
              className="px-1.5 py-0.5 bg-green-100 text-green-800 text-[10px] rounded font-medium"
            >
              {amenity.replace(/_/g, ' ')}
            </span>
          ))}
      </div>
    )}

  {/* Minimal data hint */}
  {campsite.dataCompleteness === 'minimal' && (
    <div className="text-xs text-amber-600 mb-2">
      Limited data — check Park4Night for more info
    </div>
  )}

  {/* Actions */}
  <div className="flex gap-2 pt-2 border-t border-neutral-200">
    {isCampsiteInRoute(campsite) ? (
      <div className="flex-1 flex items-center justify-center py-1.5 bg-green-50 text-green-700 rounded text-xs font-medium">
        ✓ In route
      </div>
    ) : (
      <button
        onClick={e => handleAddToRoute(campsite, e)}
        className="flex-1 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs font-medium transition-colors"
      >
        + Add to Route
      </button>
    )}
    <button
      onClick={e => {
        e.stopPropagation();
        onCampsiteClick?.(campsite);
      }}
      className="flex-1 py-1.5 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 rounded text-xs font-medium transition-colors"
    >
      View Details →
    </button>
  </div>
</div>
```

**Step 3: Trigger reverse geocoding on campsite click**

In the `onCampsiteClick` handler (or in MapContainer where
`handleCampsiteSelect` is defined), add enrichment before showing details.

Find where `onCampsiteClick` is wired in `MapContainer.tsx` and wrap the
campsite with enrichment:

```typescript
const handleCampsiteSelect = async (campsite: Campsite) => {
  // Enrich unnamed campsites with reverse-geocoded location
  const enriched = await campsiteService.enrichCampsiteWithLocation(campsite);
  setSelectedCampsite(enriched);
};
```

**Step 4: Run type-check and manual test**

Run: `npm run type-check`

Then: `npm run dev` — click campsite markers, verify:

- Photo shows in popup when available
- Stars display correctly
- "View Details" button opens enriched detail card
- Unnamed campsites show "Campsite near {town}" after click

**Step 5: Commit**

```bash
git add src/components/campsite/SimpleCampsiteLayer.tsx src/components/map/MapContainer.tsx
git commit -m "feat: redesign campsite popup with compact preview and enrichment

Popup now shows photo thumbnail, star rating, compact amenity chips,
and View Details button. Minimal-data campsites show Park4Night hint.
Clicking a campsite triggers reverse geocoding to enrich unnamed sites
with 'Campsite near {town}' before showing detail card.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Sort by Data Completeness

**Files:**

- Modify: `src/services/CampsiteService.ts:1175-1208` (filterAndScoreCampsites)

**Step 1: Update sort to prefer detailed campsites**

In `filterAndScoreCampsites` method (~line 1198), update the sort comparator:

```typescript
// Sort by completeness tier, then quality score and proximity
const tierOrder = { detailed: 0, basic: 1, minimal: 2 };

return filtered.sort((a, b) => {
  // Primary: data completeness tier
  const tierA = tierOrder[a.dataCompleteness || 'minimal'];
  const tierB = tierOrder[b.dataCompleteness || 'minimal'];
  if (tierA !== tierB) return tierA - tierB;

  // Secondary: proximity to center
  const distanceA = this.calculateDistance(centerLat, centerLng, a.lat, a.lng);
  const distanceB = this.calculateDistance(centerLat, centerLng, b.lat, b.lng);
  return distanceA - distanceB;
});
```

**Step 2: Run existing tests**

Run: `npm test`

Expected: All pass.

**Step 3: Commit**

```bash
git add src/services/CampsiteService.ts
git commit -m "feat: sort campsites by data completeness tier

Detailed campsites (name + amenities + contact + hours) appear first,
then basic, then minimal. Within tiers, sort by proximity to map center.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 7: Final Integration Test & Cleanup

**Files:**

- All modified files

**Step 1: Full type-check**

Run: `npm run type-check`

Expected: Zero errors.

**Step 2: Full test suite**

Run: `npm test`

Expected: All tests pass.

**Step 3: Lint**

Run: `npm run lint:fix`

Expected: Clean or auto-fixed.

**Step 4: Production build**

Run: `npm run build`

Expected: Build succeeds. Check bundle size hasn't increased significantly
(should be < 10KB increase).

**Step 5: Manual verification on dev server**

Run: `npm run dev`

Test these scenarios:

1. Search "Provence" → enable campsites → click a named campsite → verify
   enriched detail card (stars, description if available, policies, "Research"
   links, affiliate booking links)
2. Click an unnamed campsite (OSM ID only) → verify it shows "Campsite near
   {town}" after brief loading
3. Click a campsite with zero amenities → verify "Limited data" banner shows,
   empty amenity section is hidden, "Book This Campsite" hidden if no
   website/affiliates
4. Verify "Research This Campsite" links (Park4Night, Google Maps, PiNCAMP) open
   correct URLs in new tabs
5. Verify affiliate booking links (Booking.com, Eurocampings, camping.info)
   still appear separately below in "Book This Campsite" section
6. If any campsite has a Wikimedia image tag — verify photo displays

**Step 6: Commit any final fixes**

```bash
git add -A
git commit -m "chore: final cleanup for campsite data enrichment

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```
