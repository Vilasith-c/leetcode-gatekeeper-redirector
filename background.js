const LEETCODE_URL = "https://leetcode.com/problems/";
const FREEDOM_KEY = "leetcode_freedom_until";
const ASSIGNED_PROBLEM_KEY = "leetcode_assigned_problem_slug";
const SOLVED_PROBLEMS_KEY = "leetcode_solved_problems";
const STREAK_KEY = "leetcode_streak";
const SELECTED_DIFFICULTY_KEY = "leetcode_selected_difficulty";
const TIMER_DURATION_KEY = "leetcode_timer_duration";

const problemCache = [
  /*// ... (your full list of problems remains here)
  { slug: "build-array-from-permutation", difficulty: "Easy" },
  { slug: "concatenation-of-array", difficulty: "Easy" },
  { slug: "running-sum-of-1d-array", difficulty: "Easy" },
  { slug: "richest-customer-wealth", difficulty: "Easy" },
  { slug: "shuffle-the-array", difficulty: "Easy" },
  { slug: "kids-with-the-greatest-number-of-candies", difficulty: "Easy" },
  { slug: "number-of-good-pairs", difficulty: "Easy" },
  { slug: "how-many-numbers-are-smaller-than-the-current-number", difficulty: "Easy" },
  { slug: "two-sum", difficulty: "Easy" },
  { slug: "contains-duplicate", difficulty: "Easy" },
  { slug: "create-target-array-in-the-given-order", difficulty: "Easy" },
  { slug: "plus-one", difficulty: "Easy" },
  { slug: "check-if-the-sentence-is-pangram", difficulty: "Easy" },
  { slug: "find-numbers-with-even-number-of-digits", difficulty: "Easy" },
  { slug: "find-the-highest-altitude", difficulty: "Easy" },
  { slug: "add-to-array-form-of-integer", difficulty: "Easy" },
  { slug: "transpose-matrix", difficulty: "Easy" },
  { slug: "maximum-average-subarray-i", difficulty: "Easy" },
  { slug: "intersection-of-two-arrays", difficulty: "Easy" },
  { slug: "kth-missing-positive-number", difficulty: "Easy" },
  { slug: "find-all-numbers-disappeared-in-an-array", difficulty: "Easy" },
  { slug: "third-maximum-number", difficulty: "Easy" },
  { slug: "minimum-common-value", difficulty: "Easy" },
  { slug: "majority-element", difficulty: "Easy" },
  { slug: "maximum-sum-with-exactly-k-elements", difficulty: "Easy" },
  { slug: "find-target-indices-after-sorting-array", difficulty: "Easy" },
  { slug: "single-number", difficulty: "Easy" },
  { slug: "intersection-of-multiple-arrays", difficulty: "Easy" },
  { slug: "find-the-difference-of-two-arrays", difficulty: "Easy" },
  { slug: "sign-of-the-product-of-an-array", difficulty: "Easy" },
  { slug: "find-the-integer-added-to-array-i", difficulty: "Easy" },
  { slug: "unique-number-of-occurrences", difficulty: "Easy" },
  { slug: "remove-element", difficulty: "Easy" },
  { slug: "apple-redistribution-into-boxes", difficulty: "Easy" },
  { slug: "find-lucky-integer-in-an-array", difficulty: "Easy" },
  { slug: "largest-positive-integer-that-exists-with-its-negative", difficulty: "Easy" },
  { slug: "missing-number", difficulty: "Easy" },
  { slug: "special-array-i", difficulty: "Easy" },
  { slug: "check-if-a-string-is-an-acronym-of-words", difficulty: "Easy" },
  { slug: "find-common-characters", difficulty: "Easy" },
  { slug: "sort-array-by-parity", difficulty: "Easy" },
  { slug: "sort-array-by-parity-ii", difficulty: "Easy" },
  { slug: "count-number-of-pairs-with-absolute-difference-k", difficulty: "Easy" },
  { slug: "flipping-an-image", difficulty: "Easy" },
  { slug: "matrix-diagonal-sum", difficulty: "Easy" },
  { slug: "height-checker", difficulty: "Easy" },
  { slug: "number-of-distinct-averages", difficulty: "Easy" },
  { slug: "minimum-number-of-moves-to-seat-everyone", difficulty: "Easy" },
  { slug: "array-partition", difficulty: "Easy" },
  { slug: "sort-the-people", difficulty: "Easy" },
  { slug: "number-of-students-unable-to-eat-lunch", difficulty: "Easy" },
  { slug: "count-pairs-that-form-a-complete-day-i", difficulty: "Easy" },
  { slug: "move-zeroes", difficulty: "Easy" },
  { slug: "final-prices-with-a-special-discount-in-a-shop", difficulty: "Easy" },
  { slug: "three-consecutive-odds", difficulty: "Easy" },
  { slug: "number-of-senior-citizens", difficulty: "Easy" },
  { slug: "make-two-arrays-equal-by-reversing-subarrays", difficulty: "Easy" },
  { slug: "binary-search", difficulty: "Easy" },
  { slug: "arranging-coins", difficulty: "Easy" },
  { slug: "search-insert-position", difficulty: "Easy" },
  { slug: "guess-number-higher-or-lower", difficulty: "Easy" },
  { slug: "valid-perfect-square", difficulty: "Easy" },
  { slug: "search-in-a-binary-search-tree", difficulty: "Easy" },
  { slug: "find-center-of-star-graph", difficulty: "Easy" }*/
   
  // BFS
  { slug: "binary-tree-level-order-traversal", difficulty: "Medium" },
  { slug: "minimum-depth-of-binary-tree", difficulty: "Easy" },
  { slug: "rotting-oranges", difficulty: "Medium" },
  { slug: "number-of-islands", difficulty: "Medium" },
  { slug: "shortest-path-in-binary-matrix", difficulty: "Medium" },
  { slug: "k-highest-ranked-items-within-a-price-range", difficulty: "Medium" },

  // DFS
  { slug: "clone-graph", difficulty: "Medium" },
  { slug: "all-paths-from-source-to-target", difficulty: "Medium" },
  { slug: "longest-increasing-path-in-a-matrix", difficulty: "Medium" },
  { slug: "number-of-islands", difficulty: "Medium" },

  // Topological Sort
  { slug: "course-schedule", difficulty: "Medium" },
  { slug: "course-schedule-ii", difficulty: "Medium" },
  { slug: "alien-dictionary", difficulty: "Hard" },

  // Single‑source shortest path: Dijkstra’s
  { slug: "network-delay-time", difficulty: "Medium" },
  { slug: "minimum-cost-to-reach-destination-in-time", difficulty: "Hard" },
  { slug: "path-with-maximum-probability", difficulty: "Medium" },
  { slug: "reachable-nodes-in-subdivided-graph", difficulty: "Medium" },
  { slug: "shortest-path-visiting-all-nodes", difficulty: "Hard" },

  // All‑pairs shortest paths (Floyd–Warshall)
  // LeetCode does not tag direct Floyd–Warshall problems, but it's implied in interview questions
  // (no specific slug here)

  // Minimum Spanning Tree: Prim’s / Kruskal’s
  { slug: "optimize-water-distribution-in-a-village", difficulty: "Medium" },
  { slug: "minimum-cost-to-connect-all-points", difficulty: "Medium" },
  { slug: "connecting-cities-with-minimum-cost", difficulty: "Medium" },

  // Additional graph traversal and validation
  { slug: "graph-valid-tree", difficulty: "Medium" },
  { slug: "number-of-connected-components-in-an-undirected-graph", difficulty: "Medium" },
  { slug: "pacific-atlantic-water-flow", difficulty: "Medium" },
  { slug: "minimum-knight-moves", difficulty: "Medium" }

];

