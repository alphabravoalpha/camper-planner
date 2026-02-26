# Monetisation Research — 2026-02-26

## Viable Programmes

### 1. Eurocampings (ACSI) — via TradeTracker

- **URL:** https://www.eurocampings.co.uk/extra-information/affiliate-partners/
- **Network:** TradeTracker
- **Commission:** 3% per booking + EUR 0.25 per review
- **How to apply:** Sign up free at TradeTracker.com, request access to the
  Eurocampings campaign, and await approval.
- **Relevance:** HIGH — Eurocampings is Europe's largest campsite search engine
  (run by ACSI). Their audience aligns perfectly with ours: European campervan
  and motorhome travellers looking for campsites. Bookable campsites across
  Europe with reviews and ratings.

### 2. camping.info — via Awin

- **URL:** https://www.camping.info/en/info/partner-program
- **Network:** Awin (Advertiser ID: 44063 for DE/AT)
- **Commission:** 5.8% per completed booking (via Compusoft, Ctoutvert, Max
  Camping International); EUR 0.50 per app install
- **How to apply:** Create an Awin publisher account (free), then request access
  to the camping.info campaign.
- **Relevance:** HIGH — camping.info is a major European campsite directory with
  online booking. Their 5.8% commission rate is significantly better than most
  accommodation affiliates. Excellent fit for our audience. Provides banners and
  marketing materials.

### 3. Amazon Associates UK

- **URL:** https://affiliate-program.amazon.co.uk/
- **Network:** Amazon Associates (direct)
- **Commission:** 3% for Outdoors/Sports category (reduced from 8% in 2020);
  24-hour cookie
- **How to apply:** Sign up at affiliate-program.amazon.co.uk. Requires a
  website with content. Account reviewed after first 3 qualifying sales (must
  happen within 180 days of signup).
- **Relevance:** HIGH — Our gear guide blog article creates a natural
  integration point. Even at 3%, the volume of products (gas stoves, solar
  panels, levelling ramps, first aid kits, etc.) and high average basket values
  for camping gear make this worthwhile. Amazon's brand trust converts well.
  Tag: `camperplann04-21` (placeholder).

### 4. Awin Network — General Travel

- **URL:** https://www.awin.com/gb/
- **Network:** Awin (direct)
- **Commission:** Varies by advertiser
- **How to apply:** Create a publisher account at awin.com. One-time GBP 1
  deposit (refunded on first payment). Apply to individual advertiser campaigns.
- **Relevance:** MEDIUM-HIGH — Beyond camping.info, Awin hosts several relevant
  travel advertisers including Go Outdoors (outdoor gear retailer), Booking.com,
  and various European travel brands. Worth having an account for access to the
  camping.info programme alone, but also opens doors to other campaigns.

### 5. Booking.com — via CJ (Commission Junction)

- **URL:** https://www.cj.com/ (already applied)
- **Network:** CJ
- **Commission:** 3-5% per completed stay
- **Status:** Application submitted, awaiting approval
- **Relevance:** HIGH — Already integrated in BookingService.ts. World's largest
  accommodation platform with campsite listings. Pending approval.

## Not Viable

### Campsy

- **Reason:** Campsy was acquired by Camping and Co in 2017 (Rocket Internet
  deal). The platform no longer operates independently and has been absorbed
  into the parent company. No active affiliate programme exists.

### Pitchup

- **Reason:** No public affiliate programme available. Pitchup does not offer an
  open affiliate or partner programme. Would need to approach directly once site
  has traffic, but nothing to sign up for now. Removing from BookingService.

### ACSI (direct)

- **Reason:** ACSI sells discount camping cards and printed guides — not
  campsite bookings. Their affiliate programme (via TradeTracker) is focused on
  card/guide sales, not accommodation bookings. However, their subsidiary
  Eurocampings _does_ have a booking affiliate programme (listed above as
  viable). Removing the ACSI provider from BookingService but adding
  Eurocampings instead.

### CJ — camping-specific advertisers beyond Booking.com

- **Reason:** CJ's camping-specific advertisers are primarily US-focused (RV
  rentals, US campgrounds). No significant European camping booking advertisers
  found beyond Booking.com. The RV rental programme (4% commission, USD 900 avg
  booking) is irrelevant to our European audience.

## Recommended Priority

1. **Amazon Associates UK** — Sign up immediately. The gear guide article is
   ready to generate clicks. Low barrier to entry, universally trusted brand,
   and creates a content monetisation stream independent of campsite bookings.

2. **camping.info via Awin** — Sign up for Awin, then apply to camping.info
   campaign. Best commission rate (5.8%) of any campsite booking affiliate. Add
   to BookingService once approved.

3. **Eurocampings via TradeTracker** — Sign up for TradeTracker, apply to
   Eurocampings campaign. 3% commission on European campsite bookings. Add to
   BookingService once approved.

4. **Booking.com via CJ** — Already applied. Await approval and add affiliate ID
   to GitHub Secrets once received.

5. **Awin general travel** — Once Awin account is active for camping.info,
   explore additional campaigns (Go Outdoors, ferry operators, travel
   insurance).

### Revenue Model Estimate (at 1,000 monthly visitors)

| Source             | Est. monthly clicks | Conv. rate | Avg. commission | Est. monthly |
| ------------------ | ------------------- | ---------- | --------------- | ------------ |
| Amazon gear links  | 50                  | 3%         | GBP 1.50        | GBP 2.25     |
| camping.info       | 30                  | 2%         | EUR 8.00        | EUR 4.80     |
| Eurocampings       | 20                  | 2%         | EUR 5.00        | EUR 2.00     |
| Booking.com        | 40                  | 1%         | EUR 6.00        | EUR 2.40     |
| **Total estimate** |                     |            |                 | **~GBP 10**  |

Revenue will scale with traffic. At 10,000 monthly visitors, the model suggests
GBP 80-120/month — enough to cover domain costs and justify development time.
Focus first on content and SEO to drive traffic; monetisation follows naturally.
