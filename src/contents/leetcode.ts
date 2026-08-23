import type { PlasmoCSConfig } from "plasmo";
import { sendToBackground } from "@plasmohq/messaging";

export const config: PlasmoCSConfig = {
  matches: ["https://leetcode.com/problems/*"],
  run_at: "document_idle"
};

const SUCCESS_SELECTORS = [
  '[data-e2e-locator="submission-result"]',
  '.success__3Ai7',
  '[data-e2e-locator="submission-result-text"]'
];

let observer: MutationObserver | null = null;
let bannerInjected = false;
let lastSolveReported = 0;

function extractSlugFromURL(): string | null {
  const match = window.location.pathname.match(/\/problems\/([^/]+)/);
  return match ? match[1] : null;
}

function checkForSuccess() {
  const isSuccess = SUCCESS_SELECTORS.some((sel) => {
    const el = document.querySelector(sel);
    return el && el.textContent?.toLowerCase().includes("accepted");
  });

  if (isSuccess) {
    const now = Date.now();
    if (now - lastSolveReported < 5000) return; // Debounce
    lastSolveReported = now;

    const slug = extractSlugFromURL();
    if (slug) {
      sendToBackground({
        name: "PROBLEM_SOLVED",
        body: { slug, runtime: "N/A", memory: "N/A", language: "N/A" }
      });
    }
  }
}

function injectWrongProblemBanner(assignedTitle: string) {
  if (bannerInjected || document.getElementById("mad-coder-banner")) return;
  const banner = document.createElement("div");
  banner.id = "mad-coder-banner";
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    background: #f43f5e;
    color: white;
    text-align: center;
    padding: 10px;
    z-index: 999999;
    font-weight: bold;
    font-family: sans-serif;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  banner.innerText = `⚠️ Your assigned problem is "${assignedTitle}". Solve it to unlock freedom. [Click to dismiss]`;
  banner.onclick = () => banner.remove();
  document.body.appendChild(banner);
  bannerInjected = true;
}

async function init() {
  const slug = extractSlugFromURL();
  if (!slug) return;

  try {
    const res = await sendToBackground<{ currentSlug: string }, { success: boolean; assignedSlug: string; assignedTitle: string }>({
      name: "WRONG_PROBLEM",
      body: { currentSlug: slug }
    });

    if (res && res.assignedSlug && res.assignedSlug !== slug) {
      injectWrongProblemBanner(res.assignedTitle || res.assignedSlug);
    }
  } catch (err) {
    // Ignore context error if extension reloaded
  }

  const appRoot = document.getElementById("__next") || document.getElementById("app") || document.body;
  if (!observer && appRoot) {
    observer = new MutationObserver(() => {
      checkForSuccess();
    });
    observer.observe(appRoot, { childList: true, subtree: true });
  }
}

// Attach SPA navigation hooks
const originalPushState = history.pushState;
history.pushState = function (...args) {
  originalPushState.apply(this, args);
  setTimeout(init, 500);
};

const originalReplaceState = history.replaceState;
history.replaceState = function (...args) {
  originalReplaceState.apply(this, args);
  setTimeout(init, 500);
};

window.addEventListener("popstate", () => setTimeout(init, 500));

init();
