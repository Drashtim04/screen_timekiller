import { Storage } from './storage';
import { blockEngine } from './services/blockEngine';
import { behaviorTracker } from './services/behaviorTracker';
import { aiEngine } from './services/aiEngine';

/**
 * Background Service Worker
 * Orchestrates blocking, Pomodoro timers, and AI behavior tracking.
 */
console.log("DeepWork AI Background Worker Started");

// --- STATE MANAGEMENT & INITIALIZATION ---
chrome.storage.local.get(['blockingState', 'pomodoroState']).then(({ blockingState, pomodoroState }) => {
  if (blockingState) blockEngine.updateState(blockingState);
  if (pomodoroState) blockEngine.updatePomodoroState(pomodoroState);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    if (changes.blockingState) blockEngine.updateState(changes.blockingState.newValue);
    if (changes.pomodoroState) blockEngine.updatePomodoroState(changes.pomodoroState.newValue);
    if (changes.blockingState || changes.pomodoroState) checkAllTabs();
  }
});

// --- BEHAVIOR TRACKING: Tab Switching & Reopen Detection ---
const tabUrlMap: Record<number, string> = {};
const lastClosedDistraction: Record<string, number> = {};

chrome.tabs.onActivated.addListener(() => {
  behaviorTracker.logEvent('TAB_SWITCH');
});

chrome.tabs.onRemoved.addListener((tabId) => {
  const url = tabUrlMap[tabId];
  if (url) {
    try { 
      const hostname = new URL(url).hostname;
      // If the user closed a tab that was considered a distraction/blocked
      if (hostname && blockEngine.shouldBlock(url)) {
        lastClosedDistraction[hostname] = Date.now();
      }
    } catch(e) {}
    delete tabUrlMap[tabId];
  }
});

// --- BEHAVIOR TRACKING: Message Passing (from Content Scripts / Dashboard) ---
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message.type === 'SYNC_AUTH') {
    if (message.session && message.session.access_token) {
      chrome.storage.local.set({ 
        accessToken: message.session.access_token,
        user: message.session.user,
        isPro: message.isPro ?? false,
      }).then(() => sendResponse({ success: true }));
    } else {
      chrome.storage.local.remove(['accessToken', 'user', 'isPro'])
        .then(() => sendResponse({ success: true, cleared: true }));
    }
    return true; // Keep channel open for async sendResponse
  }
});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "BEHAVIOR_EVENT") {
    behaviorTracker.logEvent(message.payload);
  }
  
  if (message.type === "START_DEEP_WORK") {
    // Start Deep Work Pomodoro (called from AI Suggestion popup)
    chrome.storage.local.get('pomodoroState').then(({ pomodoroState }) => {
      if (!pomodoroState) return;
      const updates = { 
        status: 'running', 
        startTime: Date.now(), 
        endTime: Date.now() + pomodoroState.duration * 1000 
      };
      chrome.storage.local.set({ pomodoroState: { ...pomodoroState, ...updates } });
      chrome.alarms.create('pomodoroTimer', { when: updates.endTime });
    });
  }

  if (message.type === "CHECK_FOCUS_OVERLAY") {
    // Content script asking if it should show the focus overlay
    chrome.storage.local.get('pomodoroState').then(({ pomodoroState }) => {
      if (!pomodoroState || !pomodoroState.strictMode || pomodoroState.status !== 'running') {
        sendResponse({ shouldShow: false });
        return;
      }
      // Check if sender URL is in the whitelist
      const senderUrl = sender.url || '';
      let hostname = '';
      try { hostname = new URL(senderUrl).hostname.replace(/^www\./, ''); } catch(e) {}
      const inWhitelist = (pomodoroState.whitelist || []).some((w: string) => hostname.includes(w));
      // Also never block chrome:// or extension pages
      const isBrowserPage = senderUrl.startsWith('chrome') || senderUrl.startsWith('about');
      sendResponse({ shouldShow: !inWhitelist && !isBrowserPage && !!hostname });
    });
    return true; // async sendResponse
  }
});

