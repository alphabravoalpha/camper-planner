#!/bin/bash
# Quick TypeScript error fixes for campsite components

# Fix type-only imports in campsite components
find src/components/campsite -name "*.tsx" -type f -exec sed -i \
  -e 's/^import { \(CampsiteType\) } from/import type { \1 } from/g' \
  -e 's/^import { \(Campsite\) } from/import type { \1 } from/g' \
  -e 's/^import { \(CampsiteType, Campsite\)/import type { CampsiteType, Campsite/g' \
  -e 's/^import { \(CampsiteRequest\)/import type { \1/g' \
  {} \;

# Fix analytics
sed -i 's/^import { \(ShareAnalytics\)/import type { \1/g' src/components/analytics/SharingAnalytics.tsx

echo "Fixed type-only imports"
echo "Remaining fixes need manual intervention (unused variables, property mismatches)"
