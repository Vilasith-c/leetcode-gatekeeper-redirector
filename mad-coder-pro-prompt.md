# Mad Coder Pro — Complete Build Prompt
## "Build this exactly as described. Every feature. No placeholders. No TODOs."

---

## WHO YOU ARE BUILDING FOR

An intermediate developer (comfortable with Easy–Medium LeetCode problems) who wants a Chrome extension that:
1. Forces them to solve a LeetCode problem before accessing any non-whitelisted website
2. Lets them upload a PDF of their study plan / problem list, which the extension reads and uses as their actual goal set
3. Gives them granular control over exactly which tabs/domains are allowed while they are in a coding session
4. Uses proven psychology mechanics to make the habit stick — not just block and annoy

The user is technical enough to load an unpacked extension in Chrome. The final output must be a complete folder they drag into `chrome://extensions` and it works immediately with zero additional setup.

---

## PLATFORM & TECHNICAL CONSTRAINTS

- **Manifest Version**: V3 strictly. No V2 patterns whatsoever.
- **Browser target**: Chrome / Chromium (also works on Edge which is Chromium-based)
- **No build step**: Pure vanilla JS + HTML + CSS. No React, no Webpack, no npm. The user loads it directly as an unpacked extension.
- **No external API calls at runtime**: Everything runs locally. The PDF parsing happens inside the extension. No sending data to any server.
- **`setInterval` is BANNED**: MV3 service workers terminate after ~30 seconds of inactivity. All periodic logic MUST use `chrome.alarms`. Any use of `setInterval` or `setTimeout` for anything longer than a UI animation is a critical bug.
- **Module syntax**: `background.js` must be declared as `"type": "module"` in the manifest so it can use ES module imports.
- **Storage split**:
  - `chrome.storage.local` → persistent data (streaks, problem history, user settings, whitelist, parsed PDF goals)
  - `chrome.storage.session` → ephemeral runtime state (current active problem slug, freedom window expiry timestamp, session block count)
- **No jQuery, no lodash**: Vanilla JS only.

---

## FILE STRUCTURE — BUILD EXACTLY THIS TREE

```
mad-coder-pro/
├── manifest.json
├── data/
│   ├── problems.json          ← fallback problem bank (Easy+Medium, 150 problems minimum)
│   └── dnr_rules.json         ← starts as [] — dynamically replaced at runtime
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png            ← generate simple SVG-based PNGs, dark bg, white "MC" text
├── src/
│   ├── background/
│   │   └── background.js      ← service worker, central brain
│   ├── content/
│   │   └── content.js         ← injected into leetcode.com/problems/* only
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js
│   ├── block/
│   │   ├── block.html         ← the page shown when a site is blocked
│   │   ├── block.css
│   │   └── block.js
│   ├── parser/
│   │   └── pdfParser.js       ← PDF.js-based parser, runs in popup context
│   ├── analytics/
│   │   └── analytics.js       ← module imported by background.js
│   └── scheduler/
│       └── scheduler.js       ← module imported by background.js
└── libs/
    └── pdf.min.js             ← bundled PDF.js (download from Mozilla, include locally, NO CDN at runtime)
    └── pdf.worker.min.js
```

---

## MANIFEST.JSON — EXACT PERMISSIONS NEEDED

```json
{
  "manifest_version": 3,
  "name": "Mad Coder Pro",
  "version": "2.0.0",
  "description": "PDF-driven LeetCode gatekeeper with whitelist tab control.",
  "permissions": [
    "storage",
    "alarms",
    "tabs",
    "webNavigation",
    "declarativeNetRequest",
    "declarativeNetRequestWithHostAccess",
    "scripting",
    "notifications"
  ],
  "host_permissions": ["<all_urls>"],
  "background": {
    "service_worker": "src/background/background.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["https://leetcode.com/problems/*"],
      "js": ["src/content/content.js"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "src/popup/popup.html"
  },
  "web_accessible_resources": [
    {
      "resources": ["src/block/block.html", "src/block/block.css", "src/block/block.js", "data/problems.json", "icons/*", "libs/*"],
      "matches": ["<all_urls>"]
    }
  ],
  "declarative_net_request": {
    "rule_resources": [{ "id": "whitelist_rules", "enabled": true, "path": "data/dnr_rules.json" }]
  }
}
```

---

## FEATURE 1 — GATEKEEPER ENGINE (background.js)

### How blocking works — the full decision tree

When `chrome.webNavigation.onBeforeNavigate` fires for any navigation:

