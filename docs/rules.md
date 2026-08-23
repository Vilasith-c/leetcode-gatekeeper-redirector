# Development Rules & Coding Standards — Mad Coder Pro

## 1. Approved Technology Stack (Pinned Dependencies)

Development must adhere strictly to the approved stack. Do not substitute or add alternative packages without explicit user approval.

- **Framework**: Plasmo (`plasmo`)
- **Language**: TypeScript (Strict Mode enabled)
- **UI Framework**: React 18
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion (`framer-motion`)
- **Celebrations**: `canvas-confetti`
- **State & Storage**: `@plasmohq/storage` + Zustand
- **Messaging**: `@plasmohq/messaging`
- **Validation**: Zod (`zod`)
- **PDF Parser**: `pdfjs-dist` (via npm)
- **Testing**: Vitest (`vitest`)
- **Quality Tooling**: ESLint + Prettier + Husky
- **AI Agent Anti-Slop Filter**: `anti-slop` (via `.agents/skills/antislop`)

---

## 2. Forbidden Patterns & Anti-Patterns

- ❌ **No Direct `chrome.storage.*` Calls in React Components**:
  - Components must use `@plasmohq/storage/hook` (`useStorage`) or Zustand stores backed by `@plasmohq/storage`. Direct calls to `chrome.storage.local.get` or `chrome.storage.session.set` in UI components are banned.
- ❌ **No Raw String Message Switches**:
  - Do not use raw `chrome.runtime.onMessage.addListener((msg) => switch(msg.type))` patterns. Every message must be implemented as a typed Plasmo handler inside `src/background/messages/<MESSAGE_NAME>.ts`.
- ❌ **No Explicit or Implicit `any` Types**:
  - `any` is prohibited. Derive types from Zod schemas using `z.infer<typeof Schema>` or define explicit TypeScript interfaces.
- ❌ **No Unvalidated Storage or Message Boundaries**:
  - Every payload read from storage or received in a message handler must be validated against its corresponding Zod schema before processing.
- ❌ **No CDN or Vendored Third-Party Scripts**:
  - All libraries (including `pdfjs-dist` and `canvas-confetti`) must be installed via npm and bundled by Plasmo.

---

## 3. Error Handling Standards

1. **Async Chrome API Guarding**:
   - Wrap all Chrome API calls (`chrome.tabs.update`, `chrome.declarativeNetRequest`, `chrome.notifications.create`) in try/catch blocks or safely check `typeof chrome !== "undefined"`.
2. **Schema Parse Graceful Fallbacks**:
   - If a storage payload fails Zod parsing (e.g. corrupted payload), log a warning and return the verified default state object (`DEFAULT_LOCAL_STATE` or `DEFAULT_SESSION_STATE`) rather than throwing an uncaught runtime error.
3. **Typed Message Error Paths**:
   - Message handlers must return structured response objects containing `{ success: boolean, reason?: string, data?: any }`. Never fail silently without returning a response.

---

## 4. AI Agent Boundaries & Constraints

The AI coding agent must strictly obey the following guardrails:

- 🛑 **Do NOT Alter the Freedom Duration Formula**:
  - Easy = 15 minutes, Medium = 25 minutes, Hard = 40 minutes. Do not change these durations without explicit user confirmation.
- 🛑 **Do NOT Alter XP & Streak Calculation Rules**:
  - Easy (+10 XP), Medium (+20 XP), Hard (+35 XP), Early Bird (+5 XP), Streak bonuses (7+ days: +5 XP, 30+ days: +10 XP), Override penalty (-5 XP).
- 🛑 **Do NOT Add New npm Dependencies**:
  - Only use dependencies specified in `package.json`. If a new dependency is required, flag it and ask for user approval first.
- 🛑 **Do NOT Remove Message Types**:
  - All 9 message types in `docs/architecture.md` must remain implemented.
- 🛑 **Do NOT Rewrite `docs/memory.md` History**:
  - Only append new entries or update current status in `docs/memory.md`. Never delete previous decision logs.

---

## 5. Code Style & File Conventions

- **File Naming**:
  - Components: `PascalCase.tsx` or `index.tsx`
  - Modules & Services: `camelCase.ts`
  - Message Handlers: `UPPERCASE_MESSAGE_NAME.ts` (matching `@plasmohq/messaging` convention)
  - Test Files: `<module>.test.ts`
- **One Schema Per File / Layer**:
  - Schemas reside strictly under `src/schemas/`.
- **Prettier Formatting**:
  - 100 character print width, 2 spaces indentation, double quotes, trailing commas set to `none`.

---

## 6. Anti-Slop AI Quality Standard & Delivery Gate (`miqdadbadjuber/anti-slop`)

All UI, copy, and code development must pass the **Anti-Slop AI Quality Gate** (`.agents/skills/antislop`):

1. **Hard Gate Rules (R-01 to R-38)**:
   - **R-02**: No em dashes (`—`) in UI copy or documentation text.
   - **R-03**: Perfect mobile responsiveness (no overflow, min 44px tap targets).
   - **R-17 & R-18**: No fake statistics, fake numbers, or fake AI testimonials.
   - **R-25**: Strictly enforce WCAG AA contrast ratio (min 4.5:1 normal text, 3:1 large text).
   - **R-26**: Every button, link, and interactive element must be functional or explicitly labeled as a working placeholder. No dead controls.
   - **R-27**: Complete UI state handling (Empty, Loading, Error, Data).
   - **R-32**: Full keyboard navigation accessibility (`Tab`, `Enter`, `Space`, `Escape`) with visible focus outlines.
   - **R-36**: No fabricated compliance or performance claims.
2. **Craftsmanship Standards (C-1 to C-5)**:
   - **C-1 Intentionality**: Every visual and copy choice must have a clear, articulable reason.
   - **C-2 Functional Completeness**: Every interactive component works 100%.
   - **C-3 Content-Driven Composition**: Layouts adapt to actual product content, never filling stock AI templates.
   - **C-4 Resilience**: Verified across all themes, states, and screen sizes.
   - **C-5 Evidence Over Claims**: Facts and claims are 100% verifiable.
3. **Delivery Gate Report**:
   - Before shipping any UI or feature update, run the mandatory 4-block PASS/FAIL Delivery Gate audit from `.agents/skills/antislop/SKILL.md`.
