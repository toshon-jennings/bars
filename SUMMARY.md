# Project Summary — Bars / Idea Tracker

## Purpose

Bars is a lightweight, local-first idea notebook for capturing thoughts quickly and refining them later. The current product target is desktop-first for AI, with a responsive mobile companion experience for capture, review, edit, import, export, and Settings.

## Product Boundaries

- Desktop Electron app: full experience, including local AI through LM Studio/Ollama detection.
- Mobile web: companion notebook only. It should remain usable and responsive, but it does not detect local AI.
- Settings: stores common hosted-provider API keys locally. These keys are not yet wired into hosted AI calls.
- Next planned work: integrate cloud/hosted models using the saved Settings keys, while keeping the provider path small.
- Sync: manual import/export today. Automatic cloud sync remains future work.

## Source Map

- `index.html` — static app shell, topbar actions, capture UI, AI panel, notebook/detail panes, Settings modal.
- `styles.css` — full visual system and responsive layout. Preserve the "rhyme book" design language from `DECISIONS.md`.
- `app.js` — localStorage state, idea CRUD, filters, import/export, Settings key storage, local AI UI behavior.
- `electron/main.cjs` — Electron shell, LM Studio/Ollama provider detection, local model request handlers.
- `electron/preload.cjs` — exposes `window.barsAI` to the renderer. This bridge is desktop-only.
- `manifest.webmanifest`, `icons/`, `favicon.svg` — install/branding assets.
- `HANDOFF.md` — current state and open work.
- `DECISIONS.md` — append-only milestone decisions.
- `HITL.md` — human rulings.
- `AGENTS.md` — repo-specific instructions for coding agents.

## Current Implementation Notes

- Ideas live in localStorage under `idea-tracker:v1`.
- API keys live separately under `idea-tracker:api-keys:v1` and must not be included in bar exports.
- All user-provided content rendered into HTML should pass through `escapeHtml()`.
- Service Worker caching was intentionally removed; do not reintroduce it unless Toshon explicitly asks.
- The next planned feature is cloud model integration using the saved API keys. Keep it small: wire one provider first or reuse the saved key map without introducing a heavy settings system.