```
Is the extension ENABLED?
  └─ NO → allow everything, do nothing

Is the URL the LeetCode problem page for the current assigned problem?
  └─ YES → allow it

Is the URL leetcode.com (any page)?
  └─ YES → allow it (they need to navigate to their problem)

Is the URL in the user's WHITELIST?
  └─ YES → allow it

Is there an active FREEDOM WINDOW? (storage.session: freedomExpiresAt > Date.now())
  └─ YES → allow it, but decrement freedom time display in popup

Is the user currently IN_SESSION (session started, no problem solved yet)?
  └─ YES → BLOCK: redirect tab to block.html with query params:
            ?blocked=<encoded URL>&problem=<current slug>&streak=<N>&reason=solve_first

Is the user NOT in a session (hasn't started one)?
  └─ BLOCK: redirect to block.html with reason=start_session
```

### Session states — store in storage.session

```js
{
  sessionActive: boolean,          // is a session running
  currentProblemSlug: string,      // e.g. "two-sum"
  currentProblemTitle: string,
  currentProblemDifficulty: string,
  currentProblemTags: [],
  freedomExpiresAt: number,        // timestamp ms, 0 if no freedom
  freedomEarnedMinutes: number,    // how many minutes were earned this solve
  solvedThisSession: number,       // problems solved in this session
  blockCountThisSession: number,   // how many times blocked this session
  sessionStartedAt: number         // timestamp
}
```

### Freedom window logic — exact rules

- Solving an Easy problem → **15 minutes** of freedom
- Solving a Medium problem → **25 minutes** of freedom
- Freedom windows are **not cumulative**: solving again during a freedom window REPLACES (extends) the timer, it does not add
- Freedom window expires → immediately blocked again until next solve
- Freedom window state is stored in `storage.session` so it survives service worker restarts
- On every alarm tick, check `freedomExpiresAt` and if expired, clear it and update badge

### Chrome alarm setup — exact alarm names

```js
chrome.alarms.create('FREEDOM_CHECK', { periodInMinutes: 0.5 });     // every 30s
chrome.alarms.create('DAILY_RESET', { when: nextMidnightTimestamp() }); // once at midnight
chrome.alarms.create('STREAK_GUARD', { periodInMinutes: 60 });         // hourly streak integrity check
```

On `chrome.alarms.onAlarm`:
- `FREEDOM_CHECK` → check if freedom expired, update badge text
- `DAILY_RESET` → reset daily counters (solvedToday, blockedToday), reschedule alarm for next midnight, check streak continuity
- `STREAK_GUARD` → if today has no solve and it's past 23:00, push a Chrome notification: "⚠️ Streak at risk — solve one problem before midnight"

### Badge display

Use `chrome.action.setBadgeText` and `chrome.action.setBadgeBackgroundColor`:
- Session inactive: badge empty
- Session active, no freedom: badge = "🔒" or red "●"
- Freedom active: badge = remaining minutes e.g. "14m", green background
- Problem solved: brief "✓" flash for 3 seconds then switch to freedom countdown

---

## FEATURE 2 — PDF GOAL PARSER (pdfParser.js)

This is the most technically complex feature. Build it properly.

### What the PDF upload flow does

The user is in the popup. They click "Upload Study Plan (PDF)". They pick a PDF file. The extension reads the PDF using PDF.js (bundled locally), extracts text from every page, then runs a parsing pipeline to detect:
1. LeetCode problem names (e.g. "Two Sum", "Longest Substring Without Repeating Characters")
2. LeetCode problem numbers (e.g. "#1", "Problem 217", "LC 46")
3. LeetCode URLs (e.g. `leetcode.com/problems/two-sum`)
4. Difficulty labels near problem names (Easy / Medium / Hard — case insensitive)
5. Topic tags near problem names (Array, DP, Graph, Tree, etc.)
6. Weekly/daily structure (e.g. "Week 1:", "Day 3:", "Monday:") — use these as goal groupings

### Parser pipeline — exact steps

