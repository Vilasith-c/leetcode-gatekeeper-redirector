const FREEDOM_KEY = "leetcode_freedom_until";
const ASSIGNED_PROBLEM_KEY = "leetcode_assigned_problem_slug";
const LEETCODE_URL = "https://leetcode.com/problems/";

function msToTime(duration) {
  let seconds = Math.floor((duration / 1000) % 60),
      minutes = Math.floor((duration / (1000 * 60)) % 60),
      hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function showNotDone(problemSlug) {
  document.getElementById('not-done').style.display = '';
  document.getElementById('freedom').style.display = 'none';
  document.getElementById('goto-problem').onclick = () => {
    window.location.href = LEETCODE_URL + problemSlug + '/';
  };
}

function showFreedom(freedomUntil) {
  document.getElementById('not-done').style.display = 'none';
  document.getElementById('freedom').style.display = '';
  const timerDiv = document.getElementById('timer');
  function updateTimer() {
    const now = Date.now();
    const diff = freedomUntil - now;
    if (diff > 0) {
      timerDiv.textContent = msToTime(diff);
      setTimeout(updateTimer, 1000);
    } else {
      // Timer expired, switch to not-done UI
      timerDiv.textContent = '02:59:00';
      chrome.storage.local.remove([FREEDOM_KEY], () => {
        chrome.storage.local.get([ASSIGNED_PROBLEM_KEY], (result) => {
          showNotDone(result[ASSIGNED_PROBLEM_KEY]);
        });
      });
    }
  }
  updateTimer();
}

chrome.storage.local.get([FREEDOM_KEY, ASSIGNED_PROBLEM_KEY], (result) => {
  const now = Date.now();
  if (result[FREEDOM_KEY] && result[FREEDOM_KEY] > now) {
    showFreedom(result[FREEDOM_KEY]);
  } else {
    showNotDone(result[ASSIGNED_PROBLEM_KEY]);
  }
}); 