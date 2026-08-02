#!/usr/bin/env bash
# Builds build/icon.icns from design/icon.svg. Run after changing the mark.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ICONSET="$ROOT_DIR/build/icon.iconset"

command -v cairosvg >/dev/null || { echo "cairosvg is required: pip install cairosvg" >&2; exit 1; }

mkdir -p "$ROOT_DIR/build"
rm -rf "$ICONSET"
mkdir -p "$ICONSET"

cairosvg "$ROOT_DIR/design/icon.svg" -o "$ROOT_DIR/build/icon-1024.png" -W 1024 -H 1024

for size in 16 32 128 256 512; do
  sips -z "$size" "$size" "$ROOT_DIR/build/icon-1024.png" --out "$ICONSET/icon_${size}x${size}.png" >/dev/null
  retina=$((size * 2))
  sips -z "$retina" "$retina" "$ROOT_DIR/build/icon-1024.png" --out "$ICONSET/icon_${size}x${size}@2x.png" >/dev/null
done

iconutil -c icns "$ICONSET" -o "$ROOT_DIR/build/icon.icns"
rm -rf "$ICONSET"
echo "build/icon.icns written."
