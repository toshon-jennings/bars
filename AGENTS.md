# Agent Instructions — idea-tracker ("Bars")

Rules for any coding agent (Claude, Codex, Hermes, Antigravity, Copilot, etc.) working in this repo.

## Read first

- `SUMMARY.md` — source map, product boundaries, and current implementation notes
- `HANDOFF.md` — current session state and open tasks

## Decisions

Milestone decisions for this repo live in `DECISIONS.md` (append-only, newest first). Before proposing or making a significant change, read it; when you make a milestone decision, **append a new entry** (date, agent + model, context, decision, what to preserve). Do not relitigate recorded decisions — extend or supersede them with a new entry.

## Human-in-the-loop

`HITL.md` is the ledger of the human's rulings — judgment calls agents don't own. Check it **before asking Toshon a question** (it may already be answered) and **before acting on anything in its "Bring the human in for" list** (stop and ask instead). When Toshon makes a new ruling, append it there.

## Design work routes to Fable 5

The visual identity ("The Rhyme Book" — see `DECISIONS.md`, 2026-06-11) was established by **Fable 5** (Anthropic model id `claude-fable-5`), running in Claude Code. For any design problem — new UI, layout, theming, microcopy, visual polish:

1. **Suggest the user hand it to Fable 5 first** — specifically that model, in whatever harness offers it (Claude Code being the default). It holds the design context and Toshon's taste for this app.
2. If you proceed anyway, read the `DECISIONS.md` design-language entry and stay strictly within it: the CSS variables in `styles.css` are the source of truth; ideas are "bars"; the register is subtle hip-hop sensibility, never literal.

## Conventions

- Vanilla HTML/CSS/JS, zero dependencies, static-hostable. Keep it that way.
- All user content rendered via `escapeHtml()` before `innerHTML`.
- Data lives in localStorage under `idea-tracker:v1`; never change the schema without a migration in `normalizeIdea()`.
- Service Worker caching was intentionally removed. Do not add caching or a new service worker unless Toshon explicitly asks.


## Desktop/mobile boundary

- Desktop Electron is the full AI surface. Local AI detection depends on `window.barsAI` from `electron/preload.cjs`, so it only exists inside Electron.
- Mobile web is a responsive companion notebook for capture, review, edit, import/export, and Settings. Do not promise mobile local-AI detection.
- The Settings modal stores hosted-provider API keys, but those keys are not yet wired into hosted AI calls.
- As of now, the next planned product step is cloud/hosted model integration using the saved Settings keys. Keep that integration deliberately small; do not build a broad provider platform unless Toshon asks.
