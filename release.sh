#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TAURI_CONF="$SCRIPT_DIR/src-tauri/tauri.conf.json"

# Check for jq
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is required but not installed.${NC}"
    echo "Install with: brew install jq"
    exit 1
fi

# Read current version
CURRENT_VERSION=$(jq -r '.version' "$TAURI_CONF")
echo -e "${CYAN}Current version:${NC} $CURRENT_VERSION"

# Calculate next patch version
IFS='.' read -r major minor patch <<< "$CURRENT_VERSION"
NEXT_PATCH=$((patch + 1))
NEXT_VERSION="$major.$minor.$NEXT_PATCH"

# Build
echo -e "${CYAN}Building release...${NC}"
if ! bun run tauri build; then
    echo -e "${RED}Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}Build complete!${NC}"

# Find DMG
DMG_PATH="$SCRIPT_DIR/src-tauri/target/release/bundle/dmg/iphone-to-pixel_${CURRENT_VERSION}_aarch64.dmg"
if [[ ! -f "$DMG_PATH" ]]; then
    # Try alternate naming pattern
    DMG_PATH=$(find "$SCRIPT_DIR/src-tauri/target/release/bundle/dmg" -name "*.dmg" | head -1)
fi

if [[ ! -f "$DMG_PATH" ]]; then
    echo -e "${RED}Error: DMG not found${NC}"
    exit 1
fi

# Calculate SHA256
SHA256=$(shasum -a 256 "$DMG_PATH" | awk '{print $1}')

# Update Homebrew cask file
CASK_FILE="$SCRIPT_DIR/../homebrew-tap/Casks/iphone-to-pixel.rb"
if [[ -f "$CASK_FILE" ]]; then
    echo -e "${CYAN}Updating Homebrew cask...${NC}"
    # Update version
    sed -i '' "s/version \".*\"/version \"$CURRENT_VERSION\"/" "$CASK_FILE"
    # Update sha256
    sed -i '' "s/sha256 \".*\"/sha256 \"$SHA256\"/" "$CASK_FILE"
    echo -e "${GREEN}Cask file updated!${NC}"
else
    echo -e "${RED}Warning: Cask file not found at $CASK_FILE${NC}"
fi

# Output
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}SHA256:${NC} $SHA256"
echo -e "${GREEN}Version:${NC} $CURRENT_VERSION → $NEXT_VERSION"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}To publish this release to GitHub:${NC}"
echo ""
echo "  1. Commit your version changes:"
echo "     git add -A && git commit -m \"Release v$CURRENT_VERSION\""
echo ""
echo "  2. Create and push a git tag:"
echo "     git tag v$CURRENT_VERSION"
echo "     git push origin main --tags"
echo ""
echo "  3. Create GitHub release and upload DMG:"
echo "     gh release create v$CURRENT_VERSION \"$DMG_PATH\" --title \"v$CURRENT_VERSION\" --generate-notes"
echo ""
echo -e "${CYAN}Then update your Homebrew cask with the SHA256 above. The ruby file has been updated, please verify before committing.${NC}"
