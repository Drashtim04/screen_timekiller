export interface DailyFocusData {
  date: string;
  focusHours: number;
  deepWorkHours: number;
  score: number;
}

export interface DistractingSite {
  domain: string;
  category: string;
  attempts: number;
  timeSaved: number; // in minutes
  iconColor: string;
}

export interface HeatmapDay {
  date: string;
  sessions: number;
  minutes: number;
  completed: number;
}

export interface SessionLog {
  id: string;
  taskName: string;
  startTime: string;
  duration: number; // minutes
  efficiency: number; // percentage
  aiNote?: string;
  tags: string[];
}

export interface DashboardMetrics {
  dailyFocusScore: number;
  focusScoreTrend: number; // percentage change
  totalFocusHours: number;
  focusHoursTrend: number;
  currentStreak: number;
  bestStreak: number;
  deepWorkPercentage: number; // percentage of total focus
  deepWorkTrend: number;
}

export interface WeeklyReport {
  id: string;
  start_date: string;
  end_date: string;
  focus_hours: number;
  focus_score: number;
  session_count: number;
  completed_count: number;
  unlock_reasons: Record<string, number>;
  top_distractions: { domain: string; count: number }[];
  productivity_change: number;
  ai_summary: string;
  created_at: string;
}
