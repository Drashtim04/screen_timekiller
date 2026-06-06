export type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';
export type TimerStatus = 'idle' | 'running' | 'paused';

export interface FocusSessionLog {
  id: string;
  startTime: number;
  duration: number; // in seconds
  completed: boolean;
  mode: TimerMode;
  goal?: string;
}

export interface PomodoroState {
  mode: TimerMode;
  status: TimerStatus;
  startTime: number | null;
  endTime: number | null;
  pausedAt: number | null; // Used to freeze the remaining time when paused
  duration: number; // The target duration in seconds
  strictMode: boolean; // Whitelist-only browsing
  sessionCount: number;
  streakDays: number;
  lastSessionDate: string | null;
  history: FocusSessionLog[];
  currentGoal?: string | null;
}
