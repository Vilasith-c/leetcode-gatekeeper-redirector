const FREEDOM_KEY = "leetcode_freedom_until";
const ASSIGNED_PROBLEM_KEY = "leetcode_assigned_problem_slug";
const LEETCODE_URL = "https://leetcode.com/problems/";
const SELECTED_DIFFICULTY_KEY = "leetcode_selected_difficulty";

function msToTime(duration) {
  let seconds = Math.floor((duration / 1000) % 60),
      minutes = Math.floor((duration / (1000 * 60)) % 60),
      hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function showNotDone(problemSlug) {
  document.getElementById('not-done').style.display = 'block';
  document.getElementById('freedom').style.display = 'none';
  const link = document.getElementById('problem-link');

  if (problemSlug) {
    link.href = LEETCODE_URL + problemSlug + '/';
    link.textContent = problemSlug.replace(/-/g, ' ');
    link.style.pointerEvents = '';
    link.style.color = '#0095ff';
  } else {
    link.href = '#';
    link.textContent = 'Assigning problem, please wait...';
    link.style.pointerEvents = 'none';
    link.style.color = '#aaa';
  }
}

function showFreedom(freedomUntil) {
  document.getElementById('not-done').style.display = 'none';
  document.getElementById('freedom').style.display = 'block';
  const timerDiv = document.getElementById('timer');
  function updateTimer() {
    const now = Date.now();
    const diff = freedomUntil - now;
    if (diff > 0) {
      timerDiv.textContent = msToTime(diff);
      setTimeout(updateTimer, 1000);
    } else {
      timerDiv.textContent = '00:00:00';
      chrome.storage.local.remove([FREEDOM_KEY], () => {
        chrome.storage.local.get([ASSIGNED_PROBLEM_KEY], (result) => {
          showNotDone(result[ASSIGNED_PROBLEM_KEY]);
        });
      });
    }
  }
  updateTimer();
}

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get([FREEDOM_KEY, ASSIGNED_PROBLEM_KEY, SELECTED_DIFFICULTY_KEY], (result) => {
    const now = Date.now();
    if (result[FREEDOM_KEY] && result[FREEDOM_KEY] > now) {
      showFreedom(result[FREEDOM_KEY]);
    } else {
      showNotDone(result[ASSIGNED_PROBLEM_KEY]);
    }

    const savedDifficulty = result[SELECTED_DIFFICULTY_KEY] || 'Easy'; // Default to Easy
    const button = document.querySelector(`.difficulty-btn[data-difficulty="${savedDifficulty}"]`);
    if (button) {
      button.classList.add('selected');
    }
  });

  const difficultyButtons = document.querySelectorAll('.difficulty-btn');
  difficultyButtons.forEach(button => {
    button.addEventListener('click', () => {
      const difficulty = button.dataset.difficulty;
      chrome.storage.local.set({ [SELECTED_DIFFICULTY_KEY]: difficulty }, () => {
        difficultyButtons.forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
      });
    });
  });
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    if (changes[FREEDOM_KEY] || changes[ASSIGNED_PROBLEM_KEY]) {
      chrome.storage.local.get([FREEDOM_KEY, ASSIGNED_PROBLEM_KEY], (result) => {
        const now = Date.now();
        if (result[FREEDOM_KEY] && result[FREEDOM_KEY] > now) {
          showFreedom(result[FREEDOM_KEY]);
        } else {
          showNotDone(result[ASSIGNED_PROBLEM_KEY]);
        }
      });
    }
    if (changes[SELECTED_DIFFICULTY_KEY]) {
        const newDifficulty = changes[SELECTED_DIFFICULTY_KEY].newValue;
        const difficultyButtons = document.querySelectorAll('.difficulty-btn');
        difficultyButtons.forEach(btn => {
            if (btn.dataset.difficulty === newDifficulty) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
    }
  }
});