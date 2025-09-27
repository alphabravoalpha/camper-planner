# Environment Configuration

This document explains how to configure environment variables for the European Camper Trip Planner.

## Quick Setup

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` with your API keys (see below for how to obtain them)

## Required API Keys

### OpenRouteService (Required)
**Purpose:** Vehicle-safe routing with dimension restrictions
**Cost:** Free (2,000 requests/day)
**Setup:**
1. Visit https://openrouteservice.org/dev/#/signup
2. Create a free account
3. Generate an API key
4. Add to `.env.local`: `VITE_ORS_API_KEY=your_key_here`

## Optional Affiliate IDs

### Booking.com Affiliate
**Purpose:** Campsite booking links
**Commission:** 3-5%
**Setup:**
1. Apply for Booking.com Partner Program
2. Add to `.env.local`: `VITE_BOOKING_AFFILIATE_ID=your_id`

### Pitchup.com Affiliate
**Purpose:** Campsite booking alternative
**Commission:** Up to 8%
**Setup:**
1. Apply for Pitchup.com affiliate program
2. Add to `.env.local`: `VITE_PITCHUP_AFFILIATE_ID=your_id`

### ACSI Affiliate
**Purpose:** Camping card referrals
**Setup:**
1. Apply for ACSI affiliate program
2. Add to `.env.local`: `VITE_ACSI_AFFILIATE_CODE=your_code`

## Free Services (No API Keys Required)

- **Overpass API:** OSM campsite data
- **Nominatim:** Geocoding services
- **OpenStreetMap:** Map tiles
- **OSRM:** Backup routing service

## Development vs Production

### Development
- Use `.env.local` for local development
- API keys are for testing and development only
- Lower rate limits may apply

### Production
- Set environment variables in your hosting platform
- Use production API keys with higher rate limits
- Monitor usage to stay within free tiers

## Security Notes

- Never commit `.env.local` files to git
- API keys should be treated as secrets
- Rotate keys regularly
- Monitor API usage to detect abuse

## Troubleshooting

### Missing API Keys
If you see "API key not configured" errors:
1. Check that `.env.local` exists
2. Verify the key names match exactly (case-sensitive)
3. Restart the development server after adding keys

### Rate Limiting
If you encounter rate limit errors:
1. Check your usage against the service limits
2. Implement caching to reduce API calls
3. Consider upgrading to paid tiers for higher limits

### CORS Issues
If you encounter CORS errors in development:
1. API calls should work in production
2. Use the Vite proxy configuration if needed
3. Consider using a local development proxy