```
Step 1: Extract raw text from all PDF pages using PDF.js getTextContent()
Step 2: Normalize — collapse multiple spaces, fix hyphenation, strip page numbers
Step 3: Split into lines
Step 4: Run FOUR detection passes in order:

  Pass A — URL detection
    Regex: /leetcode\.com\/problems\/([\w-]+)/gi
    For each match: extract slug, look it up in problems.json by slug
    If found → add to goalProblems with confidence: "url"

  Pass B — Problem number detection
    Regex: /#?(\d{1,4})\b/ or /(?:LC|Problem|No\.?)\s*(\d{1,4})/gi
    For each match: look up problems.json by id field
    If found → add with confidence: "number"

  Pass C — Problem title fuzzy match
    For each line, compute similarity against all titles in problems.json
    Use Levenshtein distance or token overlap (implement a simple one — no library)
    Score threshold: ≥ 0.75 similarity → add with confidence: "title_match", score: N
    Lower threshold 0.6–0.75 → add as "suggested" (shown in UI with ? flag)

  Pass D — Topic extraction
    Scan lines for known tags: ["Array","String","Hash Table","Linked List","Stack","Queue",
    "Tree","Binary Tree","Graph","BFS","DFS","Sliding Window","Two Pointers","Binary Search",
    "Dynamic Programming","DP","Greedy","Backtracking","Recursion","Math","Sorting","Heap",
    "Priority Queue","Trie","Matrix","Bit Manipulation"]
    Store detected topic preferences → used to bias random problem selection

Step 5: Dedup by problem id — keep highest confidence version
Step 6: Extract goal structure:
    - If "Week N" headers found → group problems under weeks
    - If "Day N" headers found → group under days
    - Else → flat list
Step 7: Return structured result:
    {
      goals: [{ id, slug, title, difficulty, tags, confidence, weekGroup, dayGroup }],
      suggestedGoals: [...],   // 0.6–0.75 confidence — user must confirm
      topicPreferences: [],    // detected from text
      totalDetected: N,
      parseWarnings: []        // e.g. "Page 3 text was garbled — possible scan/image PDF"
    }
```

### After parsing — what gets saved

```js
chrome.storage.local.set({
  pdfGoals: goals,                    // the confirmed goal list
  pdfGoalsMeta: { filename, parsedAt, totalDetected, topicPreferences },
  useGoalMode: true,                  // flag: use PDF goals instead of random
  goalIndex: 0                        // which goal to assign next
})
```

### How goals are assigned

When a new session starts and `useGoalMode === true`:
- Pick next problem from `pdfGoals` at `goalIndex`
- Increment `goalIndex` (wrap around at end)
- If the problem was already solved (check `solvedProblems` history) → skip to next
- If all PDF goals are solved → switch to random mode from fallback bank, notify user

When `useGoalMode === false` (no PDF uploaded or user reset):
- Pick randomly from `data/problems.json`, weighted by difficulty:
  - Easy: 50% weight
  - Medium: 50% weight
  - Filtered by `topicPreferences` if set (prefer problems with matching tags)

---

## FEATURE 3 — WHITELIST TAB CONTROL (background.js + popup.js)

### How the whitelist works

The whitelist is a user-managed list of **domain patterns** that are always allowed during a session. Everything NOT on the whitelist is blocked. This is a pure whitelist model — default deny, explicit allow.

### Default whitelist entries (pre-loaded, user can remove any of these)

```js
const DEFAULT_WHITELIST = [
  "leetcode.com",
  "developer.mozilla.org",
  "docs.python.org",
  "cppreference.com",
  "docs.oracle.com",
  "stackoverflow.com",
  "github.com",
  "docs.github.com",
  "en.wikipedia.org",
  "geeksforgeeks.org",
  "visualgo.net",
  "cs.usfca.edu",        // algorithm visualizations
  "bigocheatsheet.com",
  "neetcode.io",
  "youtube.com/watch*"   // allow YouTube but only specific video URLs (explained below)
]
```

### YouTube partial allow — exact implementation

