# Mad Coder Pro — Complete Workflow & Implementation Architecture

---

## 1. Core Idea & Concept

**Mad Coder Pro** is an intelligent, gamified Manifest V3 Chrome Extension designed to transform website blocking into a disciplined coding habit builder. 

### The Core Loop
```
  ┌─────────────────────────────────────────────────────────┐
  │ 1. User starts a Session                                 │
  └────────────────────────────┬────────────────────────────┘
                               │
                               ▼
  ┌─────────────────────────────────────────────────────────┐
  │ 2. Distracting/Non-Whitelisted Websites are BLOCKED      │
  │    User is redirected to Interactive Block Page           │
  └────────────────────────────┬────────────────────────────┘
                               │
                               ▼
  ┌─────────────────────────────────────────────────────────┐
  │ 3. User solves assigned LeetCode / PDF Study Plan task │
  └────────────────────────────┬────────────────────────────┘
                               │
                               ▼
  ┌─────────────────────────────────────────────────────────┐
  │ 4. Content Script auto-detects "Accepted" submission     │
  └────────────────────────────┬────────────────────────────┘
                               │
                               ▼
  ┌─────────────────────────────────────────────────────────┐
  │ 5. Freedom Window Unlocked (15–40 mins) + XP + Streak   │
  └─────────────────────────────────────────────────────────┘
```

### Key Pillars
1. **Default-Deny Gatekeeper Engine**: Blocks all non-whitelisted web browsing while a coding session is active, unless a valid freedom window is running.
2. **PDF Study Plan Goal Mode**: Parses uploaded study plan PDFs (using an offline, bundled PDF.js pipeline) to auto-extract problem lists, URLs, and difficulty tags without external servers.
3. **Psychology-Driven Block Interface**: Leverages the *Zeigarnik Effect* by showing partial problem descriptions with blurred text overlays, algorithmic hints, and strict weekly override limits.
4. **Automated Submission Verification**: Injects a lightweight MutationObserver script into LeetCode to catch SPA submission results in real time.
5. **Streak Engine & Gamification**: Rewards daily discipline with XP progression, levels (Beginner → Elite), freeze tokens, and automated alarm-driven notifications.

---

## 2. File Structure

```
Extensions/
├── workflow.md                         ← Total workflow & architectural guide (This file)
├── WORKFLOW_STRATEGY.md                ← High-level Manifest V3 strategy summary
└── Mad_Coder/                          ← Consolidated Chrome Extension Root
    ├── manifest.json                   ← Manifest V3 manifest specification
    ├── README_Extension.md              ← Quickstart & installation guide
    ├── mad-coder-pro-prompt.md          ← Specification prompt
    ├── generate_problems.js            ← Offline problem bank generator script
    │
    ├── data/                           ← Data storage & rule resources
    │   ├── problems.json               ← Offline fallback problem bank (~150+ entries)
    │   └── dnr_rules.json              ← Declarative Net Request rules template
    │
    ├── icons/                          ← Extension branding assets
    │   ├── icon16.png                  ← Toolbar icon (16x16)
    │   ├── icon48.png                  ← Extension management icon (48x48)
    │   └── icon128.png                 ← Web store & OS notification icon (128x128)
    │
    ├── libs/                           ← Offline dependencies (Zero CDN required)
    │   ├── pdf.min.js                  ← Mozilla PDF.js core parsing library
    │   └── pdf.worker.min.js           ← PDF.js background worker thread
    │
    └── src/                            ← Modular Component Source Code
        ├── analytics/
        │   └── analytics.js            ← Event logging & 90-day retention manager
        ├── background/
        │   └── background.js           ← Central ES Module Service Worker & orchestrator
        ├── block/
        │   ├── block.html              ← Interactive gatekeeper view
        │   ├── block.css               ← Zone layout styling & blur overlays
        │   └── block.js                ← Gatekeeper page logic & override triggers
        ├── content/
        │   └── content.js              ← LeetCode DOM MutationObserver script
        ├── parser/
        │   └── pdfParser.js            ← PDF text extraction & fuzzy title matcher
        ├── popup/
        │   ├── popup.html              ← Tabbed dashboard popup view
        │   ├── popup.css               ← Popup styles & progress bars
        │   └── popup.js                ← Dashboard controller & tab coordinator
        └── scheduler/
            └── scheduler.js            ← Alarm handlers (daily reset, streaks, XP)
```

