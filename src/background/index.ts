import { rebuildDNRRules } from "../services/dnr";
import { getTodayString, getYesterdayString, nextMidnightTimestamp } from "../services/scheduler";
import { getLocalState, getSessionState, setLocalState, setSessionState } from "../storage";
import { logAnalyticsEvent } from "../services/analytics";

function isDomainAllowed(url: string, whitelist: Array<{ domain: string }>): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, "");

    // Special YouTube logic: allow watch URLs
    if (hostname === "youtube.com" && parsed.pathname.startsWith("/watch")) {
      return true;
    }

    return whitelist.some((entry) => {
      const pattern = entry.domain.replace(/^www\./, "");
      if (pattern.startsWith("*.")) {
        return hostname.endsWith(pattern.slice(2));
      }
      return hostname === pattern || hostname.endsWith("." + pattern);
    });
  } catch (e) {
    return false;
  }
}

// Extension Install Setup
chrome.runtime.onInstalled.addListener(async () => {
  const local = await getLocalState();
  const session = await getSessionState();

  if (session.sessionActive) {
    await rebuildDNRRules(local.whitelist, true);
  }

  chrome.alarms.create("FREEDOM_CHECK", { periodInMinutes: 0.5 });
  chrome.alarms.create("DAILY_RESET", { when: nextMidnightTimestamp() });
  chrome.alarms.create("STREAK_GUARD", { periodInMinutes: 60 });
});

// Alarm Handler
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "FREEDOM_CHECK") {
    const session = await getSessionState();
    if (session.freedomExpiresAt > 0) {
      if (Date.now() >= session.freedomExpiresAt) {
        await setSessionState({ freedomExpiresAt: 0, freedomEarnedMinutes: 0 });
        chrome.action.setBadgeText({ text: "🔒" });
        chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
        chrome.notifications.create({
          type: "basic",
          iconUrl: chrome.runtime.getURL("icons/icon128.png"),
          title: "Mad Coder Pro",
          message: "🔒 Freedom window ended. Solve another problem to continue."
        });
        await logAnalyticsEvent("FREEDOM_END", { expired: true });
      } else {
        const minsLeft = Math.ceil((session.freedomExpiresAt - Date.now()) / 60000);
        chrome.action.setBadgeText({ text: `${minsLeft}m` });
        chrome.action.setBadgeBackgroundColor({ color: "#10B981" });
      }
    } else if (session.sessionActive) {
      chrome.action.setBadgeText({ text: "🔒" });
      chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
    } else {
      chrome.action.setBadgeText({ text: "" });
    }
  } else if (alarm.name === "DAILY_RESET") {
    const local = await getLocalState();
    const today = getTodayString();
    const yesterday = getYesterdayString();

    const yesterdayStats = local.history[yesterday];
    const solvedYesterday = (yesterdayStats?.solved || 0) > 0;
    const freezeUsedYesterday = yesterdayStats?.freezeUsed === true;

    let newCurrentStreak = local.streak.current;
    if (solvedYesterday || freezeUsedYesterday) {
      // Streak continues
      if (newCurrentStreak % 7 === 0 && local.streak.freezeTokens < 3) {
        await setLocalState({
          streak: { ...local.streak, freezeTokens: local.streak.freezeTokens + 1 }
        });
        chrome.notifications.create({
          type: "basic",
          iconUrl: chrome.runtime.getURL("icons/icon128.png"),
          title: "Mad Coder Pro",
          message: `🧊 Freeze token earned! You have ${local.streak.freezeTokens + 1} tokens.`
        });
      }
    } else {
      // Streak broken
      if (newCurrentStreak >= 3) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: chrome.runtime.getURL("icons/icon128.png"),
          title: "Mad Coder Pro",
          message: `💔 Streak of ${newCurrentStreak} days broken. Start fresh today!`
        });
      }
      newCurrentStreak = 0;
    }

    const newHistory = {
      ...local.history,
      [today]: { solved: 0, blocked: 0, overridesUsed: 0, freezeUsed: false, totalFreedomEarned: 0 }
    };

    await setLocalState({
      streak: { ...local.streak, current: newCurrentStreak },
      history: newHistory
    });

    chrome.alarms.create("DAILY_RESET", { when: nextMidnightTimestamp() });
  } else if (alarm.name === "STREAK_GUARD") {
    const d = new Date();
    if (d.getHours() >= 23) {
      const today = getTodayString();
      const local = await getLocalState();
      if (!local.history[today]?.solved && local.streak.current > 0) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: chrome.runtime.getURL("icons/icon128.png"),
          title: "Mad Coder Pro",
          message: `⚠️ Your ${local.streak.current}-day streak ends at midnight. Solve now!`
        });
      }
    }
  }
});

// Navigation Interception (Gatekeeper Blocker)
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;
  if (details.url.startsWith("chrome-extension://") || details.url.startsWith("chrome://")) return;

  const session = await getSessionState();
  if (!session.sessionActive) return;

  const urlObj = new URL(details.url);
  if (urlObj.hostname.includes("leetcode.com")) return; // LeetCode is allowed

  const local = await getLocalState();
  if (isDomainAllowed(details.url, local.whitelist)) return;

  // Check Freedom window
  if (session.freedomExpiresAt > Date.now()) return;

  // Increment blocked count
  await setSessionState({ blockCountThisSession: session.blockCountThisSession + 1 });
  await logAnalyticsEvent("BLOCK", {
    attemptedURL: details.url,
    domain: urlObj.hostname,
    reason: "solve_first"
  });

  const blockPageUrl = chrome.runtime.getURL(
    `tabs/block.html?blocked=${encodeURIComponent(details.url)}&problem=${session.currentProblemSlug}&title=${encodeURIComponent(session.currentProblemTitle)}&difficulty=${session.currentProblemDifficulty}&preview=${encodeURIComponent(session.currentProblemPreview)}`
  );

  chrome.tabs.update(details.tabId, { url: blockPageUrl });
});
