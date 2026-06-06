import { BehavioralEvent, DistractionLog } from '../types/ai';
import { THRESHOLDS } from '../config/thresholds';

/**
 * Tracks user behavior locally and calculates a rolling "Distraction Score".
 * Designed to be highly efficient and privacy-friendly.
 */
export class BehaviorTracker {
  private logs: DistractionLog[] = [];
  private lastTabSwitchTime: number = 0;
  
  // Callback hooked by the background script to trigger AI when necessary
  public onScoreThresholdReached?: (score: number, recentEvents: BehavioralEvent[]) => void;

  /**
   * Logs a user event and evaluates the rolling score.
   */
  public logEvent(type: BehavioralEvent) {
    const now = Date.now();

    // Check for rapid tab switching logic
    if (type === 'TAB_SWITCH') {
      if (now - this.lastTabSwitchTime < THRESHOLDS.RAPID_SWITCH_WINDOW) {
        this.addLog('TAB_SWITCH'); // Only penalize if it's considered "rapid"
      }
      this.lastTabSwitchTime = now;
      return;
    }

    this.addLog(type);
  }

  private addLog(type: BehavioralEvent) {
    this.logs.push({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type,
      weight: THRESHOLDS.WEIGHTS[type]
    });
    this.evaluateScore();
  }

  /**
   * Calculates the current distraction score based on a decaying time window.
   */
  private evaluateScore() {
    const now = Date.now();
    
    // Prune old logs (time decay)
    this.logs = this.logs.filter(log => now - log.timestamp < THRESHOLDS.DECAY_WINDOW);

    // Sum weights of remaining valid logs
    const currentScore = this.logs.reduce((sum, log) => sum + log.weight, 0);

    // Trigger AI if limits are breached
    if (currentScore >= THRESHOLDS.SCORE_LIMIT_WARNING) {
      if (this.onScoreThresholdReached) {
        const recentTypes = Array.from(new Set(this.logs.map(l => l.type)));
        this.onScoreThresholdReached(currentScore, recentTypes);
      }
      // Reset after triggering to avoid notification spam
      this.logs = [];
    }
  }
}

export const behaviorTracker = new BehaviorTracker();