YouTube gets special treatment. Instead of blocking all of YouTube or allowing all of it:
- `youtube.com` → BLOCKED (redirects to block.html)
- `youtube.com/watch?v=*` where the referrer is the block page or a whitelisted site → ALLOWED (with a warning toast on the block page: "YouTube videos are allowed — stay focused")
- Implementation: in `webNavigation.onBeforeNavigate`, check if URL matches `youtube.com/watch` pattern — if yes, allow. All other youtube.com/* → block.

### Whitelist storage format

```js
// stored in chrome.storage.local
{
  whitelist: [
    { id: "uuid-v4-string", domain: "leetcode.com", addedAt: timestamp, label: "LeetCode" },
    { id: "uuid-v4-string", domain: "developer.mozilla.org", addedAt: timestamp, label: "MDN" },
    // ...
  ]
}
```

### Whitelist domain matching — exact logic

For a given navigation URL, extract the hostname. Then for each entry in whitelist:
```js
function isDomainAllowed(url, whitelist) {
  const hostname = new URL(url).hostname.replace(/^www\./, '');
  return whitelist.some(entry => {
    const pattern = entry.domain.replace(/^www\./, '');
    if (pattern.startsWith('*.')) {
      return hostname.endsWith(pattern.slice(2));
    }
    return hostname === pattern || hostname.endsWith('.' + pattern);
  });
}
```

### Declarative Net Request — how to update dynamically

When the whitelist changes:
1. Convert whitelist to DNR rules — one ALLOW rule per domain
2. Add a catch-all BLOCK rule with lower priority that blocks everything
3. Update via `chrome.declarativeNetRequest.updateDynamicRules()`

```js
async function rebuildDNRRules(whitelist) {
  // Remove all existing dynamic rules first
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeIds = existing.map(r => r.id);

  const allowRules = whitelist.map((entry, i) => ({
    id: i + 1,
    priority: 2,
    action: { type: "allow" },
    condition: { 
      requestDomains: [entry.domain.replace(/^\*\./, '')],
      resourceTypes: ["main_frame", "sub_frame"]
    }
  }));

  // Catch-all block rule — lower priority than allow rules
  const blockAllRule = {
    id: 9999,
    priority: 1,
    action: { type: "block" },
    condition: {
      urlFilter: "*",
      resourceTypes: ["main_frame"]
    }
  };

  // IMPORTANT: DNR block would break the block page itself — exclude extension URLs
  // The block page is a chrome-extension:// URL which DNR doesn't touch, so this is safe.

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: removeIds,
    addRules: [...allowRules, blockAllRule]
  });
}
```

**Critical note**: Only rebuild DNR rules when the session is ACTIVE. When session is inactive, remove the catch-all block rule so the user can browse freely.

### Popup whitelist UI — exact interactions

- List view of all whitelist entries with domain, label, added date, and a red trash icon
- "Add domain" input field with autocomplete suggestions from a curated list of coding resources
- Clicking trash → removes entry → immediately calls `rebuildDNRRules()`
- Drag to reorder (optional — lower priority)
- Bulk presets: "Add All Dev Docs", "Add Search Engines" buttons that add a curated batch
- Export whitelist as JSON button
- Import whitelist from JSON button

---

## FEATURE 4 — BLOCK PAGE (block.html + block.js)

The block page is the most user-facing feature. It must not feel like a punishment — it must feel like a gateway.

### URL parameters it receives

```
chrome-extension://[id]/src/block/block.html
  ?blocked=<encoded original URL>
  &problem=<slug>
  &title=<encoded problem title>
  &difficulty=<Easy|Medium|Hard>
  &preview=<encoded first 300 chars of problem description>
  &streak=<N>
  &solvedToday=<N>
  &reason=<solve_first|start_session|freedom_expired>
```

### Layout — three zones

**Zone 1: Top status bar**
- Left: streak counter "🔥 12 days" — if streak > 0, animate a subtle pulse
- Right: "Solved today: 3" + small calendar dots for the last 7 days (filled = solved, empty = missed)

**Zone 2: Problem card (center, dominant)**
- Difficulty badge (green = Easy, orange = Medium, red = Hard)
- Problem title (large, clickable — navigates to the LeetCode problem)
- Problem preview text — first 300 characters of description — BUT the last 80 characters are blurred/obscured with a "Start solving →" overlay (Zeigarnik effect — show incomplete information to create pull)
- Topic tags as chips below the preview
- A prominent "Go Solve It →" button that navigates to `leetcode.com/problems/<slug>`
- A smaller "See hint" toggle — reveals a one-line algorithmic hint stored in the problem data

**Zone 3: Bottom bar**
- "You were trying to visit: [domain]" — show the blocked URL's hostname, not the full URL
- Identity statement (rotates randomly from a list):
  - "Consistent coders solve first."
  - "You are building a daily practice. This is day N of that practice."
  - "One problem. Then freedom."
  - "The best developers you admire did the reps."
- Emergency override button (small, grey, bottom right):
  - Label: "Use Override Token (X remaining this week)"
  - Clicking shows confirmation: "This uses 1 of your 3 weekly override tokens. Are you sure?"
  - If confirmed → grant 10 minutes of freedom → log override event in analytics
  - If 0 tokens remaining → button is disabled, label: "No overrides left this week"

### Block page problem preview — how to populate it

The problem preview text is NOT fetched from LeetCode API. It is stored in `data/problems.json`. Each problem entry must include a `preview` field with the first ~300 chars of its description. The background.js passes this via URL params when redirecting to the block page.

---

## FEATURE 5 — CONTENT SCRIPT (content.js)

Injected into `https://leetcode.com/problems/*` at `document_idle`.

### What it detects — submission success

LeetCode's UI is a React SPA. The submit result does not cause a page navigation. The content script must use a **MutationObserver** to watch for the success state.

```js
// Watch for the success modal/banner — LeetCode renders it with these selectors
// (as of 2024 — may need updating if LeetCode changes their DOM):
const SUCCESS_SELECTORS = [
  '[data-e2e-locator="submission-result"]',  // newer LeetCode UI
  '.success__3Ai7',                           // older class-based
  'text*=Accepted'                            // text content fallback
];

// Strategy: observe the entire #app or #__next root with subtree: true
// Look for any element matching SUCCESS_SELECTORS appearing in DOM
// Debounce: only fire once per 5 seconds to avoid duplicate signals
```

### What it does on success detection

```js
// 1. Extract submission metadata from the page
const submissionData = {
  slug: extractSlugFromURL(),          // from window.location.pathname
  runtime: extractRuntime(),           // e.g. "84 ms" from result panel
  memoryUsage: extractMemory(),        // e.g. "41.2 MB"
  language: extractLanguage(),         // e.g. "Python3"
  timestamp: Date.now(),
  verdict: 'Accepted'
};

// 2. Send to background.js
chrome.runtime.sendMessage({ type: 'PROBLEM_SOLVED', data: submissionData });

// 3. Background.js on receiving PROBLEM_SOLVED:
//    - Verify the slug matches currentProblemSlug (ignore wrong-problem solves)
//    - Calculate freedom minutes based on difficulty
//    - Set storage.session.freedomExpiresAt = Date.now() + (freedomMinutes * 60000)
//    - Update streak logic
//    - Update analytics
//    - Update badge
//    - Send a Chrome notification: "✅ Solved! You earned 25 minutes of freedom."
//    - Advance goalIndex if in goal mode
```

### Wrong problem detection

If the user navigates to a LeetCode problem that is NOT their assigned problem:
- Content script sends `{ type: 'WRONG_PROBLEM', slug: currentSlug, assignedSlug: stored }` to background
- Background sends back a message to content script
- Content script injects a subtle banner at the top of the LeetCode page: "⚠️ Your assigned problem is [Title]. Solve it to unlock freedom. [Go to assigned →]"
- Banner is dismissible, reappears if user navigates to another wrong problem

---

## FEATURE 6 — STREAK ENGINE (analytics.js + scheduler.js)

### Streak data structure

```js
// stored in chrome.storage.local
{
  streak: {
    current: 0,           // current consecutive days
    longest: 0,           // all-time longest
    lastSolveDate: null,  // "YYYY-MM-DD" string
    freezeTokens: 0,      // earned freeze tokens (max 3)
    history: {            // keyed by date string
      "2025-07-01": { solved: 2, blocked: 5, overridesUsed: 0, totalFreedomEarned: 50 },
      "2025-07-02": { solved: 1, blocked: 2, overridesUsed: 1, totalFreedomEarned: 25 }
    }
  },
  xp: {
    total: 0,
    level: 1,
    levelName: "Beginner",  // Beginner → Grinder → Consistent → Relentless → Elite
    levelThresholds: [0, 100, 300, 700, 1500]
  },
  overrides: {
    usedThisWeek: 0,
    weekResetDate: "YYYY-MM-DD",  // Monday of current week
    totalAllTime: 0
  }
}
```

### XP awards — exact values

```
Solve Easy:               +10 XP
Solve Medium:             +20 XP
Solve Hard:               +35 XP
Solve before 9:00 AM:     +5 XP bonus (early bird)
Solve without override:   +3 XP bonus
Current streak 7+ days:   +5 XP bonus per solve
Current streak 30+ days:  +10 XP bonus per solve
Use override:             -5 XP penalty
Miss a day:               0 (streak resets, no XP change)
```

### Streak freeze tokens

- Earned: 1 freeze token per 7-day streak maintained
- Max held: 3 tokens
- Used: Manually via popup "Use Freeze Token" button when user knows they'll miss a day
- Effect: The daily reset alarm checks for freeze token use — if used, streak is maintained even though no problem was solved
- The use must happen BEFORE midnight of the day you're protecting

### Streak continuity check — exact logic in DAILY_RESET alarm handler

```js
function performDailyReset() {
  const today = getTodayString();           // "YYYY-MM-DD"
  const yesterday = getYesterdayString();
  const { streak, history } = await getStorage(['streak', 'history']);

  const solvedYesterday = history[yesterday]?.solved > 0;
  const freezeUsedYesterday = history[yesterday]?.freezeUsed === true;

  if (solvedYesterday || freezeUsedYesterday) {
    // Streak continues
    streak.current += 1;
    streak.longest = Math.max(streak.longest, streak.current);
    // Award freeze token every 7 days
    if (streak.current % 7 === 0 && streak.freezeTokens < 3) {
      streak.freezeTokens += 1;
      pushNotification("🧊 Freeze token earned! You have " + streak.freezeTokens + " tokens.");
    }
  } else {
    // Streak broken
    if (streak.current >= 3) {
      pushNotification("💔 Streak of " + streak.current + " days broken. Start again today.");
    }
    streak.current = 0;
  }

  // Reset daily counters
  history[today] = { solved: 0, blocked: 0, overridesUsed: 0, totalFreedomEarned: 0 };

  // Reset weekly overrides if new week
  resetWeeklyOverridesIfNewWeek();

  // Reschedule alarm for next midnight
  chrome.alarms.create('DAILY_RESET', { when: nextMidnightTimestamp() });

  await setStorage({ streak, history });
}
```

---

## FEATURE 7 — POPUP (popup.html + popup.js)

### Popup has 4 tabs — implement with JS tab switching, no page reloads

#### Tab 1: Dashboard
- Session toggle (large, prominent): "Start Session / End Session"
  - Starting a session: assigns a new problem, activates blocking, rebuilds DNR rules
  - Ending a session: deactivates blocking, clears session state, removes catch-all DNR rule
- Current problem card (visible when session active):
  - Title, difficulty badge, tags
  - Direct "Go Solve" button → opens leetcode.com/problems/<slug> in current tab
  - "Skip Problem" button (costs 5 XP, logs skip event, assigns next problem)
- Freedom window display: large countdown timer if freedom is active ("14:32 remaining")
- Today's stats: Solved today, Blocked today, Freedom earned today (in minutes), XP earned today
- Streak display: "🔥 12" with a small calendar heatmap for last 30 days (tiny dots, green = solved, grey = missed, blue = freeze used)

#### Tab 2: Goals (PDF Upload)
- Upload area: drag-and-drop zone OR "Choose PDF" button
- After upload:
  - Show parse progress (step indicators: Extracting text → Detecting problems → Matching database → Done)
  - Show parse results table:
    - Columns: #, Problem Title, Difficulty, Confidence (High/Medium/?), Action
    - High confidence (≥0.75): pre-checked, green checkmark
    - Medium confidence (0.6–0.75): pre-checked with ⚠️ icon, user should verify
    - Below 0.6: not shown (filtered out silently)
  - "Confirm Goals" button → saves to storage, switches to goal mode
  - "Use Random Instead" button → clears goal mode
- Goal mode indicator: shows current goal set name (PDF filename), progress (7/23 problems completed)
- "Reset Goals" button → clears PDF data, returns to random mode

#### Tab 3: Whitelist
- List of current whitelist entries (domain, label, trash icon)
- "Add domain" input with validation (must be valid domain pattern)
- Autocomplete suggestions: typing "stack" suggests stackoverflow.com, typing "mdn" suggests developer.mozilla.org
- Preset buttons:
  - "Dev Docs Bundle": adds MDN, Python docs, Java docs, cppreference
  - "Search Bundle": adds google.com, duckduckgo.com, bing.com
- Import/Export JSON buttons
- Note: changes apply immediately to active session

#### Tab 4: Stats
- XP progress bar with current level and next level threshold
- Streak stats: current, longest, freeze tokens available, "Use Freeze Token" button (disabled if 0)
- Override history: used this week / 3, reset date
- All-time stats: total problems solved, total freedom earned (hours), most-solved topic, avg solve time
- 30-day calendar heatmap: full grid view
- "Override tokens this week": counter + reset date

---

## FEATURE 8 — NOTIFICATIONS (background.js)

All notifications use `chrome.notifications.create()`. Implement a `notify(id, title, message)` helper.

```js
const NOTIFICATIONS = {
  PROBLEM_SOLVED:     (title, mins) => `✅ "${title}" solved! You earned ${mins} minutes.`,
  FREEDOM_EXPIRING:   (mins) =>        `⏱️ ${mins} minutes of freedom left.`,
  FREEDOM_EXPIRED:    () =>            `🔒 Freedom window ended. Solve another to continue.`,
  STREAK_AT_RISK:     (streak) =>      `⚠️ Your ${streak}-day streak ends at midnight. Solve now!`,
  STREAK_BROKEN:      (was) =>         `💔 ${was}-day streak broken. Start fresh today.`,
  STREAK_MILESTONE:   (n) =>           `🏆 ${n}-day streak! You're building a real habit.`,
  FREEZE_EARNED:      (total) =>       `🧊 Freeze token earned! You have ${total}.`,
  OVERRIDE_USED:      (left) =>        `🚨 Override used. ${left} remaining this week.`,
  LEVEL_UP:           (level) =>       `⬆️ Level up! You are now: ${level}.`,
  ALL_GOALS_COMPLETE: () =>            `🎉 All PDF goals completed! Switching to random mode.`
};
```

Notification deduplication: don't fire the same notification ID more than once per minute.

---

## FEATURE 9 — ANALYTICS MODULE (analytics.js)

This is a pure module — no UI. Import it in background.js.

### What it records

Every event goes into `chrome.storage.local` under `analyticsLog`:

```js
// Each entry:
{
  type: string,       // SOLVE | BLOCK | OVERRIDE | SKIP | SESSION_START | SESSION_END | FREEDOM_START | FREEDOM_END
  timestamp: number,
  data: {}            // event-specific payload
}
```

### Events and their payloads

```js
SOLVE:          { slug, title, difficulty, runtime, memory, language, freedomEarned, xpEarned, solveTimeMs }
BLOCK:          { attemptedURL, domain, reason, sessionDuration }
OVERRIDE:       { reason: 'user_requested', freedomGranted: 600000 }
SKIP:           { slug, xpPenalty: 5, reason: 'user_skip' }
SESSION_START:  { problemSlug, problemTitle, goalMode: boolean }
SESSION_END:    { duration, solvedCount, blockCount }
FREEDOM_START:  { durationMs, earnedBy: slug }
FREEDOM_END:    { expired: boolean }
```

### Retention

Keep last 90 days of events. On daily reset, purge events older than 90 days.

### Derived stats (computed on-demand by popup, not stored)

- Average solve time per difficulty (mean of `solveTimeMs` for SOLVE events)
- Most-attempted topic (from BLOCK events — which topic does user get blocked most while trying to access social)
- Peak productivity hours (group SOLVE events by hour of day)
- Override usage trend (overrides per week over last 4 weeks)
- Freedom efficiency (freedom minutes earned / freedom minutes used ratio)

---

## DATA: problems.json — EXACT SCHEMA PER ENTRY

Every problem in the fallback bank must have ALL these fields. Build at least 80 Easy + 70 Medium entries:

```json
{
  "id": 1,
  "slug": "two-sum",
  "title": "Two Sum",
  "difficulty": "Easy",
  "tags": ["Array", "Hash Table"],
  "hint": "Use a hash map to store complements as you iterate.",
  "preview": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
  "url": "https://leetcode.com/problems/two-sum/",
  "companies": ["Google", "Amazon", "Facebook"],
  "frequency": 95
}
```

Fields explanation:
- `hint`: shown on block page behind a toggle — one sentence, algorithmic direction only, no solution spoiler
- `preview`: first ~280 chars of problem statement (written by you, not scraped)
- `frequency`: 0–100, how commonly this problem appears in interviews. Used to weight random selection (higher frequency = higher chance of being picked)
- `companies`: optional, shown as small chips in the block page sidebar

---

## INTER-COMPONENT MESSAGING — COMPLETE MESSAGE PROTOCOL

All messages use `chrome.runtime.sendMessage` / `chrome.runtime.onMessage`. Define all message types as constants.

```js
// content.js → background.js
{ type: 'PROBLEM_SOLVED',   data: { slug, runtime, memory, language } }
{ type: 'WRONG_PROBLEM',    data: { currentSlug, assignedSlug } }
{ type: 'PAGE_LOADED',      data: { slug } }  // on content script init

// popup.js → background.js
{ type: 'START_SESSION',    data: {} }
{ type: 'END_SESSION',      data: {} }
{ type: 'SKIP_PROBLEM',     data: {} }
{ type: 'USE_OVERRIDE',     data: {} }
{ type: 'USE_FREEZE',       data: {} }
{ type: 'GET_STATE',        data: {} }         // background replies with full state snapshot
{ type: 'UPDATE_WHITELIST', data: { whitelist } }
{ type: 'SET_GOAL_MODE',    data: { goals, meta } }
{ type: 'CLEAR_GOAL_MODE',  data: {} }

// background.js → content.js (via tabs.sendMessage)
{ type: 'SHOW_WRONG_PROBLEM_BANNER', data: { assignedSlug, assignedTitle } }
{ type: 'SESSION_ENDED',             data: {} }

// background.js → popup.js (via runtime.sendMessage)
{ type: 'STATE_UPDATE',     data: { ...fullStateSnapshot } }

// All message handlers must return true if async (to keep channel open):
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  handleMessage(msg, sender).then(sendResponse);
  return true;
});
```

---

## EDGE CASES — HANDLE ALL OF THESE

1. **Service worker restart during freedom window**: On startup, background.js MUST immediately read `storage.session.freedomExpiresAt` and check if it's still valid. If yes, continue freedom. If expired, clear it.

2. **PDF with no detectable problems**: Show the user a clear error: "No LeetCode problems detected in this PDF. Try a PDF with problem titles, numbers, or links." Do not silently fall back.

3. **PDF is a scanned image (no text layer)**: PDF.js will return empty text content. Detect this (total extracted text < 100 chars across all pages) and show: "This PDF appears to be a scanned image. Mad Coder Pro needs a text-based PDF."

4. **User solves a problem during freedom window**: Still record the solve. Still update streak. Award XP. Extend freedom window (replace, don't add).

5. **User opens the same LeetCode problem in multiple tabs**: Content script fires in both. Use a debounce with a 5-second window — only process one PROBLEM_SOLVED per slug per session.

6. **Whitelist entry conflicts**: If user adds "google.com" but also has "Search Bundle" which adds "duckduckgo.com", no conflict. If user adds the same domain twice, deduplicate silently.

7. **Extension disabled mid-session**: On re-enable, check `sessionActive` in storage.session. If true, resume as if nothing happened — rebuild DNR rules, re-attach alarms.

8. **Chrome restarted mid-session**: Service worker restarts fresh. `storage.session` is cleared by Chrome on browser restart by design. On startup, if `chrome.storage.session` is empty but `chrome.storage.local.lastSessionDate` === today, offer to resume.

9. **Goal problem no longer on LeetCode**: Skip it, log a warning, advance to next.

10. **Skip used on last goal**: If goalIndex wraps around and all remaining goals are solved, switch to random mode and notify.

11. **Override token reset**: Weekly reset happens on Monday 00:00. If the user's `weekResetDate` is in the past and today is Monday or later, reset `usedThisWeek` to 0. This check runs in `DAILY_RESET` handler.

12. **Block page can't read URL params** (e.g. no problem assigned): Show a fallback: "Start a session from the extension popup to get assigned a problem."

---

## INSTALL & LOAD INSTRUCTIONS — WRITE THESE AS A README.md

The README.md must include:

```
1. Download PDF.js from https://mozilla.github.io/pdf.js/getting_started/
   → Download "Prebuilt" version
   → Copy `pdf.min.js` and `pdf.worker.min.js` into the `libs/` folder

2. Open Chrome and go to chrome://extensions

3. Enable "Developer mode" (top right toggle)

4. Click "Load unpacked"

5. Select the mad-coder-pro/ folder

6. The extension icon appears in your toolbar

7. Pin it for quick access

8. Click the icon → Start Session → Your first problem is assigned

IMPORTANT: Every time you edit any file, click the refresh icon on the extension card
at chrome://extensions to reload changes.
```

---

## WHAT "DONE" LOOKS LIKE — ACCEPTANCE CRITERIA

The extension is complete when:

- [ ] Loading it unpacked produces zero errors in chrome://extensions
- [ ] Starting a session assigns a problem and blocks all non-whitelisted sites
- [ ] Uploading a PDF correctly identifies at least 80% of standard LeetCode problem names/numbers
- [ ] Submitting an accepted solution on LeetCode automatically grants freedom and shows notification
- [ ] Freedom timer counts down correctly across service worker restarts
- [ ] Whitelist add/remove immediately affects what's blocked without reloading extension
- [ ] Streak increments correctly after midnight reset
- [ ] Override tokens deplete and reset weekly
- [ ] Block page shows problem preview with Zeigarnik blur and identity statement
- [ ] Popup shows real-time state (no stale data)
- [ ] All 4 popup tabs function
- [ ] No `setInterval` anywhere in the codebase
- [ ] No external network calls at runtime (PDF.js must be local)
- [ ] Analytics log records every event type correctly

---

## BUILD ORDER — FOLLOW THIS SEQUENCE

Build in this exact order to avoid dependency issues:

1. `manifest.json` + `data/dnr_rules.json` (empty array) + `data/problems.json` (full dataset)
2. `src/analytics/analytics.js` (no dependencies)
3. `src/scheduler/scheduler.js` (imports analytics)
4. `src/background/background.js` (imports scheduler + analytics, core logic)
5. `src/content/content.js` (standalone)
6. `src/parser/pdfParser.js` (standalone, uses PDF.js)
7. `src/block/block.html` + `block.js` + `block.css`
8. `src/popup/popup.html` + `popup.js` + `popup.css` (imports pdfParser)
9. `README.md`
10. Test: load unpacked, start session, verify blocking works, then build PDF parser

---

## FINAL INSTRUCTIONS TO THE AI BUILDING THIS

- Write every file completely. No `// TODO`, no `// implement later`, no placeholder functions.
- Every function must have JSDoc comments.
- Every `chrome.*` API call must have error handling (`chrome.runtime.lastError` checks).
- The `problems.json` must have at minimum 80 Easy + 70 Medium problems with all fields filled.
- `pdfParser.js` must be fully functional with real Levenshtein distance implementation — no stub.
- The MutationObserver in `content.js` must be production-grade — handle LeetCode's SPA navigation (use `popstate` + `pushState` override to detect problem page changes).
- The block page must be visually polished — it is the most-seen screen in the entire extension.
- Do not skip the README. The user is loading this as an unpacked extension.
- When done, provide the complete file tree showing every file that was created.
