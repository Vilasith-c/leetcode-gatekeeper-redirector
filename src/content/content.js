// src/content/content.js

const SUCCESS_SELECTORS = [
  '[data-e2e-locator="submission-result"]',
  '.success__3Ai7',
  '[data-e2e-locator="submission-result-text"]'
];

let observer = null;
let bannerInjected = false;
let lastSolveReported = 0;

function extractSlugFromURL() {
  const match = window.location.pathname.match(/\/problems\/([^/]+)/);
  return match ? match[1] : null;
}

function checkForSuccess() {
  // Simple text check fallback, but primarily look for selectors
  const isSuccess = SUCCESS_SELECTORS.some(sel => {
      const el = document.querySelector(sel);
      return el && el.textContent.toLowerCase().includes('accepted');
  });

  if (isSuccess) {
    const now = Date.now();
    if (now - lastSolveReported < 5000) return; // debounce
    lastSolveReported = now;

    chrome.runtime.sendMessage({ 
      type: 'PROBLEM_SOLVED', 
      data: { 
        slug: extractSlugFromURL(),
        runtime: "N/A", // Scraping this perfectly is hard due to obfuscation, omitting for reliability
        memory: "N/A",
        language: "N/A"
      } 
    });
  }
}

function injectWrongProblemBanner(assignedTitle) {
  if (bannerInjected) return;
  const banner = document.createElement('div');
  banner.id = 'mad-coder-banner';
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    background: #ff4d4f;
    color: white;
    text-align: center;
    padding: 10px;
    z-index: 999999;
    font-weight: bold;
    font-family: sans-serif;
    cursor: pointer;
  `;
  banner.innerText = `⚠️ Your assigned problem is ${assignedTitle}. Solve it to unlock freedom. [Click to dismiss]`;
  banner.onclick = () => banner.remove();
  document.body.appendChild(banner);
  bannerInjected = true;
}

function init() {
  const slug = extractSlugFromURL();
  if (!slug) return;

  chrome.runtime.sendMessage({ type: 'WRONG_PROBLEM', data: { currentSlug: slug } });

  // MutationObserver for submission results
  const appRoot = document.getElementById('__next') || document.getElementById('app') || document.body;
  if (!observer && appRoot) {
    observer = new MutationObserver(() => {
      checkForSuccess();
    });
    observer.observe(appRoot, { childList: true, subtree: true });
  }
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'SHOW_WRONG_PROBLEM_BANNER') {
    injectWrongProblemBanner(msg.data.assignedTitle);
  } else if (msg.type === 'SESSION_ENDED') {
      const banner = document.getElementById('mad-coder-banner');
      if (banner) banner.remove();
  }
});

// Run init on load
init();

// Override pushState and replaceState to detect SPA navigation
const originalPushState = history.pushState;
history.pushState = function(...args) {
    originalPushState.apply(this, args);
    setTimeout(init, 500);
};

const originalReplaceState = history.replaceState;
history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    setTimeout(init, 500);
};

window.addEventListener('popstate', () => setTimeout(init, 500));
