# System Architecture — Mad Coder Pro

## 1. Five-Phase Execution Flow (Plasmo MV3 Entrypoints)

```
Phase 1: Background Service Worker Startup & Alarm Registration
  Entrypoint: src/background/index.ts
  Actions:
    - Listens to chrome.runtime.onInstalled.
    - Registers alarms: FREEDOM_CHECK (30s), DAILY_RESET (Midnight), STREAK_GUARD (Hourly).
    - Seeds default domain whitelist in @plasmohq/storage local if uninitialized.

Phase 2: Session Activation & Dynamic DNR Rule Rebuild
  Trigger: User clicks "Start Session" in Popup (src/popup/index.tsx)
  Messaging: Sends START_SESSION message via @plasmohq/messaging
  Handler: src/background/messages/START_SESSION.ts
  Actions:
    - Sets storage session state: sessionActive = true.
    - Selects next problem (PDF goals queue or random fallback bank via src/services/problemAssigner.ts).
    - Rebuilds DeclarativeNetRequest dynamic rules (ALLOW Priority 2, BLOCK Priority 1 via src/services/dnr.ts).

Phase 3: Navigation Interception & Gatekeeping
  Trigger: Navigation event detected by webNavigation.onBeforeNavigate in src/background/index.ts
  Actions:
    - Verifies frameId === 0 and non-extension URL.
    - Evaluates: isSessionActive && !isWhitelisted && freedomExpiresAt <= Date.now().
    - Redirects tab to Plasmo standalone tab: chrome-extension://[id]/tabs/block.html?problem=...

Phase 4: LeetCode Verification & Freedom Award
  Entrypoint: src/contents/leetcode.ts ( Plasmo Content Script )
  Actions:
    - Attaches MutationObserver watching React SPA root for submission result selectors.
    - On "Accepted" text detection: sends PROBLEM_SOLVED message via @plasmohq/messaging.
  Handler: src/background/messages/PROBLEM_SOLVED.ts
  Actions:
    - Validates problem slug.
    - Calculates freedom duration (Easy=15m, Medium=25m, Hard=40m).
    - Calculates XP, level progression, and streak continuity (src/services/scheduler.ts).
    - Sets session freedomExpiresAt timestamp.
    - Fires chrome.notifications and pre-assigns next problem.

Phase 5: Freedom Expiry & Alarm Lifecycle
  Trigger: FREEDOM_CHECK alarm fires every 30s in src/background/index.ts
  Actions:
    - Updates extension toolbar badge ("🔒" red vs "14m" green).
    - When freedomExpiresAt is reached: clears freedom, pushes notification, navigation blocker reactivates automatically.
```

---

## 2. Project Layout Directory Tree

```
Mad_Coder/
├── package.json                        ← Manifest overrides, scripts & npm dependencies
├── tsconfig.json                       ← Strict TypeScript configuration & path aliases (~/*)
├── tailwind.config.js                  ← Custom dark mode theme, colors & typography
├── postcss.config.js                   ← PostCSS setup for Tailwind CSS
├── vitest.config.ts                    ← Vitest unit test runner config
├── .eslintrc.json                      ← ESLint typescript configuration
├── .prettierrc                         ← Code formatting rules
├── MIGRATION_NOTES.md                  ← Plasmo architecture tradeoffs & notes
│
├── assets/                             ← Extension icons & raw assets
│   ├── icon.png                        ← 512x512 main icon
│   ├── icon128.png                     ← Toolbar & store icon
│   ├── icon48.png
│   ├── icon16.png
│   └── data/
│       ├── problems.json               ← Offline fallback problem bank (~150+ problems)
│       └── dnr_rules.json              ← Declarative Net Request rules template
│
└── src/
    ├── style.css                       ← Tailwind directives & custom dark scrollbars
    │
    ├── schemas/                        ← Zod schemas & derived TypeScript types
    │   ├── storage.ts                  ← SessionState & LocalState Zod schemas
    │   ├── messages.ts                 ← All 9 message payload Zod schemas
    │   └── problem.ts                  ← ProblemGoal & PDF parser Zod schemas
    │
    ├── storage/                        ← Plasmo storage instances
    │   └── index.ts                    ← Storage({ area: "local" }) & Storage({ area: "session" })
    │
    ├── background/                     ← Service worker entrypoint & message handlers
    │   ├── index.ts                    ← Service worker: alarms, webNavigation listener, DNR setup
    │   └── messages/                   ← Typed @plasmohq/messaging handlers
    │       ├── START_SESSION.ts
    │       ├── END_SESSION.ts
    │       ├── PROBLEM_SOLVED.ts
    │       ├── WRONG_PROBLEM.ts
    │       ├── SKIP_PROBLEM.ts
    │       ├── USE_OVERRIDE.ts
    │       ├── USE_FREEZE.ts
    │       ├── GET_STATE.ts
    │       ├── UPDATE_WHITELIST.ts
    │       ├── SET_GOAL_MODE.ts
    │       └── CLEAR_GOAL_MODE.ts
    │
    ├── contents/                       ← Plasmo Content Scripts
    │   └── leetcode.ts                 ← Injected into leetcode.com/problems/* (MutationObserver)
    │
    ├── popup/                          ← Action Popup React View
    │   └── index.tsx                   ← Dashboard, Goals PDF Uploader, Whitelist, Stats tabs
    │
    ├── tabs/                           ← Plasmo Standalone Extension Pages
    │   └── block.tsx                   ← Interactive Block Page React Component (tabs/block.html)
    │
    ├── services/                       ← Pure Business Logic Modules
    │   ├── dnr.ts                      ← Dynamic DNR rule builder
    │   ├── scheduler.ts                ← XP, level, streak, and daily reset math
    │   ├── problemAssigner.ts          ← Sequential PDF goal & random problem selector
    │   ├── pdfParser.ts                ← 4-Pass PDF text extraction & fuzzy title matcher
    │   └── analytics.ts                ← Analytics logger with 90-day retention
    │
    └── tests/                          ← Vitest Test Suite
        ├── dnr.test.ts
        ├── freedom.test.ts
        ├── scheduler.test.ts
        └── pdfParser.test.ts
```

