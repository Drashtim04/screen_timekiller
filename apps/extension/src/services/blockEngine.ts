import { authService } from './authService';

export interface BlockingState {
  blocklist: string[];
  schedule: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    days: number[];
  };
}

export interface PomodoroState {
  status: 'idle' | 'running' | 'paused';
  mode: 'pomodoro' | 'shortBreak' | 'longBreak';
  strictMode: boolean;
  whitelist: string[];
}

export class BlockEngine {
  private state: BlockingState = {
    blocklist: [],
    schedule: { enabled: false, startTime: '09:00', endTime: '17:00', days: [1, 2, 3, 4, 5] },
  };

  private pomodoro: PomodoroState = {
    status: 'idle',
    mode: 'pomodoro',
    strictMode: false,
    whitelist: [],
  };

  public updateState(newState: BlockingState) {
    this.state = newState;
  }

  public updatePomodoroState(newPomodoro: PomodoroState) {
    this.pomodoro = newPomodoro;
  }

  public shouldBlock(url: string): boolean {
    // Check if there is an active temporary unlock bypass
    const nowMs = Date.now();
    const stateAny = this.state as any;
    if (stateAny.temporaryUnlockUntil && nowMs < stateAny.temporaryUnlockUntil) {
      return false;
    }

    let hostname = '';
    try { hostname = new URL(url).hostname; } catch (e) { return false; }

    // Enforce Free Tier Limit: Max 3 blocked websites if user is not premium
    const authSession = authService.getSession();
    const isPremium = authSession?.user ? true : false;
    const effectiveBlocklist = isPremium ? this.state.blocklist : this.state.blocklist.slice(0, 3);

    // Deep Work Strict Mode: Whitelist-only filtering
    if (this.pomodoro.strictMode && this.pomodoro.status === 'running' && this.pomodoro.mode === 'pomodoro') {
      const inWhitelist = this.pomodoro.whitelist.some(w => hostname.includes(w));
      return !inWhitelist;
    }

    // Normal Blocklist Check (handling both string[] and BlockRule[] formats)
    const inBlocklist = effectiveBlocklist.some(b => {
      const domainStr = typeof b === 'string' ? b : (b as any)?.domain || '';
      const cleanedDomain = domainStr.replace(/^\*\./, '');
      return hostname.includes(cleanedDomain);
    });
    if (!inBlocklist) return false;

    // Check Schedule
    if (this.state.schedule && this.state.schedule.enabled) {
      const now = new Date();
      if (!this.state.schedule.days.includes(now.getDay())) return false;

      const currentTime = now.toTimeString().slice(0, 5);
      if (currentTime < this.state.schedule.startTime || currentTime > this.state.schedule.endTime) {
        return false;
      }
    }

    return true;
  }
}

export const blockEngine = new BlockEngine();
