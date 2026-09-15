# Screenshot assets for README

Use **synthetic demo data only** — never real or private inbox links.

## Planned demo inbox (8–12 example links)

Example topics (fake URLs / public docs only):

- Three.js documentation
- WebGPU article
- Browser extension documentation
- Blender / 3D research
- Design inspiration
- Agent architecture notes

Populate via paste or a small hand-crafted JSON import in a fresh extension profile.

## Files to capture

| File | What to show |
|------|----------------|
| `hero-inbox-demo.png` | Wide hero — inbox overview with demo data |
| `01-capture-popup.png` | Page with highlighted text + Z popup (Save to Inbox) |
| `02-inbox-overview.png` | Full inbox: sidebar projects/tags, link cards |
| `03-search-selected-text.png` | Search query matching saved selected text |

Optional later:

- `backup-restore-menu.png` — Backup & Restore dropdown with Last exported
- `import-merge-dialog.png` — Import backup merge choice

## Capture environment

- Standalone extension from `dist/extension/` (not DEV localhost build)
- Dark theme as shipped
- Crop consistently; prefer 16:9 or browser-native aspect for hero
