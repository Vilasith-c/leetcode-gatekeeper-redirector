// Helper: Detect submission by monitoring DOM changes
let lastAccepted = false;
const observer = new MutationObserver((mutations) => {
  // Get the current problem's slug from the URL
  const match = window.location.pathname.match(/problems\/([^\/]+)\//);
  const currentSlug = match ? match[1] : null;
  if (!currentSlug) return;

  // Check if 'Accepted' is present in the DOM
  const accepted = Array.from(document.querySelectorAll("*"))
    .some(el => el.textContent.includes("Accepted"));

  // Only trigger if 'Accepted' appears and wasn't there before
  if (accepted && !lastAccepted) {
    // Get the assigned problem slug from storage
    chrome.storage.local.get(["leetcode_assigned_problem_slug"], (result) => {
      if (result.leetcode_assigned_problem_slug === currentSlug) {
        // Notify background script only if the assigned problem is solved
        chrome.runtime.sendMessage({ type: "leetcode_submission" });
        observer.disconnect();
      }
    });
  }
  lastAccepted = accepted;
});

// Start observing the main content area
const main = document.querySelector("body");
if (main) {
  observer.observe(main, { childList: true, subtree: true });
} 