import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { requirePro } from '../middleware/requirePro';

const router = Router();

// POST /api/ai/roast — Pro-only feature
router.post('/roast', requireAuth, requirePro, async (req: AuthenticatedRequest, res) => {
  try {
    const { behaviors } = req.body;
    const userId = req.user?.id;
    
    let behaviorStr = "being distracted";
    if (behaviors && Array.isArray(behaviors)) {
      behaviorStr = behaviors.map((b: string) => {
        if (b === 'TAB_SWITCH') return 'rapidly switching tabs';
        if (b === 'BLOCKED_SITE_ATTEMPT') return 'attempting to visit blocked sites';
        if (b === 'EXCESSIVE_SCROLL') return 'mindlessly scrolling';
        if (b === 'RAPID_REOPEN') return 'repeatedly reopening closed distractions';
        return b;
      }).join(', and ');
    }

    // Placeholder mock response
    const roasts = [
      `I see you ${behaviorStr}. Are you trying to set a world record for lowest attention span? Get back to work!`,
      `Caught you ${behaviorStr}! The dopamine hit isn't worth the missed deadlines.`,
      `Your neural metrics indicate you are ${behaviorStr}. Focus mode engaged. No excuses.`
    ];

    const message = roasts[Math.floor(Math.random() * roasts.length)];

    // In a real app, you would use OpenAI here:
    // const response = await openai.chat.completions.create({...})

    res.json({ success: true, message });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

import { groqService } from '../services/groqService';

// POST /api/ai/coach — Pro-only Focus Coach
router.post('/coach', requireAuth, requirePro, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { domain, currentGoal, timeRemainingSeconds, sessionDurationSeconds } = req.body;

    if (!domain) {
      return res.status(400).json({ success: false, error: 'Domain is required' });
    }

    let distractionAttempts = 1;
    let streakDays = 0;
    let focusScore = 85;

    // Retrieve analytics / attempts from DB if not demo user
    if (userId !== 'user-1') {
      try {
        const { createClient } = require('@supabase/supabase-js');
        const db = createClient(
          process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
          process.env.SUPABASE_KEY || 'placeholder'
        );
        const today = new Date().toISOString().split('T')[0];
        
        // 1. Get attempts count today for this domain
        const { count: attemptCount } = await db
          .from('blocked_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('domain', domain)
          .gte('attempted_at', today);
        distractionAttempts = (attemptCount || 0) + 1; // Count this attempt too

        // 2. Get streak information
        const { data: streakData } = await db
          .from('streaks')
          .select('current_streak')
          .eq('user_id', userId)
          .single();
        streakDays = streakData?.current_streak || 0;

        // 3. Get focus score
        const { data: analyticsData } = await db
          .from('analytics')
          .select('daily_focus_score')
          .eq('user_id', userId)
          .eq('date', today)
          .single();
        focusScore = analyticsData?.daily_focus_score || 85;
      } catch (err) {
        console.warn('[AI Coach Route] Failed to fetch context from database, using defaults:', err);
      }
    } else {
      // Mock data for user-1
      distractionAttempts = 5;
      streakDays = 14;
      focusScore = 88;
    }

    const result = await groqService.generateCoachingMessage({
      userId,
      domain,
      currentGoal: currentGoal || null,
      distractionAttempts,
      focusScore,
      streakDays,
      timeRemainingSeconds: timeRemainingSeconds || 0,
      sessionDurationSeconds: sessionDurationSeconds || 0
    });

    res.json({
      success: true,
      message: result.message,
      source: result.source
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
