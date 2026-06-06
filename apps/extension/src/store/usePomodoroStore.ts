import { create } from 'zustand';
import { PomodoroState, TimerMode } from '../types/pomodoro';

// Default durations (in seconds)
export const DURATIONS = {
  pomodoro: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

interface PomodoroStore extends PomodoroState {
  hydrate: (state: Partial<PomodoroState>) => void;
  start: (goal?: string) => void;
  pause: () => void;
  reset: () => void;
  setMode: (mode: TimerMode) => void;
  toggleStrictMode: () => void;
}

const defaultState: PomodoroState = {
  mode: 'pomodoro',
  status: 'idle',
  startTime: null,
  endTime: null,
  pausedAt: null,
  duration: DURATIONS.pomodoro,
  strictMode: false,
  sessionCount: 0,
  streakDays: 0,
  lastSessionDate: null,
  history: [],
  currentGoal: null,
};

export const usePomodoroStore = create<PomodoroStore>((set, get) => ({
  ...defaultState,
  
  hydrate: (state) => set(state),

  start: async (goal) => {
    const state = get();
    if (state.status === 'running') return;
    
    let newEndTime = Date.now() + state.duration * 1000;
    
    // If resuming from pause
    if (state.status === 'paused' && state.pausedAt && state.endTime) {
      const timeRemaining = state.endTime - state.pausedAt;
      newEndTime = Date.now() + timeRemaining;
    }

    const updates: Partial<PomodoroState> = {
      status: 'running',
      startTime: state.status === 'idle' ? Date.now() : state.startTime,
      endTime: newEndTime,
      pausedAt: null,
      currentGoal: goal || state.currentGoal,
    };
    
    set(updates);
    await chrome.storage.local.set({ pomodoroState: { ...state, ...updates } });
    if (chrome.alarms) {
      chrome.alarms.create('pomodoroTimer', { when: newEndTime });
    }
  },

  pause: async () => {
    const state = get();
    if (state.status !== 'running') return;

    const updates: Partial<PomodoroState> = {
      status: 'paused',
      pausedAt: Date.now(),
    };

    set(updates);
    await chrome.storage.local.set({ pomodoroState: { ...state, ...updates } });
    if (chrome.alarms) {
      chrome.alarms.clear('pomodoroTimer');
    }
  },

  reset: async () => {
    const state = get();
    
    // Log cancelled session if was running/paused
    if ((state.status === 'running' || state.status === 'paused') && state.mode === 'pomodoro') {
      const focusedSeconds = state.startTime ? Math.max(0, Math.floor((Date.now() - state.startTime) / 1000)) : 0;
      chrome.storage.local.get(['accessToken']).then(({ accessToken }) => {
        if (accessToken) {
          fetch('http://localhost:3001/api/focus/sessions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              task_name: state.currentGoal || 'Deep Work Session',
              start_time: state.startTime,
              end_time: Date.now(),
              duration: focusedSeconds,
              is_deep_work: true,
              efficiency_score: 50,
              completed: false
            })
          }).catch(err => console.error('Failed to sync cancelled session', err));
        }
      });
    }

    const updates: Partial<PomodoroState> = {
      status: 'idle',
      startTime: null,
      endTime: null,
      pausedAt: null,
      duration: DURATIONS[state.mode],
      currentGoal: null,
    };
    
    set(updates);
    await chrome.storage.local.set({ pomodoroState: { ...state, ...updates } });
    if (chrome.alarms) {
      chrome.alarms.clear('pomodoroTimer');
    }
  },

  setMode: async (mode) => {
    const state = get();
    const updates: Partial<PomodoroState> = {
      mode,
      status: 'idle',
      startTime: null,
      endTime: null,
      pausedAt: null,
      duration: DURATIONS[mode],
      currentGoal: null,
    };
    set(updates);
    await chrome.storage.local.set({ pomodoroState: { ...state, ...updates } });
  },

  toggleStrictMode: async () => {
    const state = get();
    const updates = { strictMode: !state.strictMode };
    set(updates);
    await chrome.storage.local.set({ pomodoroState: { ...state, ...updates } });
  }
}));

// Setup storage listener for popup synchronization
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.local.get('pomodoroState', (res) => {
    if (res.pomodoroState) {
      usePomodoroStore.getState().hydrate(res.pomodoroState);
    }
  });

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.pomodoroState) {
      usePomodoroStore.getState().hydrate(changes.pomodoroState.newValue);
    }
  });
}
