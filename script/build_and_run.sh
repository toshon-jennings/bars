#!/usr/bin/env bash
# Runs Bars from source for development.
# For an installable build, use `npm run dist` instead.
set -euo pipefail

APP_NAME="Bars"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ELECTRON_APP="$ROOT_DIR/node_modules/electron/dist/Electron.app"

pkill -f -- "--app-path=$ROOT_DIR" 2>/dev/null || true

if [[ ! -d "$ELECTRON_APP" ]]; then
  echo "Electron is not installed. Run npm install, then retry." >&2
  echo "If npm blocked the install script, run: npm install-scripts approve electron" >&2
  exit 1
fi

open -n "$ELECTRON_APP" --args "$ROOT_DIR"
sleep 1

if pgrep -f -- "--app-path=$ROOT_DIR" >/dev/null; then
  echo "$APP_NAME launched."
else
  echo "$APP_NAME launch was requested, but no Electron process was found." >&2
  exit 1
fi