---

## 3. Implementation Structure & Technical Architecture

### A. State Management & Dual Storage Strategy

State is divided between **persistent local storage** and **ephemeral session storage** to handle Manifest V3 service worker lifecycle terminations gracefully.

```
┌──────────────────────────────────────┐     ┌──────────────────────────────────────┐
│       chrome.storage.local           │     │       chrome.storage.session         │
├──────────────────────────────────────┤     ├──────────────────────────────────────┤
│ • streak { current, longest, history }│     │ • sessionActive (boolean)            │
│ • xp { total, level, levelName }     │     │ • currentProblemSlug (string)        │
│ • whitelist [ { id, domain } ]       │     │ • currentProblemTitle (string)       │
│ • pdfGoals [ ... ]                   │     │ • freedomExpiresAt (timestamp ms)    │
│ • useGoalMode (boolean)              │     │ • freedomEarnedMinutes (number)      │
│ • overrides { usedThisWeek }         │     │ • solvedThisSession (number)         │
│ • analyticsLog [ ... ]               │     │ • blockCountThisSession (number)     │
└──────────────────────────────────────┘     └──────────────────────────────────────┘
```

---

### B. End-to-End Execution Workflow

#### Phase 1: Extension Startup & Alarm Registration
1. Extension is loaded; `chrome.runtime.onInstalled` in `src/background/background.js` executes.
2. Initializes default whitelist domains (LeetCode, MDN, StackOverflow, GitHub, Wikipedia, NeetCode, etc.).
3. Registers three background alarms using `chrome.alarms`:
   - `FREEDOM_CHECK` (Every 30s): Checks if freedom window expired, updates badge (`🔒` vs `14m`).
   - `DAILY_RESET` (Every midnight): Recalculates streak continuity, awards freeze tokens, resets daily counters.
   - `STREAK_GUARD` (Hourly): Checks if daily solve is missing past 11:00 PM and pushes notification.

#### Phase 2: Session Activation & Dynamic DNR Rules
1. User clicks **Start Session** in `src/popup/popup.js`.
2. Sends `START_SESSION` message to `src/background/background.js`.
3. Background updates `storage.session` (`sessionActive: true`).
4. `assignNextProblem()` picks next problem from `pdfGoals` (if `useGoalMode === true`) or `data/problems.json` (weighted by Easy 50% / Medium 50%).
5. `rebuildDNRRules()` constructs `chrome.declarativeNetRequest` rules:
   - Dynamic ALLOW rules (Priority 2) for whitelisted domains.
   - Dynamic BLOCK rule (Priority 1) for all other main frame requests.

#### Phase 3: Navigation Interception & Gatekeeping
1. User attempts to open a non-whitelisted site (e.g., `reddit.com`).
2. `chrome.webNavigation.onBeforeNavigate` fires in `src/background/background.js`:
   - Checks if session is active and URL is not whitelisted.
   - Checks if `freedomExpiresAt > Date.now()`.
   - If no freedom: Redirects tab to `src/block/block.html` passing problem slug, title, difficulty, preview text, and streak info as URL parameters.
3. `src/block/block.html` renders:
   - Zone 1: Daily streak badge & solve dots.
   - Zone 2: Problem title, blurred preview with "Start solving →" overlay, hint toggle, and "Go Solve It" button.
   - Zone 3: Blocked URL info, identity quote, and Emergency Override button.

