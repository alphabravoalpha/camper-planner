#!/bin/bash
# Systematically fix all type-only import errors (TS1484)

echo "Fixing type-only imports across entire codebase..."

# Get all files with TS1484 errors
npm run build 2>&1 | grep "error TS1484" | cut -d'(' -f1 | sort -u | while read -r file; do
    if [ -f "$file" ]; then
        echo "Processing: $file"

        # Fix common patterns - these are type-only imports that need 'import type'
        sed -i \
            -e 's/^import { \([A-Za-z, ]*\) } from/import type { \1 } from/g' \
            "$file"

        # Check if we need to keep both value and type imports
        # This is trickier - will handle manually if needed
    fi
done

echo "Phase 1 complete: Type-only imports fixed"
echo "Running type check..."
npm run type-check 2>&1 | grep -c "error TS"
