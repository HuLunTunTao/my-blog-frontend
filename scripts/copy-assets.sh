#!/bin/bash
# After Vite build, copy hashed CSS/JS to stable paths for SSR HTML references.
set -euo pipefail

DIST_DIR="${1:-dist}"

# Copy CSS
HASHED_CSS=$(find "$DIST_DIR/assets" -name 'index-*.css' | head -1)
if [ -z "$HASHED_CSS" ]; then
  echo "ERROR: No index-*.css found in $DIST_DIR/assets" >&2
  exit 1
fi
cp "$HASHED_CSS" "$DIST_DIR/assets/index.css"
echo "Copied $(basename "$HASHED_CSS") -> assets/index.css"

# Copy JS
HASHED_JS=$(find "$DIST_DIR/assets" -name 'index-*.js' | head -1)
if [ -z "$HASHED_JS" ]; then
  echo "ERROR: No index-*.js found in $DIST_DIR/assets" >&2
  exit 1
fi
cp "$HASHED_JS" "$DIST_DIR/assets/index.js"
echo "Copied $(basename "$HASHED_JS") -> assets/index.js"