async function getRandomProblem(difficulty = 'Easy') {
  const result = await chrome.storage.local.get([SOLVED_PROBLEMS_KEY]);
  const solvedProblems = result[SOLVED_PROBLEMS_KEY] || [];
  let availableProblems = problemCache.filter(p => !solvedProblems.includes(p.slug) && p.difficulty === difficulty);
  if (availableProblems.length === 0) {
    // If no problems of the selected difficulty are available, try to find any unsolved problem
    availableProblems = problemCache.filter(p => !solvedProblems.includes(p.slug));
  }
  if (availableProblems.length === 0) {
    await chrome.storage.local.set({ [SOLVED_PROBLEMS_KEY]: [] });
    availableProblems = problemCache.filter(p => p.difficulty === difficulty);
  }
  if (availableProblems.length === 0) {
    availableProblems = problemCache;
  }
  return availableProblems[Math.floor(Math.random() * availableProblems.length)];
}

async function assignNewProblem(difficulty = 'Easy') {
  const problem = await getRandomProblem(difficulty);
  if (problem && problem.slug) {
    await chrome.storage.local.set({ [ASSIGNED_PROBLEM_KEY]: problem.slug });
    return problem.slug; // Return the slug
  }
  return null;
}

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;
  const { tabId, url } = details;
  if (!url || (new URL(url).hostname.endsWith('leetcode.com')) || url.startsWith('chrome-extension://')) return;

  if (await hasFreedom()) return;

  let { [ASSIGNED_PROBLEM_KEY]: problemSlug, [SELECTED_DIFFICULTY_KEY]: difficulty } = await chrome.storage.local.get([ASSIGNED_PROBLEM_KEY, SELECTED_DIFFICULTY_KEY]);

  if (!problemSlug) {
    problemSlug = await assignNewProblem(difficulty);
  }

  if (problemSlug) {
    const problemUrl = `${LEETCODE_URL}${problemSlug}`;
    const blockUrl = `${chrome.runtime.getURL('block.html')}?problemUrl=${encodeURIComponent(problemUrl)}`;
    chrome.tabs.update(tabId, { url: blockUrl });
  }
}, {
  url: [{ urlMatches: 'https?://*/*' }]
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === "leetcode_submission") {
    const { [TIMER_DURATION_KEY]: duration } = await chrome.storage.local.get(TIMER_DURATION_KEY);
    const freedomDuration = (duration || 180) * 60 * 1000;
    const freedomUntil = Date.now() + freedomDuration;

    const { [STREAK_KEY]: streakData } = await chrome.storage.local.get(STREAK_KEY);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let currentStreak = 1;
    if (streakData) {
        const lastSolved = new Date(streakData.timestamp);
        const lastSolvedDate = new Date(lastSolved.getFullYear(), lastSolved.getMonth(), lastSolved.getDate());
        const diffTime = today.getTime() - lastSolvedDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            currentStreak = streakData.streak + 1;
        } else if (diffDays > 1) {
            currentStreak = 1;
        }
        else{
            currentStreak = streakData.streak;
        }
    }

    chrome.storage.local.set({
      [FREEDOM_KEY]: freedomUntil,
      [ASSIGNED_PROBLEM_KEY]: null,
      [STREAK_KEY]: { streak: currentStreak, timestamp: Date.now() }
    });

    sendResponse({ success: true });
  } else if (message.type === "generate_new_problem") {
    const newProblemSlug = await assignNewProblem(message.difficulty);
    if (newProblemSlug) {
      chrome.runtime.sendMessage({ type: 'problem_assigned', slug: newProblemSlug });
    }
  }
  return true;
});

setInterval(async () => {
  if (!(await hasFreedom())) {
    const { [ASSIGNED_PROBLEM_KEY]: assignedProblem } = await chrome.storage.local.get(ASSIGNED_PROBLEM_KEY);
    if (!assignedProblem) {
      await assignNewProblem();
    }
  }
}, 60000);