// --- BEHAVIOR TRACKING: Threshold Breaches & AI Warning ---
behaviorTracker.onScoreThresholdReached = async (score, behaviors) => {
  const warning = await aiEngine.generateWarning(score, behaviors);
  if (warning) {
    // Send to active tab to display overlay
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'SHOW_AI_WARNING', payload: warning });
      }
    });
  }
};

// --- BLOCKING LOGIC & NAVIGATION TRACKING ---
function checkAllTabs() {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (tab.url && tab.id && blockEngine.shouldBlock(tab.url)) {
        redirectTab(tab.id, tab.url);
      }
    }
  });
}

function redirectTab(tabId: number, originalUrl: string) {
  behaviorTracker.logEvent('BLOCKED_SITE_ATTEMPT'); // Log distraction attempt
  
  // Push telemetry to backend asynchronously
  chrome.storage.local.get(['accessToken']).then(({ accessToken }) => {
    if (accessToken) {
      let domain = originalUrl;
      try { domain = new URL(originalUrl).hostname; } catch(e) {}
      
      fetch('http://localhost:3001/api/analytics/block-attempt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ domain, category: 'Uncategorized' })
      }).catch(err => console.error('Failed to log block attempt', err));
    }
  });

  const redirectUrl = chrome.runtime.getURL("tabs/blocked.html") + "?url=" + encodeURIComponent(originalUrl);
  chrome.tabs.update(tabId, { url: redirectUrl });
}

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0) return;
  
  const url = details.url;
  tabUrlMap[details.tabId] = url;

  try {
    const hostname = new URL(url).hostname;
    // Check if this hostname was closed recently (Rapid Reopen detection)
    if (hostname && lastClosedDistraction[hostname]) {
      if (Date.now() - lastClosedDistraction[hostname] < 10000) { // 10s window
        behaviorTracker.logEvent('RAPID_REOPEN');
      }
    }
  } catch(e) {}

  if (blockEngine.shouldBlock(details.url)) {
    redirectTab(details.tabId, details.url);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    tabUrlMap[tabId] = changeInfo.url;
    if (blockEngine.shouldBlock(changeInfo.url)) {
      redirectTab(tabId, changeInfo.url);
    }
  }
});

// --- POMODORO ALARMS ---
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'pomodoroTimer') {
    const { pomodoroState } = await chrome.storage.local.get('pomodoroState');
    if (!pomodoroState || pomodoroState.status !== 'running') return;

    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icon512.png'),
      title: pomodoroState.mode === 'pomodoro' ? 'Deep Work Complete!' : 'Break Over!',
      message: pomodoroState.mode === 'pomodoro' 
        ? "Great focus! Time for a short break." 
        : "Time to get back to Deep Work.",
      priority: 2
    });

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    
    let newStreak = pomodoroState.streakDays;
    if (pomodoroState.lastSessionDate) {
      const lastDate = new Date(pomodoroState.lastSessionDate);
      const diffTime = Math.abs(now.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) newStreak += 1;
      else if (diffDays > 1) newStreak = 1;
    } else {
      newStreak = 1;
    }

    const log = {
      id: crypto.randomUUID(),
      startTime: pomodoroState.startTime!,
      duration: pomodoroState.duration,
      completed: true,
      mode: pomodoroState.mode,
      goal: pomodoroState.currentGoal || undefined
    };

    const updates = {
      status: 'idle',
      startTime: null,
      endTime: null,
      sessionCount: pomodoroState.mode === 'pomodoro' ? pomodoroState.sessionCount + 1 : pomodoroState.sessionCount,
      streakDays: newStreak,
      lastSessionDate: dateStr,
      history: [log, ...pomodoroState.history].slice(0, 100),
      currentGoal: null,
    };

    await chrome.storage.local.set({ pomodoroState: { ...pomodoroState, ...updates } });

    // Push completed session to backend
    if (log.mode === 'pomodoro') {
      const { accessToken } = await chrome.storage.local.get(['accessToken']);
      if (accessToken) {
        fetch('http://localhost:3001/api/focus/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            task_name: pomodoroState.currentGoal || 'Deep Work Session',
            start_time: log.startTime,
            end_time: Date.now(),
            duration: log.duration,
            is_deep_work: true,
            efficiency_score: 95,
            completed: true
          })
        }).catch(err => console.error('Failed to sync session', err));
      }
    }
  }
});
