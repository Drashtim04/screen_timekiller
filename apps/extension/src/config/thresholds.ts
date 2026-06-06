export const THRESHOLDS = {
  // Score weights per event type
  WEIGHTS: {
    TAB_SWITCH: 2,
    BLOCKED_SITE_ATTEMPT: 15, // High penalty for trying to access blocked sites
    EXCESSIVE_SCROLL: 5,
    RAPID_REOPEN: 10,
  },
  
  // Distraction limits
  SCORE_LIMIT_WARNING: 30, // Trigger AI coaching warning at this score
  SCORE_LIMIT_CRITICAL: 50, // High score triggers automatic suggestion for Deep Work mode

  // Timeframes (ms)
  DECAY_WINDOW: 5 * 60 * 1000, // Logs older than 5 mins are ignored for scoring (rolling window)
  RAPID_SWITCH_WINDOW: 2000, // Tab switches within 2s count as rapid context switching
  REOPEN_WINDOW: 10000, // Reopening a blocked/distracting site within 10s
};
