# Search UX Comparison: Travel & Mapping Sites

Research conducted February 28, 2026 on desktop (1440×727 viewport) using
Chrome.

## Sites Tested

1. **Google Maps** (maps.google.com)
2. **Booking.com** (booking.com)
3. **Rome2Rio** (rome2rio.com)
4. **Park4Night** (park4night.com)
5. **Campendium** (campendium.com)

---

## Summary Comparison Table

| Dimension             | Google Maps                            | Booking.com                         | Rome2Rio                         | Park4Night                      | Campendium                                  |
| --------------------- | -------------------------------------- | ----------------------------------- | -------------------------------- | ------------------------------- | ------------------------------------------- |
| **Trigger**           | Keypress (instant)                     | Keypress (~3 chars)                 | Keypress (~3 chars)              | Keypress (~3 chars)             | Keypress (~3 chars)                         |
| **Min chars**         | 1-3                                    | 3                                   | 3                                | 3                               | 3                                           |
| **Suggestion count**  | 5                                      | 5                                   | 6                                | 4                               | ~11 (grouped)                               |
| **Result types**      | Mixed (places, categories, businesses) | Places only                         | Places only                      | Places only                     | Grouped: Cities, Places, Campgrounds        |
| **Grouping**          | No (flat list)                         | No (flat list)                      | No (flat list)                   | No (flat list)                  | Yes (3 categories with headers)             |
| **Icons/badges**      | Yes (pin, search, business logos)      | Pin icon only                       | No icons                         | No icons                        | Icons + type badges (CITY, MAP, CAMPGROUND) |
| **Disambiguation**    | Country name, locality                 | Region (Ile de France), country     | Country only                     | Country, zip codes (US)         | State abbreviation, location                |
| **Proximity bias**    | Strong (viewport + user location)      | Moderate (user country)             | None observed                    | Weak                            | N/A (US-only)                               |
| **On selection**      | Pan/zoom map + details panel           | Fills field, no navigation          | Fills field, awaits button click | Navigates to map (z=15)         | Navigates to map+list view                  |
| **Speed**             | Instant (<100ms feel)                  | Fast (<200ms)                       | Fast (<300ms)                    | Moderate (~500ms)               | Fast (<300ms)                               |
| **Loading indicator** | None visible                           | None visible                        | None visible                     | None visible                    | None visible                                |
| **On focus (empty)**  | Recent searches + saved places         | Trending destinations               | Pre-filled suggestion            | Nothing                         | Search guidance + "Use my location"         |
| **Error (gibberish)** | Friendly message + suggestions         | Falls back to trending destinations | No autocomplete results shown    | No autocomplete results         | No autocomplete results                     |
| **Clear/reset**       | X clears input, map stays              | X clears input                      | Clear field manually             | Search bar resets on navigation | Search bar resets on navigation             |
| **Recent/history**    | Yes (with clock icons)                 | No (shows trending instead)         | No                               | No                              | No                                          |

---

## Detailed Findings by Site

### 1. Google Maps

**Trigger & autocomplete:**

- Autocomplete begins within 1-3 characters, feels instant
- Suggestions update on every keystroke with no perceptible delay
- 5 suggestions visible at a time

**Suggestion types:**

- Mixed results: place names (pin icon), search queries (search icon),
  businesses (brand logos)
- "Par" → parking, park, Paris France, Parker Hannifin, parking garage
- "Paris" → Paris France, Paris Orly Airport, parish, local Parish Hall, CDG
  Airport

**Disambiguation:**

- Strong proximity bias — results near current viewport/location appear
- "Paris" defaults to France (from UK), but local results like "Lydiard
  Millicent Parish Hall" also appear
- Country shown after city name: "Paris France"

**On selection:**

- Aggressive pan/zoom to selected location
- Rich details panel opens: photo, title, subtitle, action buttons (Directions,
  Save, Nearby, Share)
- Quick facts, hotel suggestions
- For cities: shows boundary area, no specific pin

**On focus (empty):**

- Shows Home, Work (saved places)
- Recent searches with clock icons
- "More from recent history" link
- Category chips in header: Restaurants, Hotels, Things to do, Museums,
  Transport, etc.

**Error state:**

- "Google Maps can't find _xyzqwfhjaksd_"
- Helpful: "Make sure search is spelled correctly. Try adding a city, county or
  postcode."
- Links: "Try Google Search instead", "Add a missing place"
- Map view unchanged

**Clear/reset:**

- X button clears input text
- Map stays at current position (does NOT reset to original view)

---

### 2. Booking.com

**Trigger & autocomplete:**

- Autocomplete triggers at ~3 characters
- Fast response, results appear all at once
- 5 suggestions visible

**Suggestion types:**

- Places only — no categories, businesses, or properties
- "Par" → Paris (Ile de France, France), Paris City Center, Paros (Greece),
  Disneyland Paris, Par (Cornwall, UK)