#### Phase 4: Verification & Freedom Award
1. User clicks "Go Solve It" → navigates to `https://leetcode.com/problems/<slug>/`.
2. Injected `src/content/content.js` initializes:
   - Sets up `MutationObserver` on the React SPA root element.
   - Intercepts SPA routing (`history.pushState`, `history.replaceState`, `popstate`).
   - If user visits a wrong problem, displays dismissible warning banner.
3. User submits code and receives **"Accepted"**:
   - `content.js` matches `[data-e2e-locator="submission-result"]` or `.success__3Ai7`.
   - Sends `PROBLEM_SOLVED` message with problem slug to background.
4. Background handles `PROBLEM_SOLVED`:
   - Verifies slug matches `currentProblemSlug`.
   - Calculates freedom duration (Easy = 15m, Medium = 25m, Hard = 40m).
   - Sets `storage.session.freedomExpiresAt = Date.now() + (duration * 60000)`.
   - Awards XP (`processSolve()` in `src/scheduler/scheduler.js`), updates streak, and logs event in `src/analytics/analytics.js`.
   - Displays OS notification: `"✅ 'Two Sum' solved! You earned 15 minutes."`
   - Automatically pre-assigns next problem for when freedom expires.

---

### C. PDF Study Plan Parsing Pipeline

```
  User uploads PDF in Popup (Tab 2)
                │
                ▼
  pdfParser.js loads file via PDF.js (libs/pdf.min.js)
                │
                ▼
  Step 1: Extract text content across all pages via getTextContent()
                │
                ▼
  Step 2: Normalize whitespace, line breaks, and hyphenations
                │
                ▼
  Step 3: Multi-Pass Detection Engine
    ├── Pass A (URLs): Regex match /leetcode\.com\/problems\/([\w-]+)/
    ├── Pass B (IDs):  Regex match /#?(\d{1,4})/ -> match against problems.json
    ├── Pass C (Title): Fuzzy token similarity match against problem titles (>= 0.75 score)
    └── Pass D (Topics): Scan tags ("Array", "DP", "Graph", "Tree") -> set topic preferences
                │
                ▼
  Step 4: Deduplicate goals by problem ID & group under Week/Day headers
                │
                ▼
  Step 5: Store confirmed goals in chrome.storage.local:
          pdfGoals: [ { id, slug, title, difficulty } ], useGoalMode: true
```

---

## 4. Message Passing Protocol

All extension components communicate asynchronously using `chrome.runtime.sendMessage` and `chrome.tabs.sendMessage`:

| Origin | Target | Message Type | Payload | Action Taken |
| :--- | :--- | :--- | :--- | :--- |
| `popup.js` | `background.js` | `START_SESSION` | `{}` | Activates blocking, assigns problem, builds DNR rules |
| `popup.js` | `background.js` | `END_SESSION` | `{}` | Deactivates blocking, clears session, removes DNR rules |
| `popup.js` | `background.js` | `GET_STATE` | `{}` | Returns snapshot of `storage.session` and `storage.local` |
| `popup.js` | `background.js` | `UPDATE_WHITELIST` | `{ whitelist }` | Updates stored whitelist & rebuilds active DNR rules |
| `popup.js` | `background.js` | `SET_GOAL_MODE` | `{ goals, meta }` | Saves parsed PDF goals & activates Goal Mode |
| `content.js` | `background.js` | `PROBLEM_SOLVED` | `{ slug, runtime }` | Validates solve, calculates freedom, updates streak & XP |
| `content.js` | `background.js` | `WRONG_PROBLEM` | `{ currentSlug }` | Checks assigned problem; triggers warning banner if mismatch |
| `background.js` | `content.js` | `SHOW_WRONG_PROBLEM_BANNER` | `{ assignedTitle }` | Renders red warning banner at top of LeetCode page |
| `block.js` | `background.js` | `USE_OVERRIDE` | `{}` | Consumes 1 weekly override token; grants 10m emergency freedom |
