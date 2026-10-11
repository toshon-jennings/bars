#!/usr/bin/env bash
set -euo pipefail

PKG_VERSION=$(node -p "require('./package.json').version")
CACHE_NAME=$(grep -oE 'bars-shell-[0-9]+\.[0-9]+\.[0-9]+' sw.js || true)

if [[ "$CACHE_NAME" != "bars-shell-$PKG_VERSION" ]]; then
  echo "ERROR: sw.js CACHE_NAME ($CACHE_NAME) does not match package.json version ($PKG_VERSION)" >&2
  exit 1
fi

echo "OK: sw.js CACHE_NAME matches package.json version ($PKG_VERSION)"
