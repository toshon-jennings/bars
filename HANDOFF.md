# Idea Tracker Handoff

## Objective

Build a lightweight idea tracker that works well on laptop and phone.

## Current State

- [x] Empty workspace inspected.
- [x] Dependency-free web app created.
- [x] Local browser storage implemented.
- [x] Import/export implemented for moving data between devices.
- [x] Browser favicon added.
- [x] Quick "Need to remember" Inbox capture added.
- [x] Full visual redesign: dark "rhyme book" theme (Big Shoulders Display + Spline Sans/Mono, grain, gold accents).
- [x] Hero quick-capture bar with ⌘/Ctrl+Enter shortcut and auto-growing textarea.
- [x] Stats strip: total bars, inbox, building, day capture streak.
- [x] Status filter chips (replacing select), colored status pills, relative timestamps.
- [x] Score renamed "Heat"; impact/effort shown as dots; full idea form moved into collapsible "write one up properly".
- [x] Removed Service Worker caching entirely to prevent local update lock-ins.
- [x] Straightened container in the ON THE PAGE section (removed slant transform).
- [x] Added edit functionality to quick notes (Inbox bars) via the writeup form.
- [x] Added MIT License (attribution required).
- [x] Electron desktop shell added with LM Studio, Jan, and Ollama detection and Ask your bars panel.
- [x] Salvaged old PWA notes from Chrome Profile 3 Local Storage into `recovered-bars-2026-06-14T18-49-56-066Z.json` (2 bars recovered).
- [x] Scanned Chrome session-restore files for missing Quick Notes; report saved locally, but no candidates scored as natural Quick Note text.
- [x] Added Settings modal for common provider API keys; keys stay in browser localStorage and are excluded from bar exports.
- [x] Documented desktop/mobile AI boundary and Settings scope in `SUMMARY.md`, `README.md`, `AGENTS.md`, and `DECISIONS.md`.
- [x] Integrated cloud/hosted model calls in desktop mode using saved Settings API keys and Electron safeStorage.
- [ ] Optional automatic cloud sync backend.

## Notes

- Milestone decisions live in `DECISIONS.md`; the human's rulings in `HITL.md`; cross-agent rules in `AGENTS.md` (Claude loads it via `CLAUDE.md`). Design problems route to Fable 5 (`claude-fable-5`) first.

- This version is static and hostable on any web server.
- Ideas are saved in each browser's local storage.
- Quick thoughts are saved as Inbox items and can be edited into fuller ideas.
- Cross-device access is supported by hosting the app and using export/import; automatic live sync needs a backend such as Supabase, Firebase, or a small API.

- Mobile web is currently a companion notebook, not the full AI surface. Local AI detection requires the Electron preload bridge (`window.barsAI`) and will not work in regular mobile browsers.
- Settings stores hosted-provider API keys with Electron safeStorage in desktop mode and uses configured keys for hosted AI requests. Browser mode keeps a localStorage fallback but does not make hosted calls.
- Cloud model integration is deliberately small: configured cloud providers show in the AI picker, OpenRouter pulls its live model catalog, model names remain editable/free-form, and provider calls run in Electron main.
