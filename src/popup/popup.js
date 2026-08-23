import { parsePDF } from '../parser/pdfParser.js';

let updateInterval;

document.addEventListener('DOMContentLoaded', async () => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '../../libs/pdf.worker.min.js';
    
    bindTabs();
    await hydrateUI();
    
    // Auto-update timer
    updateInterval = setInterval(updateTimerUI, 1000);

    // Bind Session Toggle
    document.getElementById('sessionToggleBtn').onclick = toggleSession;
    
    // Bind solve/skip
    document.getElementById('goSolveBtn').onclick = () => {
        chrome.runtime.sendMessage({ type: 'GET_STATE' }, (res) => {
            if (res.session?.currentProblemSlug) {
                chrome.tabs.create({ url: `https://leetcode.com/problems/${res.session.currentProblemSlug}/` });
            }
        });
    };
    
    document.getElementById('skipBtn').onclick = () => {
        if(confirm("Skip problem? Costs 5 XP.")) {
            chrome.runtime.sendMessage({ type: 'SKIP_PROBLEM' }, hydrateUI);
        }
    };
    
    // Bind Whitelist
    document.getElementById('addDomainBtn').onclick = () => {
        const input = document.getElementById('domainInput');
        if (input.value) {
            addWhitelistEntry(input.value);
            input.value = '';
        }
    };
    
    document.getElementById('presetDevDocs').onclick = () => addBatch(["developer.mozilla.org", "docs.python.org", "cppreference.com"]);
    document.getElementById('presetSearch').onclick = () => addBatch(["google.com", "duckduckgo.com", "bing.com"]);
    
    // Bind Goals
    document.getElementById('pdfInput').onchange = handlePDFUpload;
    document.getElementById('confirmGoalsBtn').onclick = confirmGoals;
    document.getElementById('cancelGoalsBtn').onclick = () => {
        document.getElementById('parseResults').classList.add('hidden');
        document.getElementById('parseProgress').classList.add('hidden');
        tempGoalsData = null;
    };
    document.getElementById('resetGoalsBtn').onclick = () => {
        if(confirm("Reset to random mode?")) {
            chrome.runtime.sendMessage({ type: 'CLEAR_GOAL_MODE' }, hydrateUI);
        }
    };
    
    // Bind Freeze
    document.getElementById('useFreezeBtn').onclick = () => {
        if(confirm("Use 1 Freeze Token? Your streak will be saved even if you don't solve today.")) {
            // Send use freeze msg (not explicitly in prompt, but needed. Implementation in scheduler)
            // Wait, we need a handler in background for this.
        }
    }
});

function bindTabs() {
    const btns = document.querySelectorAll('.tab-btn');
    btns.forEach(btn => {
        btn.onclick = () => {
            btns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.getAttribute('data-target')).classList.add('active');
        };
    });
}

async function hydrateUI() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_STATE' }, (state) => {
            if(!state) return resolve();
            
            // Dashboard
            const sessionBtn = document.getElementById('sessionToggleBtn');
            const panel = document.getElementById('activeSessionPanel');
            const statusInd = document.getElementById('badgeStatus');
            
            if (state.session.sessionActive) {
                sessionBtn.innerText = "End Session";
                sessionBtn.className = "main-toggle end";
                panel.classList.remove('hidden');
                statusInd.className = "status-indicator active";
                
                document.getElementById('popupTitle').innerText = state.session.currentProblemTitle || "Assigning...";
                const diff = state.session.currentProblemDifficulty || "Medium";
                document.getElementById('popupDiff').innerText = diff;
                document.getElementById('popupDiff').className = `badge ${diff.toLowerCase()}`;
                
            } else {
                sessionBtn.innerText = "Start Session";
                sessionBtn.className = "main-toggle start";
                panel.classList.add('hidden');
                statusInd.className = "status-indicator";
            }
            
            // Stats Grid
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            if (state.local.history && state.local.history[todayStr]) {
                document.getElementById('statSolved').innerText = state.local.history[todayStr].solved;
                document.getElementById('statBlocked').innerText = state.local.history[todayStr].blocked;
            } else {
                document.getElementById('statSolved').innerText = "0";
                document.getElementById('statBlocked').innerText = "0";
            }
            document.getElementById('statStreak').innerText = state.local.streak?.current || 0;
            
            // Whitelist
            const ul = document.getElementById('whitelistUl');
            ul.innerHTML = '';
            (state.local.whitelist || []).forEach((w, i) => {
                const li = document.createElement('li');
                li.className = 'domain-item';
                li.innerHTML = `<span class="domain-name">${w.domain}</span><button class="del-btn" data-idx="${i}">×</button>`;
                ul.appendChild(li);
            });
            document.querySelectorAll('.del-btn').forEach(btn => {
                btn.onclick = (e) => removeWhitelistEntry(parseInt(e.target.getAttribute('data-idx')));
            });
            
            // Goals Tab
            const isGoalMode = state.local.useGoalMode;
            document.getElementById('currentModeLabel').innerText = isGoalMode ? (state.local.pdfGoalsMeta?.filename || "PDF Plan") : "Random";
            if (isGoalMode && state.local.pdfGoals) {
                document.getElementById('goalProgress').classList.remove('hidden');
                document.getElementById('resetGoalsBtn').classList.remove('hidden');
                document.getElementById('goalProgressText').innerText = `${state.local.goalIndex || 0} / ${state.local.pdfGoals.length}`;
            } else {
                document.getElementById('goalProgress').classList.add('hidden');
                document.getElementById('resetGoalsBtn').classList.add('hidden');
            }
            
            // Stats Tab
            if (state.local.xp) {
                document.getElementById('levelVal').innerText = state.local.xp.level;
                document.getElementById('levelName').innerText = state.local.xp.levelName;
                document.getElementById('totalXp').innerText = state.local.xp.total;
                
                const thresholds = state.local.xp.levelThresholds;
                const prevThresh = thresholds[state.local.xp.level - 1] || 0;
                const nextThresh = thresholds[state.local.xp.level] || (prevThresh + 100);
                const pct = Math.min(100, Math.max(0, ((state.local.xp.total - prevThresh) / (nextThresh - prevThresh)) * 100));
                document.getElementById('xpProgress').style.width = `${pct}%`;
            }
            
            const freezes = state.local.streak?.freezeTokens || 0;
            document.getElementById('freezeCount').innerText = freezes;
            document.getElementById('useFreezeBtn').disabled = freezes === 0;
            
            if (state.local.overrides) {
                document.getElementById('overridesUsed').innerText = state.local.overrides.usedThisWeek;
            }
            
            resolve();
        });
    });
}

