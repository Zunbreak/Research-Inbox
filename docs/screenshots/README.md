# Screenshot assets for README

Use **synthetic demo data only**. Never real or private inbox links.

## Planned demo inbox (8–12 example links)

Example topics (fake URLs / public docs only):

- Three.js documentation
- WebGPU article
- Browser extension documentation
- Blender / 3D research
- Design inspiration
- Agent architecture notes

Populate via paste or a small hand-crafted JSON import in a fresh extension profile.

## Demo data

Import `demo-inbox-backup.json` (10 synthetic links, 7 projects).  
**Never** use real/private inbox data in screenshots.

Suggested search phrase for shot 03: `local-first software keeps data on the device`

## Files to capture

| File | Composition |
|------|-------------|
| `hero-inbox-demo.png` | Wide crop of full inbox: header, sidebar with project counts, 3–4 link cards visible, dark theme. Demo data loaded. No popup. |
| `01-capture-popup.png` | Real browser page (e.g. MDN or Three.js) with **highlighted text** visible; Z popup open showing page preview, project/tags fields, Save to Inbox. Inbox tab not required in frame. |
| `02-inbox-overview.png` | Full inbox at ~1440px width: sidebar (Web Graphics, Browser Tools, 3D Workflow…), varied cards showing tags, whySaved, selected text blocks. Filter area visible. |
| `03-search-selected-text.png` | Same inbox with search box filled (`local-first software keeps data on the device`); demo-006 card highlighted/visible in results; result count shown. |

Optional later:

- `backup-restore-menu.png`: Backup & Restore dropdown with Last exported
- `import-merge-dialog.png`: Import backup merge choice

## Capture environment

- Standalone extension from `dist/extension/` (not DEV localhost build)
- Dark theme as shipped
- Crop consistently; prefer 16:9 or browser-native aspect for hero
