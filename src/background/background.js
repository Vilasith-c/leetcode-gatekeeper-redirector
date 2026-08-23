import { initAnalytics, logEvent } from '../analytics/analytics.js';
import { initScheduler, performDailyReset, processSolve, getTodayString, useFreezeToken, nextMidnightTimestamp } from '../scheduler/scheduler.js';

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
  "cs.usfca.edu",
  "bigocheatsheet.com",
  "neetcode.io",
  "youtube.com/watch*"
];

function pushNotification(message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: '../../icons/icon128.png',
    title: 'Mad Coder Pro',
    message: message
  });
}

// Ensure session state has defaults
async function getSession() {
  const state = await chrome.storage.session.get(null);
  return {
    sessionActive: state.sessionActive || false,
    currentProblemSlug: state.currentProblemSlug || '',
    currentProblemTitle: state.currentProblemTitle || '',
    currentProblemDifficulty: state.currentProblemDifficulty || '',
    currentProblemTags: state.currentProblemTags || [],
    freedomExpiresAt: state.freedomExpiresAt || 0,
    freedomEarnedMinutes: state.freedomEarnedMinutes || 0,
    solvedThisSession: state.solvedThisSession || 0,
    blockCountThisSession: state.blockCountThisSession || 0,
    sessionStartedAt: state.sessionStartedAt || 0,
    currentProblemPreview: state.currentProblemPreview || ''
  };
}

async function setSession(data) {
  await chrome.storage.session.set(data);
}

// Initial setup
chrome.runtime.onInstalled.addListener(async () => {
  await initAnalytics();
  await initScheduler();
  const data = await chrome.storage.local.get('whitelist');
  if (!data.whitelist) {
    const whitelist = DEFAULT_WHITELIST.map((domain, i) => ({
      id: `default-${i}`,
      domain,
      addedAt: Date.now(),
      label: domain
    }));
    await chrome.storage.local.set({ whitelist });
  }
  
  chrome.alarms.create('FREEDOM_CHECK', { periodInMinutes: 0.5 });
  chrome.alarms.create('DAILY_RESET', { when: nextMidnightTimestamp() });
  chrome.alarms.create('STREAK_GUARD', { periodInMinutes: 60 });
});

// Alarm handling
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'FREEDOM_CHECK') {
    const session = await getSession();
    if (session.freedomExpiresAt > 0) {
      if (Date.now() >= session.freedomExpiresAt) {
        // Freedom expired
        await setSession({ freedomExpiresAt: 0, freedomEarnedMinutes: 0 });
        chrome.action.setBadgeText({ text: '🔒' });
        chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
        pushNotification("🔒 Freedom window ended. Solve another to continue.");
        await logEvent('FREEDOM_END', { expired: true });
      } else {
        // Update badge
        const minsLeft = Math.ceil((session.freedomExpiresAt - Date.now()) / 60000);
        chrome.action.setBadgeText({ text: `${minsLeft}m` });
        chrome.action.setBadgeBackgroundColor({ color: '#00FF00' });
        if (minsLeft === 5) {
          pushNotification(`⏱️ 5 minutes of freedom left.`);
        }
      }
    } else if (session.sessionActive) {
        chrome.action.setBadgeText({ text: '🔒' });
        chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
    } else {
        chrome.action.setBadgeText({ text: '' });
    }
  } else if (alarm.name === 'DAILY_RESET') {
    await performDailyReset(pushNotification);
  } else if (alarm.name === 'STREAK_GUARD') {
    const d = new Date();
    if (d.getHours() >= 23) {
      const today = getTodayString();
      const historyData = await chrome.storage.local.get('history');
      if (!historyData.history?.[today]?.solved) {
        const streakData = await chrome.storage.local.get('streak');
        if (streakData.streak?.current > 0) {
          pushNotification(`⚠️ Your ${streakData.streak.current}-day streak ends at midnight. Solve now!`);
        }
      }
    }
  }
});

function isDomainAllowed(url, whitelist) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, '');
    
    // Special YouTube logic
    if (hostname === 'youtube.com' && parsed.pathname.startsWith('/watch')) {
       return true;
    }
    
    return whitelist.some(entry => {
      const pattern = entry.domain.replace(/^www\./, '');
      if (pattern.startsWith('*.')) {
        return hostname.endsWith(pattern.slice(2));
      }
      return hostname === pattern || hostname.endsWith('.' + pattern);
    });
  } catch (e) {
    return false;
  }
}