- Rich location context: region + country shown

**Disambiguation:**

- Shows region context: "Ile de France, France" not just "France"
- Sub-destinations: "Paris City Center" as a distinct option from "Paris"
- Attractions: "Disneyland Paris" as a separate entry

**On focus (empty):**

- "Trending destinations" heading
- Shows 5 popular destinations: London, Paris, Edinburgh, Amsterdam, Manchester
- Geo-aware trending (UK-biased list)

**Error state (gibberish):**

- Gracefully falls back to "Trending destinations" — same as empty state
- No error message at all — elegant degradation

**Clear/reset:**

- X button appears in input when text is present
- Clears text, dropdown disappears

---

### 3. Rome2Rio

**Trigger & autocomplete:**

- Dual-input search: "TRAVEL FROM" and "TO" fields
- "From" pre-filled with detected location (London, England)
- "To" pre-filled with a suggestion (Singapore)
- Autocomplete at ~3 characters

**Suggestion types:**

- Places only, "City, Country" format
- "Par" → Páros Greece, Paris France, Pār Naogaon Bangladesh, Parbelia India,
  Parañaque Philippines, Par England
- No proximity bias — Páros appears before Paris

**Disambiguation:**

- Simple "City, Country" format
- No region or state detail
- Global results with no apparent weighting by user location

**On selection:**

- Fills field text, dropdown closes
- Does NOT navigate — user must click "See all options" button
- Two-step interaction: select destination → click search

**Results page:**

- Full-page with map showing route + left panel with transport options
- Options: Train (BEST), Bus (CHEAPEST), Rideshare, Fly — with times and price
  ranges
- From/To fields persist in header for easy editing

**Error state:**

- No autocomplete results appear for gibberish
- No explicit error message in autocomplete

---

### 4. Park4Night

**Trigger & autocomplete:**

- Single search bar: "City, country, address ..."
- Autocomplete triggers at ~3 characters
- Results can feel slow compared to Google Maps/Booking.com

**Suggestion types:**

- Places only, plain text format
- "Par" → South Africa (?), Par PL24 2PA UK, Parwan Province Afghanistan, Par
  Iran
- "Paris" → Paris France, Paris 75460 USA, Paris 40361 USA, Paris 38242 USA
- Unusual ranking: 3-char results seem poorly ordered
- Better at 5 chars (full word match)

**Disambiguation:**

- Shows zip codes for US results (75460, 40361, 38242) — useful for US Parises
- Country name for non-US
- European-first bias: Paris France appears first for "Paris"

**On selection:**

- Immediate navigation to map view at zoom level 15 (very tight/street-level)
- Map shows campsite markers (P icons, colored markers)
- Left panel shows campsite cards: photo, name, description, amenity icons,
  booking button
- Filter and favorites buttons next to map search bar
- Search bar text clears (shows placeholder)

**On focus (empty):**

- Nothing shown — no trending, no history, no guidance

**Error state:**

- No autocomplete suggestions for gibberish
- No explicit error message

---

### 5. Campendium

**Trigger & autocomplete:**

- Two search bars: "Search Site" (header, small) + "Where do you want to camp?"
  (hero, large)
- Autocomplete at ~3 characters
- Fast response

**Suggestion types — best-in-class categorization:**

- **CITIES**: Syosset NY, Yosemite KY, Yosemite National Park CA, Yosemite
  Village CA (building icon, "CITY" badge)
- **PLACES**: Yosemite National Park CA — MAP, Yosemite National Park CA — INFO
  (mountain icon, "MAP"/"INFO" badge)
- **CAMPGROUNDS**: Individual campground names with location (mountain icon,
  "CAMPGROUND" badge)
- ~11 results across 3 grouped categories

**Disambiguation:**

- State abbreviations (NY, KY, CA) for US results
- Campground results include city: "Yosemite Pines RV Resort - Groveland, CA"
- MAP vs INFO distinction: same place, different result types

**On focus (empty):**

- Instructional text: "Start typing... City or State, National Park, National
  Forest, State Park, Campground Name"
- "USE MY LOCATION" button at bottom
- No recent history or trending

**On selection:**

- Navigates to map + list results page
- Map zoomed appropriately to area (not too tight)
- Left panel: listing count, filter bar (Sort By, Category, Price, More Filters)
- Rich campground cards: photo, "Bookable" badge, name, location, stars,
  reviews, type, excerpt
- Different colored markers on map by campground type

**Error state:**

- No autocomplete suggestions for gibberish
- USE MY LOCATION persists as fallback option

---

## Key Patterns Observed

### What the best sites do well

1. **Immediate feedback** — autocomplete starts at 1-3 characters, feels instant
2. **Contextual empty states** — Google Maps shows history, Booking.com shows
   trending, Campendium shows guidance
3. **Categorized results** — Campendium's grouped results
   (Cities/Places/Campgrounds) are the gold standard
