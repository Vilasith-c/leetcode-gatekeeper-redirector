# Project Phases & Migration Roadmap — Mad Coder Pro

This document outlines the sequential phases of the Plasmo + TypeScript migration. Each phase defines the primary goal, files touched, explicit "Done When" criteria, and current status.

---

## Phase Overview Table

| Phase | Description | Key Modules Touched | Status |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Scaffold Plasmo Project & Tooling | `package.json`, `tsconfig.json`, `tailwind.config.js`, `vitest.config.ts`, `.eslintrc.json`, `.prettierrc` | **Done** |
| **Phase 2** | Zod Schemas & TypeScript Types | `src/schemas/storage.ts`, `src/schemas/messages.ts`, `src/schemas/problem.ts` | **Done** |
| **Phase 3** | Storage Layer (`@plasmohq/storage`) | `src/storage/index.ts` | **Done** |
| **Phase 4** | Messaging Layer (`@plasmohq/messaging`) | `src/background/messages/*.ts` (11 handler files) | **Done** |
| **Phase 5** | Background Worker & DNR Gatekeeper | `src/background/index.ts`, `src/services/dnr.ts`, `src/services/scheduler.ts` | **Done** |
| **Phase 6** | Content Script LeetCode Observer | `src/contents/leetcode.ts` | **Done** |
| **Phase 7** | PDF Study Plan Parser (`pdfjs-dist`) | `src/services/pdfParser.ts` | **Done** |
| **Phase 8** | Action Popup UI (React + Tailwind) | `src/popup/index.tsx`, `src/style.css` | **Done** |
| **Phase 9** | Standalone Block Page UI (React + Tailwind) | `src/tabs/block.tsx` | **Done** |
| **Phase 10**| Vitest Unit Test Suite | `src/tests/dnr.test.ts`, `src/tests/freedom.test.ts`, `src/tests/scheduler.test.ts`, `src/tests/pdfParser.test.ts` | **Done** |
| **Phase 11**| Final Build Verification & End-to-End QA | `npx plasmo build`, `npx vitest run`, `npx tsc --noEmit` | **Done** |

---

## Detailed Phase Breakdown

### Phase 1: Scaffold Plasmo Project & Tooling
- **Goal**: Initialize Plasmo TypeScript configuration, install npm dependencies, and configure Tailwind CSS, Vitest, ESLint, and Prettier.
- **Files Touched**: `package.json`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `vitest.config.ts`, `.eslintrc.json`, `.prettierrc`.
- **Done When**: `npm install` completes and Plasmo project structure resolves without configuration errors.

### Phase 2: Zod Schemas & Derived TypeScript Types
- **Goal**: Define declarative Zod schemas for storage, message payloads, and problem goals. Derive TypeScript types.
- **Files Touched**: `src/schemas/storage.ts`, `src/schemas/messages.ts`, `src/schemas/problem.ts`.
- **Done When**: Schemas validate sample payloads and export TypeScript types without type errors.

### Phase 3: Storage Layer Rebuild
- **Goal**: Rebuild storage access using `@plasmohq/storage` with Zod boundary parse validation.
- **Files Touched**: `src/storage/index.ts`.
- **Done When**: `getSessionState()`, `setSessionState()`, `getLocalState()`, `setLocalState()` safely recover from malformed state.

### Phase 4: Messaging Layer Rebuild
- **Goal**: Implement typed Plasmo message handlers for all 11 message types.
- **Files Touched**: `src/background/messages/*.ts`.
- **Done When**: Every message type has a dedicated handler executing state modifications and returning typed responses.

### Phase 5: Background Worker & Dynamic DNR Logic
- **Goal**: Implement service worker entrypoint, alarm handlers (`FREEDOM_CHECK`, `DAILY_RESET`, `STREAK_GUARD`), and navigation blocker.
- **Files Touched**: `src/background/index.ts`, `src/services/dnr.ts`, `src/services/scheduler.ts`.
- **Done When**: Navigation to non-whitelisted sites redirects to `tabs/block.html` during active sessions without freedom.

### Phase 6: Content Script Observer
- **Goal**: Port LeetCode `MutationObserver` script to Plasmo content script sending typed messages.
- **Files Touched**: `src/contents/leetcode.ts`.
- **Done When**: Submission result DOM changes trigger `PROBLEM_SOLVED` messages automatically.

### Phase 7: PDF Study Plan Parser
- **Goal**: Port 4-pass detection engine to `pdfjs-dist` and validate against `ProblemGoalSchema`.
- **Files Touched**: `src/services/pdfParser.ts`.
- **Done When**: Sample study plan text extracts problem goals and fuzzy matches problem titles.

### Phase 8: Action Popup React UI
- **Goal**: Build tabbed React Popup UI with Tailwind CSS and Framer Motion micro-animations.
- **Files Touched**: `src/popup/index.tsx`, `src/style.css`.
- **Done When**: All 4 tabs (Dashboard, Goals, Whitelist, Stats) display dynamic state and execute actions cleanly.

### Phase 9: Standalone Block Page UI
- **Goal**: Build 3-zone Block Page UI with Tailwind CSS, Framer Motion, and `canvas-confetti`.
- **Files Touched**: `src/tabs/block.tsx`.
- **Done When**: Block page displays assigned problem preview, hint drawer, override tokens, and particle celebrations.

### Phase 10: Vitest Unit Test Suite
- **Goal**: Write and execute Vitest unit test suite.
- **Files Touched**: `src/tests/dnr.test.ts`, `src/tests/freedom.test.ts`, `src/tests/scheduler.test.ts`, `src/tests/pdfParser.test.ts`.
- **Done When**: All 15 unit tests pass cleanly (`npx vitest run`).

### Phase 11: Final Build Verification & QA
- **Goal**: Run production build (`npx plasmo build`) and verify unpacked extension bundle.
- **Files Touched**: `.plasmo/`, `build/`.
- **Done When**: `npx plasmo build` succeeds with zero errors.