// Blocking Logic
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return; // Only block main frame
  if (details.url.startsWith('chrome-extension://')) return;
  if (details.url.startsWith('chrome://')) return;

  const session = await getSession();
  if (!session.sessionActive) return;

  const urlObj = new URL(details.url);
  if (urlObj.hostname.includes('leetcode.com')) return; // Allowed

  const data = await chrome.storage.local.get('whitelist');
  const whitelist = data.whitelist || [];

  if (isDomainAllowed(details.url, whitelist)) {
    return;
  }

  // Check Freedom
  if (session.freedomExpiresAt > Date.now()) {
    return; // Free to browse
  }

  // Redirect to Block Page
  const blockedUrl = encodeURIComponent(details.url);
  const blockUrl = chrome.runtime.getURL(`src/block/block.html?blocked=${blockedUrl}&problem=${session.currentProblemSlug}&title=${encodeURIComponent(session.currentProblemTitle)}&difficulty=${session.currentProblemDifficulty}&preview=${encodeURIComponent(session.currentProblemPreview || '')}&reason=solve_first`);
  
  session.blockCountThisSession += 1;
  await setSession(session);
  await logEvent('BLOCK', { attemptedURL: details.url, domain: urlObj.hostname, reason: 'solve_first', sessionDuration: Date.now() - session.sessionStartedAt });

  chrome.tabs.update(details.tabId, { url: blockUrl });
});

// Declarative Net Request rebuilding
export async function rebuildDNRRules(whitelist, sessionActive) {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeIds = existing.map(r => r.id);

  if (!sessionActive) {
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: removeIds, addRules: [] });
    return;
  }

  const allowRules = whitelist.map((entry, i) => ({
    id: i + 1,
    priority: 2,
    action: { type: "allow" },
    condition: { 
      requestDomains: [entry.domain.replace(/^\*\./, '').split('/')[0]], // DNR needs just domain
      resourceTypes: ["main_frame", "sub_frame"]
    }
  }));

  // Add YouTube specific allow rule if not naturally covered
  allowRules.push({
      id: 9998,
      priority: 2,
      action: { type: "allow" },
      condition: {
          urlFilter: "||youtube.com/watch*",
          resourceTypes: ["main_frame", "sub_frame"]
      }
  });

  const blockAllRule = {
    id: 9999,
    priority: 1,
    action: { type: "block" },
    condition: {
      urlFilter: "*",
      resourceTypes: ["main_frame"]
    }
  };

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: removeIds,
    addRules: [...allowRules, blockAllRule]
  });
}

// Problem Assignment
async function assignNextProblem() {
  const localData = await chrome.storage.local.get(['useGoalMode', 'pdfGoals', 'goalIndex', 'history']);
  const isGoalMode = localData.useGoalMode;
  let nextProblem = null;

  if (isGoalMode && localData.pdfGoals?.length > 0) {
    let index = localData.goalIndex || 0;
    if (index >= localData.pdfGoals.length) {
      pushNotification("🎉 All PDF goals completed! Switching to random mode.");
      await chrome.storage.local.set({ useGoalMode: false });
      return assignNextProblem(); // Recurse
    }
    nextProblem = localData.pdfGoals[index];
    await chrome.storage.local.set({ goalIndex: index + 1 });
  } else {
    // Random mode from fallback bank
    const res = await fetch(chrome.runtime.getURL('data/problems.json'));
    const problems = await res.json();
    
    // Weight Easy 50%, Medium 50%
    const isEasy = Math.random() > 0.5;
    const diffTarget = isEasy ? 'Easy' : 'Medium';
    const filtered = problems.filter(p => p.difficulty === diffTarget);
    
    if (filtered.length > 0) {
      nextProblem = filtered[Math.floor(Math.random() * filtered.length)];
    } else {
      nextProblem = problems[Math.floor(Math.random() * problems.length)];
    }
  }

  if (nextProblem) {
    await setSession({
      currentProblemSlug: nextProblem.slug,
      currentProblemTitle: nextProblem.title,
      currentProblemDifficulty: nextProblem.difficulty,
      currentProblemTags: nextProblem.tags || [],
      currentProblemPreview: nextProblem.preview || ''
    });
  }
}