4. **Rich disambiguation** — region, country, state, and zip codes help users
   pick the right place
5. **Graceful error handling** — Booking.com's fallback to trending is elegant;
   Google Maps shows helpful suggestions
6. **Proximity awareness** — Google Maps and Booking.com bias results toward the
   user's location
7. **Type indicators** — icons and badges help users scan results quickly

### Common weaknesses

1. **Park4Night** has poor 3-character ranking (South Africa for "Par"?)
2. **Rome2Rio** has no proximity bias (Páros before Paris from UK)
3. **Park4Night** zooms too aggressively on selection (z=15 is street-level for
   a city)
4. **Most sites** show no loading indicator during search (acceptable given
   speed)
5. **Only Google Maps** shows search history — others don't (privacy trade-off)

---

## Recommendations for camperplanning.com

Ranked by impact (highest first):

### 1. CRITICAL: Add categorized autocomplete results

**Impact: High | Effort: Medium**

Follow Campendium's grouped pattern. When a user types "Par", show:

- **Cities/Regions** — Paris France, Parma Italy (pin icon)
- **Campsites** — matching OSM campsites near/in those locations (tent icon)

This is the single biggest UX win. Our search currently treats everything as the
same type. Grouping immediately communicates what the user can search for.

### 2. HIGH: Show contextual empty state on focus

**Impact: High | Effort: Low**

When the search bar is clicked but empty, show:

- **Instructional text** like Campendium: "Search for a city, region, or
  campsite..."
- **"Use my location" button** (already exists as geolocation)
- If we track recent searches in localStorage: show those (like Google Maps)

This replaces a blank dropdown with useful affordances and reduces the "what do
I do?" moment.

### 3. HIGH: Add proximity/relevance bias to results

**Impact: High | Effort: Medium**

Current Nominatim geocoding results may not be well-ranked for European camper
travelers. We should:

- Bias results toward the current map viewport (like Google Maps)
- Prioritize European results over global ones
- Boost well-known cities/regions over obscure matches
- Consider using Photon (OSM-based geocoder with better relevance) or adding a
  client-side reranking step

### 4. MEDIUM: Show country/region context in results

**Impact: Medium | Effort: Low**

Always show "City, Region, Country" format like Booking.com's "Paris, Ile de
France, France" — not just "Paris". This:

- Disambiguates (Paris France vs Paris Texas)
- Builds confidence that the right result was selected
- Is trivially implementable with Nominatim's `display_name` field

### 5. MEDIUM: Graceful error/no-results state

**Impact: Medium | Effort: Low**

When no results match, instead of showing nothing:

- Show a message: "No places found for '[query]'"
- Suggest: "Try a city name, region, or country"
- Optionally show popular European destinations as fallback (like Booking.com's
  trending)
- Never leave the dropdown completely empty with text in the input

### 6. MEDIUM: Appropriate zoom level on selection

**Impact: Medium | Effort: Low**

When a user selects a city from search:

- **Cities**: zoom to level 10-12 (city overview, not street level)
- **Specific campsites**: zoom to level 14-15 (close enough to see the site)
- **Regions/countries**: zoom to fit the boundary

Park4Night's z=15 for Paris is far too tight. Google Maps' z=12 for Paris is
ideal.

### 7. LOW: Add result type icons

**Impact: Low | Effort: Low**

Add small icons before each suggestion:

- Pin icon for cities/places
- Tent/campsite icon for campsites
- Map icon for regions/countries

Campendium's approach with icons + badges is excellent. Even just icons would
help scanability.

### 8. LOW: Consider "Use my location" in search

**Impact: Low | Effort: Low**

Add a geolocation shortcut in the search dropdown (like Campendium). This is
especially useful for:

- Users who are currently traveling and want to find nearby campsites
- First-time users who don't know where to start

We already have geolocation — just surface it in the search dropdown.

### 9. LOW: Don't reset map on search clear

**Impact: Low | Effort: Low**

When the user clears search (clicks X), keep the map at its current position
(like Google Maps). Don't snap back to a default view. The user may want to
search for something else in the same area.

---

## Implementation Priority

| Priority | Recommendation                   | Dependencies                    |
| -------- | -------------------------------- | ------------------------------- |
| Sprint 1 | #2 Contextual empty state        | None                            |
| Sprint 1 | #4 Country/region in results     | Nominatim display_name          |
| Sprint 1 | #5 No-results error state        | None                            |
| Sprint 1 | #9 Don't reset on clear          | None                            |
| Sprint 2 | #1 Categorized results           | OSM campsite search integration |
| Sprint 2 | #6 Smart zoom levels             | Zoom level mapping              |
| Sprint 2 | #7 Result type icons             | Icon assets                     |
| Sprint 3 | #3 Proximity bias                | Viewport-aware geocoding        |
| Sprint 3 | #8 "Use my location" in dropdown | Existing geolocation service    |
