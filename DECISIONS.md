# Decision Log

Milestone decisions for this repo. Append-only; newest first. Each entry: context, the decision, and what future work must preserve.

---

## 2026-06-14 — Straighten the "On the page" container & Remove Service Worker Caching

**Agent:** Antigravity (Gemini 3.5 Flash)

**Context:** The user found the slanted cream container in the ON THE PAGE section visually distracting, wanted the ability to edit quick notes (Inbox items) directly, and requested that the app not be reliant on local service worker caching which caused update lock-ins.

**Decision:**
- Removed the `transform: rotate(-0.5deg);` rotation on the `.paper` element in `styles.css` so that the cream notebook page lies flat/horizontal.
- Added an **Edit** button in the detail view for Inbox items that opens the collapsible form, populating all parameters and dynamically updating the header to "Edit details".
- Replaced `sw.js` with a self-destructing tombstone script that deletes all caches and unregisters itself immediately.
- Removed all service worker registration from `app.js` and replaced it with active unregistration code to cleanly purge the caching layer on all domains.

**Preserve:** Keep the layout flat unless the user explicitly requests another rotation motif. Maintain the project as a clean, direct, zero-dependency static site without service worker caching.

---

## 2026-06-11 — "The Rhyme Book" design language

**Agent:** Claude Code (Fable 5)

**Context:** The app was functional but looked like a generic admin template, and quick capture — the heart of the app — was buried in a sidebar. Toshon calls his ideas "bars" (the hip-hop sense). That word was the brief.

**Decision:** Commit fully to a late-night studio session aesthetic — *felt*, not costumed. No graffiti fonts, no clip art; a notebook that knows what it's for.

The design language:

- **Theme:** warm near-black (`#131009`), film-grain overlay, gold accent (`#f0b53d`), hot orange (`#ff6a3d`) for "live" elements
- **Type:** Big Shoulders Display (masthead/headings), Spline Sans (body), Spline Sans Mono (labels/metadata — "studio readout" voice)
- **Motifs:** pulsing REC dot on capture; blinking cursor block in the `BARS▮` masthead; focused idea rendered as a tilted cream paper page ("on the page"); impact/effort as `●●●○○` dots
- **Vocabulary:** ideas are *bars*; the list is *the book*; score is *Heat*; capture button is *Catch it*; empty states and microcopy stay in this voice
- **Hierarchy:** quick capture is the hero, full-width at top with ⌘↵; the full idea form is secondary (collapsible "write one up properly")

**Preserve:** the register. Subtle hip-hop sensibility carried by color, type, motion, and vocabulary — never literal or theme-park. Any new UI must speak this language (CSS variables in `styles.css` are the source of truth). Toshon's reaction: "It's some Wu-Tang shit. I'm genuinely, if not literally, floored." That's the bar. Clear it.
