import { DailyFocusData, DistractingSite, HeatmapDay, SessionLog, DashboardMetrics } from '../types/analytics';

export const mockMetrics: DashboardMetrics = {
  dailyFocusScore: 88,
  focusScoreTrend: 12.5,
  totalFocusHours: 34.2,
  focusHoursTrend: 8.4,
  currentStreak: 14,
  bestStreak: 21,
  deepWorkPercentage: 76,
  deepWorkTrend: 5.2
};

export const mockWeeklyFocus: DailyFocusData[] = [
  { date: 'Mon', focusHours: 4.5, deepWorkHours: 3.2, score: 82 },
  { date: 'Tue', focusHours: 6.2, deepWorkHours: 5.0, score: 91 },
  { date: 'Wed', focusHours: 5.8, deepWorkHours: 4.5, score: 88 },
  { date: 'Thu', focusHours: 7.1, deepWorkHours: 6.0, score: 95 },
  { date: 'Fri', focusHours: 5.0, deepWorkHours: 3.8, score: 84 },
  { date: 'Sat', focusHours: 3.2, deepWorkHours: 2.5, score: 75 },
  { date: 'Sun', focusHours: 4.8, deepWorkHours: 4.0, score: 86 },
];

export const mockDistractions: DistractingSite[] = [
  { domain: 'twitter.com', category: 'Social Media', attempts: 42, timeSaved: 126, iconColor: '#1DA1F2' },
  { domain: 'reddit.com', category: 'Community', attempts: 28, timeSaved: 84, iconColor: '#FF4500' },
  { domain: 'youtube.com', category: 'Video', attempts: 19, timeSaved: 95, iconColor: '#FF0000' },
  { domain: 'instagram.com', category: 'Social Media', attempts: 14, timeSaved: 42, iconColor: '#E4405F' },
  { domain: 'news.ycombinator.com', category: 'News', attempts: 11, timeSaved: 33, iconColor: '#FF6600' },
];

export const mockHeatmap: HeatmapDay[] = Array.from({ length: 365 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (364 - i));
  const sessions = Math.floor(Math.random() * 5); // 0 to 4 focus sessions
  const completed = Math.max(0, sessions - (Math.random() < 0.15 ? 1 : 0)); // occasional incomplete
  const minutes = completed * 25; // 25 min session duration
  return {
    date: d.toISOString().split('T')[0],
    sessions,
    minutes,
    completed
  };
});

export const mockSessions: SessionLog[] = [
  { id: '1', taskName: 'Architect Neural Net Models', startTime: '2:15 PM', duration: 120, efficiency: 94, aiNote: 'Exceptional flow state maintained. 0 tab switches detected.', tags: ['AI', 'Architecture'] },
  { id: '2', taskName: 'Write API GraphQL Resolvers', startTime: '10:30 AM', duration: 90, efficiency: 88, aiNote: 'Minor distraction at 45m (Twitter attempt blocked). Quickly refocused.', tags: ['Backend', 'GraphQL'] },
  { id: '3', taskName: 'Design System Component Spec', startTime: '8:00 AM', duration: 60, efficiency: 91, aiNote: 'Consistent pacing. High deep work ratio.', tags: ['UI/UX', 'Design'] },
  { id: '4', taskName: 'Optimize Webpack Bundle Size', startTime: 'Yesterday', duration: 150, efficiency: 82, aiNote: 'Multiple rapid tab switches detected during research phase.', tags: ['DevOps', 'Performance'] },
  { id: '5', taskName: 'Draft Q3 Engineering Roadmap', startTime: 'Yesterday', duration: 45, efficiency: 96, aiNote: 'Perfect focus session. Strict mode enabled throughout.', tags: ['Management', 'Planning'] },
];
