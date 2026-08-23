# Mad Coder Pro

A Manifest V3 Chrome Extension that acts as an intelligent LeetCode gatekeeper. It forces you to solve an assigned LeetCode problem before accessing non-whitelisted websites.

## Features
- **Gatekeeper Engine**: Blocks non-whitelisted sites until you solve your assigned problem.
- **PDF Goal Parser**: Upload a study plan PDF to extract LeetCode problems and match them against an offline database.
- **Whitelist Control**: Fully customizable whitelist using Chrome's Declarative Net Request API.
- **Streak Engine & Analytics**: Tracks your solving streak, awards XP, levels, and detailed analytics.

## Directory Structure
```
Mad_Coder/
├── manifest.json              ← Manifest V3 entry point
├── README_Extension.md
├── mad-coder-pro-prompt.md    ← Specification prompt
├── generate_problems.js       ← Offline problem generator
├── data/
│   ├── problems.json          ← Fallback problem bank (~150+ problems)
│   └── dnr_rules.json         ← Dynamic DNR rules template
├── icons/                     ← Extension icons (16, 48, 128)
├── libs/                      ← Local dependencies (PDF.js libraries)
│   ├── pdf.min.js
│   └── pdf.worker.min.js
└── src/
    ├── background/
    │   └── background.js      ← Service worker ES module
    ├── content/
    │   └── content.js         ← Injected into leetcode.com/problems/*
    ├── popup/
    │   ├── popup.html
    │   ├── popup.css
    │   └── popup.js           ← Tabbed dashboard UI & PDF parser triggers
    ├── block/
    │   ├── block.html         ← Gatekeeper view when blocked
    │   ├── block.css
    │   └── block.js
    ├── parser/
    │   └── pdfParser.js       ← PDF.js parser pipeline
    ├── analytics/
    │   └── analytics.js       ← Analytics logging module
    └── scheduler/
        └── scheduler.js       ← Daily reset & streak alarms
```

## Installation Instructions

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `Mad_Coder` directory.
5. Pin the extension icon to your browser toolbar.
6. Click the extension icon → **Start Session** to begin.

> **Note:** Whenever you edit any source code file in `src/` or `data/`, click the refresh icon on the `Mad Coder Pro` card at `chrome://extensions` to reload changes.

## Development Constraints
- Manifest V3 compliant
- Vanilla JavaScript (ES modules in service worker)
- Uses `chrome.alarms` for background tasks
- 100% offline operations & local storage sync

