# HITL — Human-in-the-Loop Ledger

Rulings made by Toshon. Where `DECISIONS.md` records what agents decided, this records what the human decided — the judgment calls agents don't own. Append-only, newest first.

**Agents:** before asking the human a question, check whether it's already ruled on here. Before making a call in the "Bring the human in" list, stop and ask — then append the ruling.

## Bring the human in for

- Changes to the design direction or its register (extending it is fine; redirecting it is not)
- Data schema changes or anything that could lose stored bars
- Adding any dependency, build step, or external service (current ruling: zero)
- Deleting or overwriting work the agent didn't create
- Publishing anything externally (deploys, third-party services)

## Rulings

### 2026-06-11 — Milestones must be captured in repo files

Continuity across agents matters to Toshon. Milestone moments get recorded in `DECISIONS.md` / this file — not left in chat history. If something feels like a leap, write it down.

### 2026-06-11 — No silent actions

Export originally gave no feedback and read as broken. Ruling: every user action gets visible confirmation (e.g., the "Exported N bars ✓" flash). Applies to all future UI.

### 2026-06-11 — Design work routes to Fable 5, the model — not the harness

When routing design problems, name `claude-fable-5` specifically. "Claude Code" is where it runs; Fable 5 is who holds the taste.

### 2026-06-11 — The app speaks "bars"

Ideas are bars, in the hip-hop sense. The Rhyme Book aesthetic (see `DECISIONS.md`) was approved enthusiastically. The register is subtle — carried by color, type, motion, vocabulary — never literal or costume-y. This is settled; don't reopen it.
