#!/bin/bash

# Component Generation Script
# Usage: ./create-component.sh ComponentName [type] [description]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to display usage
show_usage() {
    echo "Usage: $0 <ComponentName> [type] [description]"
    echo ""
    echo "Types:"
    echo "  component  - Regular component (default)"
    echo "  page       - Page component"
    echo "  ui         - UI component"
    echo "  form       - Form component"
    echo ""
    echo "Examples:"
    echo "  $0 MapControls"
    echo "  $0 SettingsPage page"
    echo "  $0 CheckboxInput ui \"Reusable checkbox component\""
}

# Check if component name is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Component name is required${NC}"
    show_usage
    exit 1
fi

COMPONENT_NAME="$1"
COMPONENT_TYPE="${2:-component}"
DESCRIPTION="${3:-$COMPONENT_NAME component}"

# Validate component name
if [[ ! "$COMPONENT_NAME" =~ ^[A-Z][a-zA-Z0-9]*$ ]]; then
    echo -e "${RED}Error: Component name must be PascalCase (e.g., MyComponent)${NC}"
    exit 1
fi

# Determine paths based on type
case "$COMPONENT_TYPE" in
    "page")
        COMPONENT_DIR="src/pages"
        TEMPLATE_FILE="src/templates/Page.template.tsx"
        FEATURE_FLAG="BASIC_MAP_DISPLAY"
        I18N_KEY="page"
        ;;
    "ui")
        COMPONENT_DIR="src/components/ui"
        TEMPLATE_FILE="src/templates/Component.template.tsx"
        ;;
    "form")
        COMPONENT_DIR="src/components/forms"
        TEMPLATE_FILE="src/templates/Component.template.tsx"
        ;;
    "component"|*)
        COMPONENT_DIR="src/components"
        TEMPLATE_FILE="src/templates/Component.template.tsx"
        ;;
esac

COMPONENT_FILE="$COMPONENT_DIR/$COMPONENT_NAME.tsx"

# Check if component already exists
if [ -f "$COMPONENT_FILE" ]; then
    echo -e "${RED}Error: Component $COMPONENT_NAME already exists at $COMPONENT_FILE${NC}"
    exit 1
fi

# Check if template exists
if [ ! -f "$TEMPLATE_FILE" ]; then
    echo -e "${RED}Error: Template file $TEMPLATE_FILE not found${NC}"
    exit 1
fi

# Create directory if it doesn't exist
mkdir -p "$COMPONENT_DIR"

echo -e "${BLUE}Creating $COMPONENT_TYPE: $COMPONENT_NAME${NC}"
echo -e "${YELLOW}Description: $DESCRIPTION${NC}"

# Generate component from template
cp "$TEMPLATE_FILE" "$COMPONENT_FILE"

# Replace template variables
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/{{COMPONENT_NAME}}/$COMPONENT_NAME/g" "$COMPONENT_FILE"
    sed -i '' "s/{{PAGE_NAME}}/$COMPONENT_NAME/g" "$COMPONENT_FILE"
    sed -i '' "s/{{DESCRIPTION}}/$DESCRIPTION/g" "$COMPONENT_FILE"
    if [ -n "$FEATURE_FLAG" ]; then
        sed -i '' "s/{{FEATURE_FLAG}}/$FEATURE_FLAG/g" "$COMPONENT_FILE"
    fi
    if [ -n "$I18N_KEY" ]; then
        sed -i '' "s/{{i18n_key}}/$I18N_KEY/g" "$COMPONENT_FILE"
    fi
else
    # Linux
    sed -i "s/{{COMPONENT_NAME}}/$COMPONENT_NAME/g" "$COMPONENT_FILE"
    sed -i "s/{{PAGE_NAME}}/$COMPONENT_NAME/g" "$COMPONENT_FILE"
    sed -i "s/{{DESCRIPTION}}/$DESCRIPTION/g" "$COMPONENT_FILE"
    if [ -n "$FEATURE_FLAG" ]; then
        sed -i "s/{{FEATURE_FLAG}}/$FEATURE_FLAG/g" "$COMPONENT_FILE"
    fi
    if [ -n "$I18N_KEY" ]; then
        sed -i "s/{{i18n_key}}/$I18N_KEY/g" "$COMPONENT_FILE"
    fi
fi

echo -e "${GREEN}✅ Component created: $COMPONENT_FILE${NC}"

# Update index file if it exists
INDEX_FILE="$COMPONENT_DIR/index.ts"
if [ -f "$INDEX_FILE" ] && [ "$COMPONENT_TYPE" = "ui" ]; then
    echo "export { default as $COMPONENT_NAME } from './$COMPONENT_NAME';" >> "$INDEX_FILE"
    echo -e "${GREEN}✅ Updated index file: $INDEX_FILE${NC}"
fi

echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Customize the component implementation"
echo "2. Add props and TypeScript interfaces"
echo "3. Import and use in your application"
echo ""
echo "Import statement:"
echo -e "${YELLOW}import $COMPONENT_NAME from '@/components/$COMPONENT_NAME';${NC}"