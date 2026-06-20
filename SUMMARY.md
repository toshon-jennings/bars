# Project Summary — Bars / Idea Tracker

## Purpose

Bars is a lightweight, local-first idea notebook for capturing thoughts quickly and refining them later. The current product target is desktop-first for AI, with a responsive mobile companion experience for capture, review, edit, import, export, and Settings.

## Product Boundaries

- Desktop Electron app: full experience, including local AI through LM Studio, Jan, and Ollama detection and cloud AI through saved API keys.
- Mobile web: companion notebook only. It should remain usable and responsive, but it does not detect local AI.
- Settings: stores common hosted-provider API keys through Electron safeStorage in desktop mode, with localStorage fallback in browser mode. Keys are not included in bar exports.
- Cloud AI: desktop provider calls use the saved Settings keys from the Electron main process.
- Sync: manual import/export today. Automatic cloud sync remains future work.

## Source Map

- `index.html` — static app shell, topbar actions, capture UI, AI panel, notebook/detail panes, Settings modal.
- `styles.css` — full visual system and responsive layout. Preserve the "rhyme book" design language from `DECISIONS.md`.
- `app.js` — localStorage state, idea CRUD, filters, import/export, Settings key storage, local AI UI behavior.
- `electron/main.cjs` — Electron shell, LM Studio, Jan, and Ollama provider detection, local model request handlers.
- `electron/preload.cjs` — exposes `window.barsAI` to the renderer. This bridge is desktop-only.
- `manifest.webmanifest`, `icons/`, `favicon.svg` — install/branding assets.
- `HANDOFF.md` — current state and open work.
- `DECISIONS.md` — append-only milestone decisions.
- `HITL.md` — human rulings.
- `AGENTS.md` — repo-specific instructions for coding agents.

## Current Implementation Notes

- Ideas live in localStorage under `idea-tracker:v1`.
- API keys are encrypted in the Electron user data directory with `safeStorage` in desktop mode. Browser fallback keys live under `idea-tracker:api-keys:v1`. Neither path is included in bar exports.
- All user-provided content rendered into HTML should pass through `escapeHtml()`.
- Service Worker caching was intentionally removed; do not reintroduce it unless Toshon explicitly asks.
- Cloud model integration is intentionally small: configured providers appear in the AI picker, OpenRouter pulls its live model catalog, model names remain editable, and requests run through Electron main so keys are not exposed to provider calls from renderer code.
