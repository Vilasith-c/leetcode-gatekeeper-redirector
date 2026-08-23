# Mad Coder Pro — Plasmo + TypeScript Migration Notes

## Architectural Modernization Overview

The original vanilla JavaScript Manifest V3 codebase was ported to a robust, typed, component-driven **Plasmo + TypeScript** stack.

### Key Architectural Improvements

1. **Storage Synchronization (@plasmohq/storage + Zod)**:
   - Eliminated storage desync bugs between `chrome.storage.local` and `chrome.storage.session`.
   - All storage access passes through `@plasmohq/storage` with Zod boundary validation. Any invalid or corrupt state automatically recovers using typed fallback defaults (`DEFAULT_LOCAL_STATE`, `DEFAULT_SESSION_STATE`).

2. **Typed Messaging Architecture (@plasmohq/messaging)**:
   - Removed raw string `message.type` switch blocks.
   - Every message type has an individual strongly-typed handler file inside `src/background/messages/*.ts` (`START_SESSION.ts`, `PROBLEM_SOLVED.ts`, `USE_OVERRIDE.ts`, etc.).

3. **React + Tailwind CSS Component UI**:
   - **Popup Dashboard (`src/popup/index.tsx`)**: 4-tab interface featuring Framer Motion XP progress fills, level badge indicator, streak flame pulse, whitelist manager, and PDF parser upload.
   - **Block Page (`src/tabs/block.tsx`)**: Rebuilt as a standalone Plasmo extension tab page (`chrome-extension://[id]/tabs/block.html`), featuring Zone 1 top bar, Zone 2 problem preview with Zeigarnik effect blur overlay, animated hint drawer, Zone 3 emergency overrides, and `canvas-confetti` celebrations.

4. **PDF.js npm Integration (`pdfjs-dist`)**:
   - Replaced vendored static binaries (`libs/pdf.min.js`) with npm package `pdfjs-dist`.
   - 4-pass detection engine outputs typed `ProblemGoal` objects validated by Zod schema.

5. **Vitest Unit Test Suite**:
   - Unit tests created for DNR rule priority, freedom window boundaries, XP/streak math, and fuzzy PDF title matching.

---

## Plasmo-Specific Tradeoffs & Equivalents

- **Block Page Route**: In Plasmo, standalone extension HTML pages are created under `src/tabs/block.tsx`, producing the extension page `tabs/block.html`. The background service worker `chrome.webNavigation` blocker redirects non-whitelisted navigation to `chrome.runtime.getURL("tabs/block.html?...")`.
- **Background Entrypoint**: Service worker logic resides in `src/background/index.ts` alongside `@plasmohq/messaging` handlers in `src/background/messages/`.