// Message passing
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg.type === 'START_SESSION') {
      await setSession({
        sessionActive: true,
        sessionStartedAt: Date.now(),
        solvedThisSession: 0,
        blockCountThisSession: 0,
        freedomExpiresAt: 0
      });
      await assignNextProblem();
      const session = await getSession();
      const localData = await chrome.storage.local.get('whitelist');
      await rebuildDNRRules(localData.whitelist || [], true);
      await logEvent('SESSION_START', { problemSlug: session.currentProblemSlug, problemTitle: session.currentProblemTitle });
      chrome.action.setBadgeText({ text: '🔒' });
      chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
      sendResponse({ success: true, session });
    }
    
    else if (msg.type === 'END_SESSION') {
      const session = await getSession();
      await logEvent('SESSION_END', { duration: Date.now() - session.sessionStartedAt, solvedCount: session.solvedThisSession, blockCount: session.blockCountThisSession });
      await setSession({ sessionActive: false });
      await rebuildDNRRules([], false);
      chrome.action.setBadgeText({ text: '' });
      
      // Notify content scripts
      const tabs = await chrome.tabs.query({ url: "*://leetcode.com/*" });
      tabs.forEach(t => chrome.tabs.sendMessage(t.id, { type: 'SESSION_ENDED' }).catch(()=>{}));
      
      sendResponse({ success: true });
    }
    
    else if (msg.type === 'PROBLEM_SOLVED') {
      const session = await getSession();
      if (session.currentProblemSlug === msg.data.slug) {
        // Calculate freedom
        let freedomMinutes = session.currentProblemDifficulty === 'Medium' ? 25 : 15;
        if (session.currentProblemDifficulty === 'Hard') freedomMinutes = 40; // Bonus
        
        session.freedomExpiresAt = Date.now() + (freedomMinutes * 60000);
        session.freedomEarnedMinutes = freedomMinutes;
        session.solvedThisSession += 1;
        await setSession(session);
        
        const xpEarned = await processSolve(session.currentProblemDifficulty, false, 0, pushNotification);
        
        await logEvent('SOLVE', { 
            slug: msg.data.slug, title: session.currentProblemTitle, difficulty: session.currentProblemDifficulty,
            freedomEarned: freedomMinutes, xpEarned: xpEarned
        });
        await logEvent('FREEDOM_START', { durationMs: freedomMinutes * 60000, earnedBy: msg.data.slug });
        
        pushNotification(`✅ "${session.currentProblemTitle}" solved! You earned ${freedomMinutes} minutes.`);
        
        // Auto-assign next problem
        await assignNextProblem();
        sendResponse({ success: true, freedomMinutes });
      } else {
        sendResponse({ success: false, reason: 'wrong_problem' });
      }
    }
    
    else if (msg.type === 'WRONG_PROBLEM') {
      const session = await getSession();
      chrome.tabs.sendMessage(sender.tab.id, { 
        type: 'SHOW_WRONG_PROBLEM_BANNER', 
        data: { assignedSlug: session.currentProblemSlug, assignedTitle: session.currentProblemTitle } 
      });
      sendResponse({ success: true });
    }

    else if (msg.type === 'SKIP_PROBLEM') {
       // Should deduct XP
       await logEvent('SKIP', { slug: (await getSession()).currentProblemSlug, xpPenalty: 5, reason: 'user_skip' });
       await assignNextProblem();
       sendResponse({ success: true });
    }

    else if (msg.type === 'GET_STATE') {
      const session = await getSession();
      const local = await chrome.storage.local.get(null);
      sendResponse({ session, local });
    }

    else if (msg.type === 'UPDATE_WHITELIST') {
      await chrome.storage.local.set({ whitelist: msg.data.whitelist });
      const session = await getSession();
      if (session.sessionActive) {
          await rebuildDNRRules(msg.data.whitelist, true);
      }
      sendResponse({ success: true });
    }

    else if (msg.type === 'USE_OVERRIDE') {
        const local = await chrome.storage.local.get('overrides');
        let overrides = local.overrides;
        if (overrides.usedThisWeek < 3) {
            overrides.usedThisWeek += 1;
            overrides.totalAllTime += 1;
            await chrome.storage.local.set({ overrides });
            
            const session = await getSession();
            session.freedomExpiresAt = Date.now() + (10 * 60000); // 10 mins freedom
            await setSession(session);
            
            await logEvent('OVERRIDE', { reason: 'user_requested', freedomGranted: 600000 });
            pushNotification(`🚨 Override used. ${3 - overrides.usedThisWeek} remaining this week.`);
            sendResponse({ success: true, remaining: 3 - overrides.usedThisWeek });
        } else {
            sendResponse({ success: false });
        }
    }
    
    else if (msg.type === 'SET_GOAL_MODE') {
        await chrome.storage.local.set({
            pdfGoals: msg.data.goals,
            pdfGoalsMeta: msg.data.meta,
            useGoalMode: true,
            goalIndex: 0
        });
        sendResponse({ success: true });
    }
    
    else if (msg.type === 'CLEAR_GOAL_MODE') {
        await chrome.storage.local.set({ useGoalMode: false, pdfGoals: [], pdfGoalsMeta: null });
        sendResponse({ success: true });
    }

  })().catch(err => console.error(err));
  return true;
});
