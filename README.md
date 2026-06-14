# BARS™

A responsive, local-first idea notebook designed for capturing thoughts ("bars") before they fade. Styled with a late-night studio readout aesthetic (warm near-black, gold accents, and a film-grain overlay).

## Product scope

- **Desktop app**: Full experience, including local AI through LM Studio/Ollama detection in Electron.
- **Mobile web**: Responsive companion notebook for capture, review, edit, import/export, and Settings. Mobile does not detect local desktop AI.
- **Settings**: Stores common hosted-provider API keys locally. Stored keys are not exported with bars and are not yet wired into hosted API calls.
- **Next planned work**: Integrate cloud/hosted models using the saved Settings keys, without turning the app into a complex provider platform.
- **Sync**: Manual import/export today; automatic cloud sync is future work.

## Features

- **Quick Capture Hero**: Auto-growing input with `⌘+Enter` shortcut to catch lines instantly into the Inbox.
- **Heat Scoring**: Ideas are ranked by "Heat" based on impact/effort metrics.
- **Collapsible Form**: Turn quick thoughts into fully detailed ideas when you're ready to write them up properly.
- **Studio Readout Stats**: Track total bars, inbox queue, active builds, and daily capture streaks.
- **Zero Dependencies**: Lightweight, responsive, and completely hostable as a static site.

## License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