---

## 3. Technology Stack Layering Table

| Layer | Technology | Reason |
| :--- | :--- | :--- |
| **Framework** | Plasmo (`plasmo`) | MV3-native framework with automatic manifest generation, HMR, and React routing |
| **Language** | TypeScript (Strict) | Enforces strict type safety across background, popup, content scripts, and services |
| **UI Components** | React 18 | Declarative component structure for Popup Dashboard and Standalone Block tab |
| **Styling** | Tailwind CSS | Utility-first CSS configured with custom dark theme tokens and typography |
| **Animation** | Framer Motion | Fluid micro-animations for XP fills, level up alerts, and streak flame pulses |
| **Celebration** | `canvas-confetti` | High-performance particle bursts on problem solve and freedom unlock events |
| **State Sync** | `@plasmohq/storage` | Reactive hook-based storage layer eliminating local/session desync bugs |
| **Messaging** | `@plasmohq/messaging` | Type-safe message request/response protocol replacing stringly-typed switches |
| **Validation** | Zod | Runtime validation for storage schemas, message payloads, and parsed PDF goals |
| **PDF Parsing** | `pdfjs-dist` (npm) | Standard npm PDF.js parser replacing legacy vendored static binaries |
| **Testing** | Vitest | Fast unit testing for DNR rule building, freedom boundaries, XP math, and fuzzy parsing |
| **Tooling** | ESLint + Prettier + Husky | Code quality enforcement via pre-commit linting and typecheck hooks |

---

## 4. Architecture Data Flow Diagram

```
 ┌────────────────────────┐                    ┌────────────────────────┐
 │   Popup UI Component   │                    │  Block Tab Component   │
 │   (src/popup/index.tsx)│                    │  (src/tabs/block.tsx)  │
 └───────────┬────────────┘                    └───────────┬────────────┘
             │                                             │
             │ @plasmohq/messaging                         │ @plasmohq/messaging
             │ sendToBackground()                          │ sendToBackground()
             ▼                                             ▼
 ┌──────────────────────────────────────────────────────────────────────┐
 │                    Plasmo Background Worker Engine                    │
 │                       (src/background/index.ts)                      │
 │                                                                      │
 │   Message Handlers (src/background/messages/*.ts)                    │
 │   ├── START_SESSION      ├── END_SESSION      ├── PROBLEM_SOLVED     │
 │   ├── SKIP_PROBLEM       ├── USE_OVERRIDE     ├── USE_FREEZE         │
 │   └── UPDATE_WHITELIST   └── SET_GOAL_MODE    └── CLEAR_GOAL_MODE    │
 └───────────┬──────────────────────────┬───────────────────────────────┘
             │                          │
             │ Storage Read/Write       │ WebNavigation Interception
             ▼                          ▼
 ┌──────────────────────┐   ┌───────────────────────────────────────────┐
 │  @plasmohq/storage   │   │ chrome.webNavigation.onBeforeNavigate     │
 │  ┌─────────────────┐ │   │ Redirects to:                             │
 │  │ storage.local   │ │   │ chrome-extension://[id]/tabs/block.html   │
 │  ├─────────────────┤ │   └───────────────────────────────────────────┘
 │  │ storage.session │ │
 │  └─────────────────┘ │
 └──────────────────────┘
             ▲
             │ sendToBackground()
 ┌───────────┴────────────┐
 │ LeetCode Content Script│  MutationObserver watches DOM for "Accepted"
 │(src/contents/leetcode) │  matches on https://leetcode.com/problems/*
 └────────────────────────┘
```

---

## 5. State Ownership & Storage Partitioning

| State Key | Storage Partition | Module Owner | Description |
| :--- | :--- | :--- | :--- |
| `sessionActive` | `storage.session` | `src/storage/index.ts` | `boolean`: Whether a coding session is active |
| `currentProblemSlug` | `storage.session` | `src/storage/index.ts` | `string`: Currently assigned problem slug |
| `currentProblemTitle` | `storage.session` | `src/storage/index.ts` | `string`: Title of assigned problem |
| `currentProblemDifficulty`| `storage.session` | `src/storage/index.ts` | `"Easy" \| "Medium" \| "Hard"` |
| `freedomExpiresAt` | `storage.session` | `src/storage/index.ts` | `number`: Timestamp ms when freedom expires |
| `solvedThisSession` | `storage.session` | `src/storage/index.ts` | `number`: Problems solved in active session |
| `blockCountThisSession` | `storage.session` | `src/storage/index.ts` | `number`: Navigation attempts blocked |
| `streak` | `storage.local` | `src/storage/index.ts` | `{ current, longest, lastSolveDate, freezeTokens }` |
| `xp` | `storage.local` | `src/storage/index.ts` | `{ total, level, levelName, levelThresholds }` |
| `whitelist` | `storage.local` | `src/storage/index.ts` | `Array<{ id, domain, addedAt, label }>` |
| `pdfGoals` | `storage.local` | `src/storage/index.ts` | `Array<ProblemGoal>` parsed from PDF |
| `useGoalMode` | `storage.local` | `src/storage/index.ts` | `boolean`: Whether to assign PDF goals vs random |
| `overrides` | `storage.local` | `src/storage/index.ts` | `{ usedThisWeek, weekResetDate, totalAllTime }` |
| `history` | `storage.local` | `src/storage/index.ts` | Daily solve/block/freeze log dictionary |
