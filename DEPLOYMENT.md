# Deployment Guide

This document explains how to deploy the European Camper Trip Planner following zero-cost scalability principles.

## Zero-Cost Hosting Options

### 1. Netlify (Recommended)
**Features:** Global CDN, automatic HTTPS, branch deploys
**Setup:**
1. Connect GitHub repository to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Set environment variables in Netlify dashboard

### 2. Vercel
**Features:** Edge functions, automatic deployments
**Setup:**
1. Import GitHub repository in Vercel
2. Framework preset: Vite
3. Build command: `npm run build`
4. Output directory: `dist`

### 3. GitHub Pages
**Features:** Free hosting, automatic deployment
**Setup:**
1. Enable GitHub Pages in repository settings
2. Use GitHub Actions workflow (already configured)
3. Deploy from `gh-pages` branch

## Build Process

### Local Build
```bash
npm install
npm run build
```

### Production Build
The CI/CD pipeline automatically:
1. Installs dependencies
2. Runs linting and type checking
3. Builds the application
4. Deploys to staging

## Environment Variables in Production

Set these in your hosting platform:

**Required:**
- `VITE_ORS_API_KEY` - OpenRouteService API key

**Optional:**
- `VITE_BOOKING_AFFILIATE_ID` - Booking.com affiliate ID
- `VITE_PITCHUP_AFFILIATE_ID` - Pitchup.com affiliate ID
- `VITE_ACSI_AFFILIATE_CODE` - ACSI affiliate code

## Static Site Optimization

The application is configured for optimal static hosting:

- **Asset Hashing:** Enables long-term caching
- **Chunk Splitting:** Improves loading performance
- **Environment Variables:** Prefixed with `VITE_` for build-time replacement
- **CDN Ready:** All assets use relative paths

## Performance Considerations

### Caching Strategy
- HTML: No cache (for updates)
- JS/CSS: Long-term cache (with hash filenames)
- Images: Long-term cache
- API responses: Client-side caching

### Loading Optimization
- Code splitting by routes
- Lazy loading for V2 components
- Progressive enhancement for features

## Monitoring

### Free Monitoring Options
- **Netlify Analytics:** Basic usage stats
- **Google Analytics:** User behavior (if needed)
- **Console Logging:** Client-side error tracking

### Performance Monitoring
- Lighthouse CI integration
- Core Web Vitals tracking
- Bundle size monitoring

## Rollback Strategy

### Quick Rollback
1. Revert to previous git commit
2. CI/CD will automatically redeploy
3. DNS changes propagate within minutes

### Emergency Maintenance
1. Update index.html with maintenance message
2. Deploy minimal maintenance page
3. Restore full application when ready

## Cost Monitoring

### Free Tier Limits
- **Netlify:** 100GB bandwidth/month
- **Vercel:** 100GB bandwidth/month
- **GitHub Pages:** 1GB storage, 100GB bandwidth/month

### Usage Tracking
Monitor these metrics:
- Monthly bandwidth usage
- Build minutes consumed
- API request counts
- Storage usage

## Security

### HTTPS
All recommended platforms provide automatic HTTPS.

### Content Security Policy
Configure CSP headers for:
- Script sources
- Image sources
- API endpoints

### API Key Security
- Never expose API keys in client code
- Use environment variables for all secrets
- Rotate keys regularly
- Monitor API usage for abuse