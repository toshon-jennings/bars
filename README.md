# BARS™

A responsive, local-first idea notebook designed for capturing thoughts ("bars") before they fade. Styled with a late-night studio readout aesthetic (warm near-black, gold accents, and a film-grain overlay).

## Product scope

- **Desktop app**: Full experience, including local AI through LM Studio, Jan, and Ollama detection and cloud AI through saved provider keys in Electron.
- **Mobile web**: Responsive companion notebook for capture, review, edit, import/export, and Settings. Mobile does not detect local desktop AI or run hosted calls.
- **Settings**: Stores common hosted-provider API keys with Electron safeStorage in desktop mode. Stored keys are not exported with bars.
- **Cloud AI**: Configured cloud providers appear in Ask your bars. OpenRouter pulls its live model catalog, and model names stay editable so users can paste any valid model ID.
- **Sync**: Manual import/export today; automatic cloud sync is future work.

## Features

- **Quick Capture Hero**: Auto-growing input with `⌘+Enter` shortcut to catch lines instantly into the Inbox.
- **Heat Scoring**: Ideas are ranked by "Heat" based on impact/effort metrics.
- **Collapsible Form**: Turn quick thoughts into fully detailed ideas when you're ready to write them up properly.
- **Studio Readout Stats**: Track total bars, inbox queue, active builds, and daily capture streaks.
- **Zero Dependencies**: Lightweight, responsive, and completely hostable as a static site. Desktop AI uses Electron's built-in APIs rather than extra packages.

## License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
