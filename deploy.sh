#!/bin/bash

# European Camper Trip Planner - GitHub Pages Deployment Script
# This script builds and deploys the application to GitHub Pages

echo "🚀 Starting deployment to GitHub Pages..."

# Check if we're on the main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "❌ Error: You must be on the main branch to deploy"
    exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Error: You have uncommitted changes. Please commit all changes before deploying."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm ci
fi

# Build the application
echo "🔨 Building production version..."
NODE_ENV=production npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Error: Build failed - dist directory not found"
    exit 1
fi

# Add CNAME file for custom domain
echo "🌐 Adding custom domain configuration..."
echo "camperplanning.com" > dist/CNAME

# Deploy to gh-pages branch
echo "📤 Deploying to GitHub Pages..."
npx gh-pages -d dist

echo "✅ Deployment complete!"
echo ""
echo "🌍 Your site will be available at:"
echo "   📍 GitHub Pages: https://alphabravoalpha.github.io/camper-planner/"
echo "   📍 Custom Domain: https://camperplanning.com (after DNS setup)"
echo ""
echo "📋 Next steps:"
echo "   1. Configure GitHub Pages settings in your repository"
echo "   2. Set up DNS for camperplanning.com to point to GitHub Pages"
echo "   3. Wait a few minutes for deployment to complete"