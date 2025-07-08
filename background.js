const LEETCODE_URL = "https://leetcode.com/";
const LEETCODE_PROBLEMS_API = "https://leetcode.com/api/problems/all/";
const FREEDOM_KEY = "leetcode_freedom_until";
const ASSIGNED_PROBLEM_KEY = "leetcode_assigned_problem_slug";
let problemCache = null;

// Fetch and cache the problem list
async function getRandomProblemUrl() {
  if (!problemCache) {
    try {
      const response = await fetch(LEETCODE_PROBLEMS_API);
      const data = await response.json();
      problemCache = data.stat_status_pairs.filter(p => !p.paid_only);
    } catch (e) {
      // fallback to homepage if fetch fails
      return { url: LEETCODE_URL, slug: null };
    }
  }
  if (!problemCache || problemCache.length === 0) return { url: LEETCODE_URL, slug: null };
  const random = problemCache[Math.floor(Math.random() * problemCache.length)];
  return {
    url: LEETCODE_URL + 'problems/' + random.stat.question__title_slug + '/',
    slug: random.stat.question__title_slug
  };
}

// Check if user has freedom
async function hasFreedom() {
  return new Promise((resolve) => {
    chrome.storage.local.get([FREEDOM_KEY], (result) => {
      const now = Date.now();
      resolve(result[FREEDOM_KEY] && result[FREEDOM_KEY] > now);
    });
  });
}

// Listen for tab updates (more reliable than webNavigation)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;
  if (!tab.url || tab.url.startsWith('chrome-extension://')) return;
  if (tab.url.startsWith(LEETCODE_URL)) return;

  const freedom = await hasFreedom();
  if (!freedom) {
    const { url: randomProblemUrl, slug } = await getRandomProblemUrl();
    if (slug) {
      chrome.storage.local.set({ [ASSIGNED_PROBLEM_KEY]: slug });
    }
    const blockUrl = chrome.runtime.getURL('block.html');
    chrome.tabs.update(tabId, { url: blockUrl });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "leetcode_submission") {
    // Grant 3 hours of freedom
    const freedomUntil = Date.now() + 3 * 60 * 60 * 1000;
    chrome.storage.local.set({ [FREEDOM_KEY]: freedomUntil });
    sendResponse({ success: true });
  }
}); 