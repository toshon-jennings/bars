# BARS™

A responsive, local-first idea notebook designed for capturing thoughts ("bars") before they fade. Styled with a late-night studio readout aesthetic (warm near-black, gold accents, and a film-grain overlay).

<img width="1280" height="1235" alt="full_page_screenshot" src="https://github.com/user-attachments/assets/930cc96c-fe22-4428-9a31-12b748c0e5e8" />

## Install

### Web and mobile — start here

Open **<https://toshon-jennings.github.io/bars/>** and install it as an app:

- **Chrome / Edge (desktop)** — click the install icon in the address bar
- **iOS Safari** — Share → Add to Home Screen
- **Android Chrome** — menu → Add to Home screen

Your book is stored in that browser's `localStorage`, so it lives on that device. There is no offline mode — the app shell needs a connection to load.

### macOS desktop — build it yourself

The desktop build is the full AI surface: it detects local models through LM Studio, Jan, and Ollama, and runs hosted providers from your saved Settings keys. The web version can't do either.

There's no prebuilt download yet — the app isn't code-signed, so building it locally is the honest path. Requires macOS:

```bash
npm install
npm run dist
```

Disk images land in `dist/` — `Bars-<version>-arm64.dmg` for Apple Silicon, `-x64` for Intel. Open the one for your Mac and drag Bars into Applications.

Notes:

- If npm blocks Electron's install script, run `npm install-scripts approve electron` and install again.
- Builds are unsigned. That's fine for an app you built yourself, but a disk image you hand to someone else will trip Gatekeeper on their machine; they'd need `xattr -dr com.apple.quarantine /Applications/Bars.app`.
- To regenerate the app icon from `design/icon.svg`, run `npm run icon` (needs `cairosvg`).

## Product scope

- **Desktop app**: Full experience, including local AI through LM Studio, Jan, and Ollama detection and cloud AI through saved provider keys in Electron.
- **Mobile web**: Responsive companion notebook for capture, review, edit, import/export, and Settings. Mobile does not detect local desktop AI or run hosted calls.
- **Settings**: Stores common hosted-provider API keys with Electron safeStorage in desktop mode. Stored keys are not exported with bars.
- **Cloud AI**: Configured cloud providers appear in Ask your bars. OpenRouter pulls its live model catalog, and model names stay editable so users can paste any valid model ID.
- **Sync**: Manual import/export today; automatic cloud sync is future work.

## Features

- **Quick Capture Hero**: Auto-growing input with `⌘+Enter` shortcut to catch lines instantly into the Inbox.
- **IdeaBrowser Import**: Paste an IdeaBrowser link — or a whole "Idea of the Day" email — into quick capture and it writes the card for you: title, core thesis, supporting notes, and follow-up angles. Parsed locally, no network call.
- **Heat Scoring**: Ideas are ranked by "Heat" based on impact/effort metrics.
- **Collapsible Form**: Turn quick thoughts into fully detailed ideas when you're ready to write them up properly.
- **Studio Readout Stats**: Track total bars, inbox queue, active builds, and daily capture streaks.
- **Zero Dependencies**: Lightweight, responsive, and completely hostable as a static site. Desktop AI uses Electron's built-in APIs rather than extra packages.

## License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
