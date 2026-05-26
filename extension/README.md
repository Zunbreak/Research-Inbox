# Zunbreak Research Inbox — Browser Extension

Save the current Brave/Chrome tab to your local inbox with page metadata.

## Install (Brave)

1. Start the app: `npm run dev` in the project root
2. Open Brave → **Menu (≡)** → **Extensions** → **Manage Extensions**
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select this folder: `extension/`

## Use

1. Browse to any page (not `chrome://` or `brave://`)
2. Optionally highlight important text on the page
3. Click the extension icon
4. Add project / tags / why saved (optional)
5. Click **Save to Inbox**
6. Open http://localhost:5173 — link appears (refresh or refocus tab)

## Requirements

- `npm run dev` must be running (inbox API on port 5173)
- App saves to `data/links.json` automatically

## Permissions

- `activeTab` — read the current tab only when you click the extension
- `scripting` — capture meta tags, headings, and highlighted text from the page
- `storage` — remember your last project/tags preferences
- `localhost:5173` — send captures to your local inbox only

Highlight text, then open the popup right away. Selection is read via `activeTab` when you click (including embedded frames on supported pages).

No AI, no external servers, no background tab scraping.
