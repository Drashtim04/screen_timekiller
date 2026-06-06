import { BehavioralEvent, AIWarning } from '../types/ai';
import { THRESHOLDS } from '../config/thresholds';

/**
 * AI Scoring Engine that communicates with OpenAI API.
 * Note: In a real production environment, the API call should be routed through
 * the Express backend to securely protect the API key.
 */
export class AIEngine {
  private lastWarningTime: number = 0;
  private COOLDOWN = 10 * 60 * 1000; // Only warn once every 10 minutes max

  /**
   * Generates a contextual warning based on the user's specific bad habits.
   */
  async generateWarning(score: number, behaviors: BehavioralEvent[]): Promise<AIWarning | null> {
    const now = Date.now();
    if (now - this.lastWarningTime < this.COOLDOWN) {
      return null; // Suppress warning due to cooldown
    }

    this.lastWarningTime = now;
    
    // Auto-suggest Deep Work if score is critically high
    const suggestDeepWork = score >= THRESHOLDS.SCORE_LIMIT_CRITICAL;

    try {
      // Create behavioral descriptions for the AI prompt
      const behaviorDescriptions = behaviors.map(b => {
        if (b === 'TAB_SWITCH') return 'rapidly switching tabs';
        if (b === 'BLOCKED_SITE_ATTEMPT') return 'attempting to visit blocked sites';
        if (b === 'EXCESSIVE_SCROLL') return 'mindlessly scrolling';
        if (b === 'RAPID_REOPEN') return 'repeatedly reopening closed distractions';
        return b;
      }).join(', and ');

      const prompt = `The user is highly distracted. They have been ${behaviorDescriptions}. Generate a short, punchy, 1-sentence coaching message to get them back on track.`;
      
      console.log("[AI Engine] Requesting AI Roast from backend for behaviors:", behaviors);
      
      let message = "Focus mode engaged. No excuses.";
      
      try {
        const { accessToken } = await chrome.storage.local.get(['accessToken']);
        if (accessToken) {
          const res = await fetch('http://localhost:3001/api/ai/roast', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ behaviors })
          });
          const data = await res.json();
          if (data.success && data.message) {
            message = data.message;
          }
        } else {
          // Fallback if not logged in
          message = "You seem distracted. Log in to DeepWork AI to get personalized coaching.";
        }
      } catch (err) {
        console.error("[AI Engine] Failed to fetch roast:", err);
      }

      return {
        message,
        suggestDeepWork
      };
    } catch (e) {
      console.error("AI Generation failed", e);
      return null;
    }
  }
}

export const aiEngine = new AIEngine();