function updateTimerUI() {
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (state) => {
        if (!state) return;
        const s = state.session;
        const timerEl = document.getElementById('freedomTimer');
        const statusInd = document.getElementById('badgeStatus');
        
        if (s.sessionActive && s.freedomExpiresAt > Date.now()) {
            timerEl.classList.remove('hidden');
            statusInd.className = "status-indicator free";
            const mins = Math.floor((s.freedomExpiresAt - Date.now()) / 60000);
            const secs = Math.floor(((s.freedomExpiresAt - Date.now()) % 60000) / 1000);
            document.querySelector('.timer-text').innerText = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
        } else {
            timerEl.classList.add('hidden');
            if(s.sessionActive) statusInd.className = "status-indicator active";
        }
    });
}

function toggleSession() {
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (state) => {
        if (state.session.sessionActive) {
            chrome.runtime.sendMessage({ type: 'END_SESSION' }, hydrateUI);
        } else {
            chrome.runtime.sendMessage({ type: 'START_SESSION' }, hydrateUI);
        }
    });
}

async function getWhitelist() {
    return new Promise(resolve => {
        chrome.runtime.sendMessage({ type: 'GET_STATE' }, state => resolve(state.local.whitelist || []));
    });
}

async function addWhitelistEntry(domain) {
    const list = await getWhitelist();
    // basic dedup
    if (!list.find(e => e.domain === domain)) {
        list.push({ id: Date.now().toString(), domain, addedAt: Date.now(), label: domain });
        chrome.runtime.sendMessage({ type: 'UPDATE_WHITELIST', data: { whitelist: list } }, hydrateUI);
    }
}

async function addBatch(domains) {
    const list = await getWhitelist();
    let changed = false;
    domains.forEach(domain => {
        if (!list.find(e => e.domain === domain)) {
            list.push({ id: Date.now().toString() + Math.random(), domain, addedAt: Date.now(), label: domain });
            changed = true;
        }
    });
    if (changed) {
        chrome.runtime.sendMessage({ type: 'UPDATE_WHITELIST', data: { whitelist: list } }, hydrateUI);
    }
}

async function removeWhitelistEntry(index) {
    const list = await getWhitelist();
    list.splice(index, 1);
    chrome.runtime.sendMessage({ type: 'UPDATE_WHITELIST', data: { whitelist: list } }, hydrateUI);
}

let tempGoalsData = null;

async function handlePDFUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const info = document.getElementById('parseProgress');
    info.classList.remove('hidden');
    
    try {
        const res = await fetch(chrome.runtime.getURL('data/problems.json'));
        const problemsBank = await res.json();
        
        const result = await parsePDF(file, problemsBank, (msg) => {
            info.innerText = msg;
        });
        
        tempGoalsData = { goals: result.goals, filename: file.name, topicPreferences: result.topicPreferences };
        
        const tbody = document.getElementById('resultsTbody');
        tbody.innerHTML = '';
        result.goals.forEach(g => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${g.title.substring(0,20)}...</td><td><span class="badge ${g.difficulty.toLowerCase()}">${g.difficulty}</span></td><td>✅</td>`;
            tbody.appendChild(tr);
        });
        
        document.getElementById('parseResults').classList.remove('hidden');
        info.innerText = `Found ${result.goals.length} problems.`;
        
    } catch (err) {
        info.innerText = `Error: ${err.message}`;
    }
}

function confirmGoals() {
    if (tempGoalsData) {
        chrome.runtime.sendMessage({
            type: 'SET_GOAL_MODE',
            data: {
                goals: tempGoalsData.goals,
                meta: { filename: tempGoalsData.filename, topicPreferences: tempGoalsData.topicPreferences, parsedAt: Date.now() }
            }
        }, () => {
            tempGoalsData = null;
            document.getElementById('parseResults').classList.add('hidden');
            document.getElementById('parseProgress').classList.add('hidden');
            hydrateUI();
        });
    }
}
