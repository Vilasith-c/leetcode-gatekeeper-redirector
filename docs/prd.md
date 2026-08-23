# Product Requirements Document (PRD) — Mad Coder Pro

## 1. Product Vision & Executive Summary

**Mad Coder Pro** is an intelligent, gamified Manifest V3 Chrome Extension designed to transform website blocking into a disciplined coding habit builder. Instead of relying on passive willpower, Mad Coder Pro strictly gatekeeps non-whitelisted web browsing during active coding sessions, redirecting users to an interactive block page. To unlock a timed "freedom window" for free browsing, users must solve an assigned LeetCode problem or progress through their uploaded PDF study plan. The application incorporates behavioral psychology (the Zeigarnik effect), XP progression, level tiers, streak continuity protection, and strict weekly emergency overrides to turn daily coding into a lasting habit.

### Core Loop
```
  ┌─────────────────────────────────────────────────────────────┐
  │ 1. User initiates a Session in the Popup Dashboard          │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ 2. Distracting/Non-Whitelisted Websites are BLOCKED         │
  │    User is redirected to the Interactive Block Page         │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ 3. User solves assigned LeetCode / PDF Study Plan task     │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ 4. Content Script auto-detects "Accepted" DOM submission    │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ 5. Freedom Window Unlocked (15–40m) + XP + Streak Awarded   │
  └─────────────────────────────────────────────────────────────┘
```

---

## 2. Target Users

1. **Self-Identified Procrastinators & Computer Science Students**:
   - Technical users who want to practice LeetCode daily but get easily distracted by social media, YouTube, or news feeds.
2. **Competitive Programmers & Discipline Builders**:
   - Developers who value daily streak retention, level progression, and structured coding reps.
3. **Interview Candidates & Bootcamp Students**:
   - Job seekers following structured study plan PDFs (e.g., NeetCode 150, Blind 75) who need strict enforcement to stick to their daily problem quotas.

---

## 3. Feature Specifications (Grouped by Area)

### A. Gatekeeper Engine & Whitelist Blocking
- **Strict Whitelist Filtering**: Default-deny model where all main-frame website navigations are intercepted during active sessions unless the domain exists in the user's whitelist.
- **Dynamic DeclarativeNetRequest (DNR)**: Programmatically manages dynamic network rules via `chrome.declarativeNetRequest` to apply performant rule-based filtering.
- **Special Domain Handling**: Allows partial YouTube access (`youtube.com/watch*`) while blocking general `youtube.com` browsing to allow watching educational video solutions.
- **Freedom Expiry Enforcement**: When freedom expires, navigation interception immediately reactivates without breaking open tabs.

### B. Submission Verification
- **Automated LeetCode Observer**: Content script injected into `https://leetcode.com/problems/*` observing React SPA DOM mutations.
- **Real-Time Detection**: Automatically catches `"Accepted"` submission badges and fires a typed message to the background service worker.
- **Wrong Problem Detection**: Detects if the user is solving an unassigned LeetCode problem and displays a dismissible warning banner with a direct link to the assigned task.

### C. Gamification & Streak Engine
- **XP Progression Formula**:
  - Solve Easy: `+10 XP`
  - Solve Medium: `+20 XP`
  - Solve Hard: `+35 XP`
  - Early Bird Bonus (before 9:00 AM): `+5 XP`
  - No-Override Bonus: `+3 XP`
  - 7+ Day Streak Bonus: `+5 XP` per solve
  - 30+ Day Streak Bonus: `+10 XP` per solve
  - Override Penalty: `-5 XP`
- **Level Tiers**:
  - Level 1: `0 - 99 XP` (Beginner)
  - Level 2: `100 - 299 XP` (Grinder)
  - Level 3: `300 - 699 XP` (Consistent)
  - Level 4: `700 - 1499 XP` (Relentless)
  - Level 5+: `1500+ XP` (Elite)
- **Streak Protection & Freeze Tokens**:
  - Streak increments daily on solve or activated freeze token.
  - Earn 1 Freeze Token per 7-day streak maintained (max 3 tokens).
  - Midnight alarm checks streak continuity; if missed without freeze, streak resets to 0 with notification.

### D. PDF Study Plan Goal Mode
- **Offline PDF Parsing Pipeline**: Uses `pdfjs-dist` to extract problem URLs, problem IDs (`#1`, `LC 217`), and fuzzy title matches directly from user-uploaded study plan PDFs.
- **Sequential Goal Queue**: When Goal Mode is active, problems are assigned sequentially from the PDF list rather than randomly.
- **Schema Validation**: Parsed goals are validated against `ProblemGoalSchema` before storing.

### E. Psychology-Driven Block UI
- **Zeigarnik Effect Blur Overlay**: Shows the first 220 characters of the assigned problem description while blurring the rest with a "Start solving →" call to action.
- **Algorithmic Hint Toggle**: Collapsible drawer giving high-level algorithmic pointers without spoiling the solution.
- **Emergency Override Tokens**: Allows up to 3 overrides per week granting 10 minutes of emergency freedom at a -5 XP penalty.

### F. Analytics & Retention
- **Local Event Logging**: Records `SOLVE`, `BLOCK`, `OVERRIDE`, `SKIP`, `SESSION_START`, `SESSION_END`, `FREEDOM_START`, and `FREEDOM_END` events.
- **90-Day Retention**: Automatically purges log entries older than 90 days.

---

## 4. Non-Goals (Out of Scope for v1)

- **Not a General Habit Tracker**: Does not track non-coding habits (e.g., reading, fitness).
- **Not Multi-Browser**: Strictly built for Chromium browsers (Chrome, Edge, Brave) using Manifest V3.
- **No Cloud Synchronization**: All state persists 100% locally in extension storage (`chrome.storage.local` and `chrome.storage.session`). No external user accounts or cloud databases in v1.
- **No External Network Calls**: All operations (including PDF parsing and problem bank fallback) run completely offline.

---

## 5. Success Criteria for v1

1. **Clean End-to-End Loop**: User starts session -> blocked sites redirect to block page -> solving assigned LeetCode problem automatically grants freedom window -> freedom timer counts down in popup.
2. **Zero Storage Desync**: State stays 100% synchronized across popup, background worker, and block tab using `@plasmohq/storage`.
3. **Type Safety & Test Coverage**: 100% typed message protocol and Zod schema validation; Vitest suite passing with >90% coverage on core logic modules.
