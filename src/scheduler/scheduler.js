/**
 * Scheduler Module
 * Manages streaks, XP, freezes, and daily/weekly resets.
 */

import { logEvent, purgeOldEvents } from '../analytics/analytics.js';

/**
 * Returns today's date string in YYYY-MM-DD format.
 */
export function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Returns yesterday's date string in YYYY-MM-DD format.
 */
export function getYesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Gets the timestamp for the next midnight.
 */
export function nextMidnightTimestamp() {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

/**
 * Initializes the default storage state for the scheduler.
 */
export async function initScheduler() {
  const data = await chrome.storage.local.get(['streak', 'xp', 'overrides', 'history']);
  
  const defaultStreak = {
    current: 0,
    longest: 0,
    lastSolveDate: null,
    freezeTokens: 0
  };
  
  const defaultXp = {
    total: 0,
    level: 1,
    levelName: "Beginner",
    levelThresholds: [0, 100, 300, 700, 1500]
  };
  
  const defaultOverrides = {
    usedThisWeek: 0,
    weekResetDate: getWeekResetDate(),
    totalAllTime: 0
  };
  
  const updates = {};
  if (!data.streak) updates.streak = defaultStreak;
  if (!data.xp) updates.xp = defaultXp;
  if (!data.overrides) updates.overrides = defaultOverrides;
  if (!data.history) updates.history = {};
  
  if (Object.keys(updates).length > 0) {
    await chrome.storage.local.set(updates);
  }
}

function getWeekResetDate() {
  const d = new Date();
  const day = d.getDay() || 7; // Get current day number, converting Sun(0) to 7
  d.setDate(d.getDate() - day + 1); // Get Monday of current week
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Perform daily reset and streak checks.
 */
export async function performDailyReset(pushNotification) {
  const today = getTodayString();
  const yesterday = getYesterdayString();
  const data = await chrome.storage.local.get(['streak', 'history', 'overrides']);
  
  let streak = data.streak;
  let history = data.history || {};
  let overrides = data.overrides;
  
  const solvedYesterday = history[yesterday]?.solved > 0;
  const freezeUsedYesterday = history[yesterday]?.freezeUsed === true;
  
  if (solvedYesterday || freezeUsedYesterday) {
    if (solvedYesterday && streak.lastSolveDate !== today) {
        // Handled in solve processing to be accurate, but if missed we can update here.
    }
  } else {
    // Streak broken
    if (streak.current >= 3 && pushNotification) {
      pushNotification("💔 Streak of " + streak.current + " days broken. Start again today.");
    }
    streak.current = 0;
  }
  
  // Ensure today exists in history
  if (!history[today]) {
    history[today] = { solved: 0, blocked: 0, overridesUsed: 0, totalFreedomEarned: 0 };
  }
  
  // Weekly reset check for overrides
  const currentWeekReset = getWeekResetDate();
  if (overrides.weekResetDate !== currentWeekReset) {
    overrides.usedThisWeek = 0;
    overrides.weekResetDate = currentWeekReset;
  }
  
  // Cleanup old analytics
  await purgeOldEvents();
  
  // Schedule next reset
  chrome.alarms.create('DAILY_RESET', { when: nextMidnightTimestamp() });
  
  await chrome.storage.local.set({ streak, history, overrides });
}

export async function addXP(amount, pushNotification) {
  const data = await chrome.storage.local.get('xp');
  let xp = data.xp;
  xp.total += amount;
  
  let nextLevelIdx = xp.levelThresholds.findIndex(t => xp.total < t);
  if (nextLevelIdx === -1) nextLevelIdx = xp.levelThresholds.length;
  
  const newLevel = nextLevelIdx;
  if (newLevel > xp.level) {
    xp.level = newLevel;
    const names = ["Beginner", "Grinder", "Consistent", "Relentless", "Elite"];
    xp.levelName = names[Math.min(newLevel - 1, names.length - 1)];
    if (pushNotification) {
        pushNotification(`⬆️ Level up! You are now: ${xp.levelName}.`);
    }
  }
  
  await chrome.storage.local.set({ xp });
}

export async function processSolve(difficulty, usedOverride, solveTimeMs, pushNotification) {
  const today = getTodayString();
  const data = await chrome.storage.local.get(['streak', 'history']);
  let streak = data.streak;
  let history = data.history;
  
  if (!history[today]) {
    history[today] = { solved: 0, blocked: 0, overridesUsed: 0, totalFreedomEarned: 0 };
  }
  
  // XP Calculation
  let xpEarned = 0;
  if (difficulty === 'Easy') xpEarned = 10;
  else if (difficulty === 'Medium') xpEarned = 20;
  else if (difficulty === 'Hard') xpEarned = 35;
  else xpEarned = 10;
  
  const hour = new Date().getHours();
  if (hour < 9) xpEarned += 5;
  if (!usedOverride) xpEarned += 3;
  if (streak.current >= 30) xpEarned += 10;
  else if (streak.current >= 7) xpEarned += 5;
  
  await addXP(xpEarned, pushNotification);
  
  // Streak update if it's the first solve today
  if (streak.lastSolveDate !== today) {
    streak.current += 1;
    streak.longest = Math.max(streak.longest, streak.current);
    streak.lastSolveDate = today;
    
    if (streak.current % 7 === 0 && streak.freezeTokens < 3) {
      streak.freezeTokens += 1;
      if (pushNotification) pushNotification(`🧊 Freeze token earned! You have ${streak.freezeTokens} tokens.`);
    } else if (streak.current > 0 && streak.current % 10 === 0) {
      if (pushNotification) pushNotification(`🏆 ${streak.current}-day streak! You're building a real habit.`);
    }
  }
  
  history[today].solved += 1;
  
  await chrome.storage.local.set({ streak, history });
  
  return xpEarned;
}

export async function useFreezeToken() {
  const data = await chrome.storage.local.get(['streak', 'history']);
  let streak = data.streak;
  let history = data.history;
  const today = getTodayString();
  
  if (streak.freezeTokens > 0) {
    streak.freezeTokens -= 1;
    if (!history[today]) {
      history[today] = { solved: 0, blocked: 0, overridesUsed: 0, totalFreedomEarned: 0 };
    }
    history[today].freezeUsed = true;
    await chrome.storage.local.set({ streak, history });
    return true;
  }
  return false;
}
