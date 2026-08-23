# Extension Development Workflow Strategy & Methods

This document outlines the architectural patterns and browser API methods used across the consolidated Chrome extension project in this workspace (`Mad_Coder` / Mad Coder Pro). For the comprehensive product vision, file structure, and step-by-step execution workflow, see [workflow.md](file:///c:/Users/18SS0/OneDrive/Desktop/Main/Programming/Extensions/workflow.md).

## Workflow Strategy

### 1. Architectural Foundation: Manifest V3 & Modular Design
The project utilizes the Chrome Extension Manifest V3 platform with a clean ES Module structure under `src/`:

- **Service Worker (`src/background/background.js`)**: Serves as the central orchestration ES Module, managing alarms, navigation interception, session state, notifications, and dynamic rule updates.
- **Content Scripts (`src/content/content.js`)**: Injected into `https://leetcode.com/problems/*` to observe submission results via `MutationObserver` and verify problem completion.
- **Action Popup (`src/popup/popup.*`)**: Modular UI providing Dashboard session controls, PDF Study Plan parser (`src/parser/pdfParser.js`), Whitelist Manager, and Analytics/Streak progress.
- **Block Page (`src/block/block.*`)**: Interactive gatekeeper view displaying assigned problem info, preview, hint toggles, and override options.

### 2. State Management & Storage Split
State persistence is split according to lifecycle requirements:

- **`chrome.storage.local`**: Persists long-term data such as streak records, XP/level progression, whitelist domain rules, and parsed PDF study plan goals.
- **`chrome.storage.session`**: Manages ephemeral runtime state (e.g., active problem slug, freedom window expiry timestamp, session block counters).

### 3. Gatekeeping Logic (Blocking & Dynamic DNR)
The gatekeeper engine operates on a strict whitelist strategy:

- **Dynamic Navigation Interception**: Uses `chrome.webNavigation.onBeforeNavigate` to redirect non-whitelisted requests to `src/block/block.html` during active sessions when freedom has expired.
- **Declarative Net Request (DNR)**: Programmatically manages dynamic rules via `chrome.declarativeNetRequest.updateDynamicRules` to apply rule-based network filtering when session is active.

### 4. Background Processes & Data Handling
- **Alarm Scheduling**: Uses `chrome.alarms` (`FREEDOM_CHECK`, `DAILY_RESET`, `STREAK_GUARD`) to handle periodic checks, daily streak calculations, and reminders without relying on short-lived background intervals.
- **Problem Bank & Offline Data**: Loads local offline problem bank (`data/problems.json`) or parses uploaded PDF study plans using bundled PDF.js (`libs/pdf.min.js`).

---

## Methods Used

### Browser API Methods

#### Navigation & Tab Control
- `chrome.webNavigation.onBeforeNavigate.addListener(...)`: Detects navigation events in real-time and intercepts unauthorized domains.
- `chrome.tabs.update(tabId, { url: ... })`: Redirects tabs to the custom block interface or assigned LeetCode problem.
- `chrome.declarativeNetRequest.updateDynamicRules(...)`: Programmatically updates active domain whitelist rules.

#### Storage & Alarms
- `chrome.storage.local.get / set`: Reads/writes persistent configuration, streak data, and goals.
- `chrome.storage.session.get / set`: Reads/writes short-lived active session state.
- `chrome.alarms.create / onAlarm`: Manages background periodic tasks safely under Manifest V3 service worker lifecycle constraints.

#### Messaging & Notifications
- `chrome.runtime.sendMessage(message)` / `chrome.tabs.sendMessage(...)`: Handles inter-component messaging across content scripts, popups, and the service worker.
- `chrome.notifications.create(...)`: Delivers OS-level alerts for freedom window updates, streak milestones, and daily reminders.

#### Resource Management
- `chrome.runtime.getURL(path)`: Formats extension-relative paths for `fetch` calls, web accessible resources, and tab redirection.
- `fetch(url)`: Asynchronously loads local JSON files (e.g., `data/problems.json`).

### Logic Patterns
- **Time-based Access Control**: Calculates freedom windows (`Date.now() + durationMs`) stored in session storage.
- **Slug-based Task Tracking**: Uses unique problem slugs to correlate user activity with assigned tasks.
- **MutationObserver Automation**: Watches DOM mutations on LeetCode submission panels to trigger state transitions automatically upon "Accepted" status.

