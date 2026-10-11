#!/usr/bin/env python3
"""Render source for build/background.png — the Bars DMG install-window artwork.

Window geometry (electron-builder dmg block): 540x380, app icon at (140, 225),
/Applications link at (400, 225), icon size 100. The PNG must match the window
exactly or Finder pads the edge with white.

Composition follows the Rhyme Book language (see DECISIONS.md 2026-06-11):
near-black field with a gold glow, a cream paper shelf behind the icons
("on the page"), and a paper-ink block-cursor trail stepping right toward
/Applications — the BARS masthead cursor as the install gesture.

Regenerate with:  python3 script/make_dmg_background.py
Requires cairosvg (same dependency as script/make_icon.sh).
"""

import cairosvg

W, H = 540, 380

BG = "#131009"
GOLD = "#f0b53d"
HOT = "#ff6a3d"
INK = "#f3ead8"
MUTED = "#a4977c"
PAPER_INK = "#221d15"
SHELF = "#c4b286"

SVG = f"""<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
  <defs>
    <radialGradient id="glow" cx="421" cy="-10" r="300" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="{GOLD}" stop-opacity="0.17"/>
      <stop offset="0.62" stop-color="{GOLD}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="ember" cx="20" cy="400" r="220" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="{HOT}" stop-opacity="0.10"/>
      <stop offset="0.62" stop-color="{HOT}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="shelfFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{SHELF}" stop-opacity="0"/>
      <stop offset="0.12" stop-color="{SHELF}" stop-opacity="1"/>
      <stop offset="0.93" stop-color="{SHELF}" stop-opacity="1"/>
      <stop offset="1" stop-color="{SHELF}" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="{W}" height="{H}" fill="{BG}"/>
  <rect width="{W}" height="{H}" fill="url(#glow)"/>
  <rect width="{W}" height="{H}" fill="url(#ember)"/>

  <text x="250" y="104" text-anchor="middle" textLength="150" lengthAdjust="spacingAndGlyphs"
        font-family="Arial Narrow, sans-serif" font-weight="bold" font-size="72"
        letter-spacing="2" fill="{INK}">BARS</text>
  <rect x="348" y="58" width="22" height="46" fill="{GOLD}"/>
  <text x="270" y="130" text-anchor="middle"
        font-family="Menlo, monospace" font-size="11" letter-spacing="3" fill="{MUTED}">CATCH EVERY LINE BEFORE IT FADES</text>

  <rect x="36" y="150" width="468" height="160" rx="26" fill="url(#shelfFade)"/>
  <line x1="64" y1="190" x2="476" y2="190" stroke="{PAPER_INK}" stroke-opacity="0.10"/>
  <line x1="64" y1="260" x2="476" y2="260" stroke="{PAPER_INK}" stroke-opacity="0.10"/>

  <rect x="232" y="203" width="22" height="44" fill="{PAPER_INK}"/>
  <rect x="264" y="203" width="22" height="44" fill="{PAPER_INK}" fill-opacity="0.5"/>
  <rect x="292" y="203" width="22" height="44" fill="{PAPER_INK}" fill-opacity="0.28"/>
  <rect x="316" y="203" width="22" height="44" fill="{PAPER_INK}" fill-opacity="0.14"/>

  <g fill-opacity="0.9">
    <rect x="243" y="336" width="54" height="6" rx="3" fill="{GOLD}"/>
    <rect x="243" y="345" width="40" height="6" rx="3" fill="{GOLD}"/>
    <rect x="243" y="354" width="48" height="6" rx="3" fill="{HOT}"/>
  </g>
</svg>
"""


def main():
    with open("build/background.svg", "w") as handle:
        handle.write(SVG)
    cairosvg.svg2png(
        bytestring=SVG.encode("utf-8"),
        write_to="build/background.png",
        output_width=W,
        output_height=H,
    )
    print(f"wrote build/background.svg + build/background.png ({W}x{H})")


if __name__ == "__main__":
    main()
