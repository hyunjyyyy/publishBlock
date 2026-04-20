#!/bin/bash

# build.sh - Package CleanBook extension for Chrome and Firefox

PROJECT_NAME="CleanBook"
VERSION=$(grep '"version"' manifest.json | cut -d '"' -f 4)
DIST_DIR="dist"

echo "Building $PROJECT_NAME v$VERSION..."

# Create distribution directory
mkdir -p $DIST_DIR

# Files to include in the package
FILES="manifest.json content.js popup.js popup.html icons images PRIVACY.md README.md"

# Package for Chrome/Generic (ZIP)
CHROME_ZIP="$DIST_DIR/${PROJECT_NAME}_v${VERSION}_chrome.zip"
echo "Packaging for Chrome: $CHROME_ZIP"
zip -r "$CHROME_ZIP" $FILES > /dev/null

# Package for Firefox (ZIP)
FIREFOX_ZIP="$DIST_DIR/${PROJECT_NAME}_v${VERSION}_firefox.zip"
echo "Packaging for Firefox: $FIREFOX_ZIP"
zip -r "$FIREFOX_ZIP" $FILES > /dev/null

echo "Build complete! Check the '$DIST_DIR' folder."
