#!/usr/bin/env bash
set -euo pipefail

APP_NAME="Bars"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_ELECTRON="$ROOT_DIR/node_modules/electron/dist/Electron.app"
FALLBACK_ELECTRON="/Users/toshonjennings/opal/node_modules/electron/dist/Electron.app"

pkill -f "Electron .*idea-tracker" 2>/dev/null || true
pkill -f "--app-path=$ROOT_DIR" 2>/dev/null || true

if [[ -d "$PROJECT_ELECTRON" ]]; then
  ELECTRON_APP="$PROJECT_ELECTRON"
elif [[ -d "$FALLBACK_ELECTRON" ]]; then
  ELECTRON_APP="$FALLBACK_ELECTRON"
else
  echo "Electron is not installed. Run npm install, then retry." >&2
  exit 1
fi

open -n "$ELECTRON_APP" --args "$ROOT_DIR"
sleep 1

if pgrep -f "Electron .*idea-tracker" >/dev/null || pgrep -f "--app-path=$ROOT_DIR" >/dev/null; then
  echo "$APP_NAME launched."
else
  echo "$APP_NAME launch was requested, but no Electron process was found." >&2
  exit 1
fi
