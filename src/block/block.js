const IDENTITIES = [
    "Consistent coders solve first.",
    "You are building a daily practice. This is part of that practice.",
    "One problem. Then freedom.",
    "The best developers you admire did the reps."
];

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    
    const blockedUrl = params.get('blocked');
    const slug = params.get('problem');
    const title = params.get('title') || 'LeetCode Problem';
    const difficulty = params.get('difficulty') || 'Medium';
    let preview = params.get('preview') || '';
    
    if (preview.length > 250) {
        preview = preview.substring(0, 250) + "...";
    }

    if (!slug) {
        document.getElementById('problemPreview').innerText = "Start a session from the extension popup to get assigned a problem.";
        document.getElementById('solveBtn').style.display = 'none';
        document.getElementById('hintToggle').style.display = 'none';
        return;
    }

    // Populate UI
    document.getElementById('problemTitle').innerText = title;
    
    const diffBadge = document.getElementById('difficultyBadge');
    diffBadge.innerText = difficulty;
    diffBadge.className = `badge ${difficulty.toLowerCase()}`;
    
    document.getElementById('problemPreview').innerText = preview;
    
    try {
        const urlObj = new URL(blockedUrl);
        document.getElementById('blockedDomain').innerText = urlObj.hostname;
        
        if (urlObj.hostname.includes('youtube.com')) {
            const ytWarning = document.createElement('div');
            ytWarning.className = 'youtube-warning';
            ytWarning.innerText = "YouTube videos (/watch?v=...) are allowed if you click a direct link — stay focused.";
            document.querySelector('.zone3').insertBefore(ytWarning, document.querySelector('.override-container'));
        }
    } catch(e) {
        document.getElementById('blockedDomain').innerText = blockedUrl || 'Unknown Site';
    }

    // Random Identity
    document.getElementById('identityStatement').innerText = IDENTITIES[Math.floor(Math.random() * IDENTITIES.length)];

    // Fetch state from background to fill stats
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
        if (!response) return;
        const state = response.local;
        
        // Stats
        if (state.streak) {
            document.getElementById('streakDisplay').innerText = `🔥 ${state.streak.current} days`;
        }
        
        // Tags & Hint from problems bank (if we have it, else rely on params)
        const session = response.session;
        if (session && session.currentProblemTags) {
            const tc = document.getElementById('tagsContainer');
            session.currentProblemTags.forEach(tag => {
                const sp = document.createElement('span');
                sp.className = 'tag';
                sp.innerText = tag;
                tc.appendChild(sp);
            });
        }

        // Today's solved
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        if (state.history && state.history[todayStr]) {
            document.getElementById('solvedToday').innerText = `Solved today: ${state.history[todayStr].solved}`;
        }
        
        // Override btn
        const overrides = state.overrides || { usedThisWeek: 0 };
        const remaining = Math.max(0, 3 - overrides.usedThisWeek);
        const overrideBtn = document.getElementById('overrideBtn');
        
        if (remaining > 0) {
            overrideBtn.innerText = `Use Override Token (${remaining} remaining this week)`;
            overrideBtn.onclick = () => {
                if (confirm("This uses 1 of your 3 weekly override tokens. Are you sure?")) {
                    chrome.runtime.sendMessage({ type: 'USE_OVERRIDE' }, (res) => {
                        if (res && res.success) {
                            window.location.href = blockedUrl;
                        } else {
                            alert("Failed to use override.");
                        }
                    });
                }
            };
        } else {
            overrideBtn.innerText = "No overrides left this week";
            overrideBtn.disabled = true;
        }

        // Load hint from problems bank
        fetch(chrome.runtime.getURL('data/problems.json'))
            .then(res => res.json())
            .then(data => {
                const prob = data.find(p => p.slug === slug);
                if (prob && prob.hint) {
                    document.getElementById('hintText').innerText = prob.hint;
                } else {
                    document.getElementById('hintToggle').style.display = 'none';
                }
            });
    });

    // Navigation
    document.getElementById('solveBtn').onclick = () => {
        window.location.href = `https://leetcode.com/problems/${slug}/`;
    };
    
    document.getElementById('problemTitle').onclick = () => {
        window.location.href = `https://leetcode.com/problems/${slug}/`;
    };

    document.getElementById('hintToggle').onclick = () => {
        document.getElementById('hintText').classList.toggle('hidden');
    };
});
