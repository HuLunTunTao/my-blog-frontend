#!/bin/bash
# After Vite build, copy hashed CSS to the stable path used by SSR HTML.
# JS is emitted directly as assets/index.js by Vite/Rollup config.
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

# Verify JS
STABLE_JS="$DIST_DIR/assets/index.js"
if [ ! -f "$STABLE_JS" ]; then
  echo "ERROR: No stable JS entry found at $STABLE_JS" >&2
  exit 1
fi
echo "Verified assets/index.js"
