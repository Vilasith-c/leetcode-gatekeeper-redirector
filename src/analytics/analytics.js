/**
 * Analytics Module
 * Handles event logging and derived statistics.
 */

const STORAGE_KEY = 'analyticsLog';
const RETENTION_DAYS = 90;

/**
 * Initializes the analytics storage if empty.
 */
export async function initAnalytics() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  if (!data[STORAGE_KEY]) {
    await chrome.storage.local.set({ [STORAGE_KEY]: [] });
  }
}

/**
 * Logs an event to the analytics history.
 * @param {string} type - Event type (SOLVE, BLOCK, OVERRIDE, etc.)
 * @param {object} payload - Event specific data
 */
export async function logEvent(type, payload = {}) {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const log = data[STORAGE_KEY] || [];
  
  log.push({
    type,
    timestamp: Date.now(),
    data: payload
  });
  
  await chrome.storage.local.set({ [STORAGE_KEY]: log });
}

/**
 * Purges events older than the retention period.
 */
export async function purgeOldEvents() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const log = data[STORAGE_KEY] || [];
  
  const cutoff = Date.now() - (RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const filteredLog = log.filter(event => event.timestamp >= cutoff);
  
  await chrome.storage.local.set({ [STORAGE_KEY]: filteredLog });
}

/**
 * Gets derived statistics from the analytics log.
 * @returns {object} Derived stats
 */
export async function getDerivedStats() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const log = data[STORAGE_KEY] || [];
  
  const solveEvents = log.filter(e => e.type === 'SOLVE');
  const blockEvents = log.filter(e => e.type === 'BLOCK');
  const overrideEvents = log.filter(e => e.type === 'OVERRIDE');
  const freedomStartEvents = log.filter(e => e.type === 'FREEDOM_START');
  
  // Avg solve time per difficulty
  const solveTimes = { Easy: [], Medium: [], Hard: [] };
  solveEvents.forEach(e => {
    if (e.data.difficulty && e.data.solveTimeMs) {
      solveTimes[e.data.difficulty].push(e.data.solveTimeMs);
    }
  });
  
  const avgSolveTime = {
    Easy: solveTimes.Easy.length ? solveTimes.Easy.reduce((a, b) => a + b, 0) / solveTimes.Easy.length : 0,
    Medium: solveTimes.Medium.length ? solveTimes.Medium.reduce((a, b) => a + b, 0) / solveTimes.Medium.length : 0,
    Hard: solveTimes.Hard.length ? solveTimes.Hard.reduce((a, b) => a + b, 0) / solveTimes.Hard.length : 0,
  };
  
  // Most blocked domain (used as proxy for topic)
  const blockedDomains = {};
  blockEvents.forEach(e => {
    if (e.data.domain) {
      blockedDomains[e.data.domain] = (blockedDomains[e.data.domain] || 0) + 1;
    }
  });
  const mostBlockedDomain = Object.entries(blockedDomains).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
  
  // Total freedom earned/used proxy
  const totalFreedomEarned = freedomStartEvents.reduce((acc, e) => acc + (e.data.durationMs || 0), 0) / 60000;
  
  return {
    avgSolveTime,
    mostBlockedDomain,
    totalFreedomEarned,
    totalSolves: solveEvents.length,
    totalOverrides: overrideEvents.length
  };
}
