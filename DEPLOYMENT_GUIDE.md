# 🚀 Deployment Guide: European Camper Trip Planner

This guide walks you through deploying the European Camper Trip Planner to GitHub Pages with a custom domain.

## 📋 Prerequisites

1. ✅ All code committed to the `main` branch
2. ✅ GitHub repository: `https://github.com/alphabravoalpha/camper-planner`
3. ✅ Node.js 18+ installed locally
4. ✅ npm/yarn package manager
5. ✅ Git configured with GitHub access

## 🏗️ Build Configuration

The project is configured for GitHub Pages deployment with:

- **Base Path**: `/camper-planner/` for GitHub Pages subdirectory
- **Custom Domain**: `camperplanning.com` via CNAME file
- **Static Site**: Built with Vite for optimal performance
- **Asset Optimization**: Chunked builds for better caching

## 🚀 Deployment Methods

### Method 1: Automated with GitHub Actions (Recommended)

The repository includes automated GitHub Actions workflows:

1. **Push to main branch** triggers automatic deployment
2. **GitHub Actions** builds and deploys to Pages
3. **Verification** checks deployment success

```bash
# Simply push to main branch
git push origin main
```

### Method 2: Manual Deployment Script

Use the provided deployment script:

```bash
# Run the deployment script
./deploy.sh
```

### Method 3: Manual Commands

Step-by-step manual deployment:

```bash
# 1. Install dependencies
npm ci

# 2. Build production version
NODE_ENV=production npm run build

# 3. Deploy to GitHub Pages
npm run deploy:custom
```

## ⚙️ GitHub Repository Configuration

### Step 1: Enable GitHub Pages

1. Go to your repository: `https://github.com/alphabravoalpha/camper-planner`
2. Click **Settings** tab
3. Scroll to **Pages** section
4. Under **Source**, select:
   - **Deploy from a branch**
   - **Branch**: `gh-pages`
   - **Folder**: `/ (root)`
5. Click **Save**

### Step 2: Configure Custom Domain

1. In the same **Pages** section
2. Under **Custom domain**, enter: `camperplanning.com`
3. Check **Enforce HTTPS**
4. Click **Save**

## 🌐 DNS Configuration for camperplanning.com

Configure your domain registrar to point to GitHub Pages:

### A Records (IPv4)
```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

### AAAA Records (IPv6)
```
2606:50c0:8000::153
2606:50c0:8001::153
2606:50c0:8002::153
2606:50c0:8003::153
```

### Alternative: CNAME Record
If using a subdomain (like `www.camperplanning.com`):
```
CNAME: alphabravoalpha.github.io
```

## 🔍 Verification Steps

### 1. Check GitHub Pages URL
```bash
curl -I https://alphabravoalpha.github.io/camper-planner/
```

### 2. Verify Custom Domain (after DNS propagation)
```bash
curl -I https://camperplanning.com/
```

### 3. Test Application Features
- ✅ Map loads correctly
- ✅ Waypoint management works
- ✅ Export functionality operational
- ✅ Sharing features functional
- ✅ Mobile responsiveness
- ✅ All navigation links work

## 📊 Deployment URLs

| Environment | URL | Purpose |
|-------------|-----|---------|
| **Production** | `https://camperplanning.com` | Main custom domain |
| **GitHub Pages** | `https://alphabravoalpha.github.io/camper-planner/` | Backup/canonical URL |
| **Development** | `http://localhost:3000` | Local development |
| **Preview** | `http://localhost:4173` | Local production preview |

## 🚀 Launch Checklist

Before going live:

- [ ] All tests pass
- [ ] Performance scores >90
- [ ] Accessibility compliance verified
- [ ] Cross-browser compatibility tested
- [ ] Mobile responsiveness confirmed
- [ ] Analytics and monitoring configured
- [ ] Error tracking enabled
- [ ] Backup and recovery plan ready

---

**🎉 Ready to launch the European Camper Trip Planner!**