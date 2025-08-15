console.log("LeetCode Gatekeeper: Content script active.");

const observer = new MutationObserver((mutations, obs) => {
  // Selectors for the "Accepted" message. LeetCode often uses one of these.
  const successNodes = document.querySelectorAll('[data-e2e-locator="submission-result"], .text-green-s');
  let isAccepted = false;

  for (const node of successNodes) {
    if (node.innerText.trim() === "Accepted") {
      isAccepted = true;
      break;
    }
  }

  // If an "Accepted" solution is found on the page
  if (isAccepted) {
    console.log("LeetCode Gatekeeper: 'Accepted' status detected.");
    
    // Stop observing immediately to prevent sending multiple messages
    obs.disconnect();

    const match = window.location.pathname.match(/problems\/([^\/]+)\//);
    const currentSlug = match ? match[1] : null;

    if (!currentSlug) {
      console.error("LeetCode Gatekeeper: Could not find problem slug in the URL.");
      return;
    }

    // Check if the solved problem is the one that was assigned
    chrome.storage.local.get("leetcode_assigned_problem_slug", (result) => {
      const assignedSlug = result.leetcode_assigned_problem_slug;
      console.log(`LeetCode Gatekeeper: Current slug: ${currentSlug}, Assigned slug: ${assignedSlug}`);

      if (assignedSlug === currentSlug) {
        console.log("LeetCode Gatekeeper: Correct problem solved! Unlocking Browse.");
        // Notify the background script to start the freedom timer
        chrome.runtime.sendMessage({ type: "leetcode_submission" });
      } else {
        console.log("LeetCode Gatekeeper: A problem was solved, but it wasn't the assigned one. Re-enabling observer.");
        // If the wrong problem was solved, start observing again for another submission.
        obs.observe(document.body, { childList: true, subtree: true });
      }
    });
  }
});

// Start observing the page for changes
observer.observe(document.body, { childList: true, subtree: true });