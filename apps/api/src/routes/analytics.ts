import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { reportAiService } from '../services/reportAiService';
import { generateEmailReportHtml } from '../utils/emailTemplate';

const router = Router();
function getSupabase() {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_KEY || 'placeholder'
  );
}

// Get user analytics overview
router.get('/overview', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;

    // MOCK DATA RETURN FOR 'user-1' bypass
    if (userId === 'user-1') {
      return res.json({
        success: true,
        metrics: {
          dailyFocusScore: 88,
          focusScoreTrend: 12.5,
          totalFocusHours: 34.2,
          focusHoursTrend: 8.4,
          currentStreak: 14,
          bestStreak: 21,
          deepWorkPercentage: 76,
          deepWorkTrend: 5.2
        },
        weeklyFocus: [
          { date: 'Mon', focusHours: 4.5, deepWorkHours: 3.2, score: 82 },
          { date: 'Tue', focusHours: 6.2, deepWorkHours: 5.0, score: 91 },
          { date: 'Wed', focusHours: 5.8, deepWorkHours: 4.5, score: 88 }
        ],
        topDistractions: [
          { domain: 'twitter.com', category: 'Social Media', attempts: 42, timeSaved: 126, iconColor: '#1DA1F2' },
          { domain: 'reddit.com', category: 'Community', attempts: 28, timeSaved: 84, iconColor: '#FF4500' }
        ],
        heatmapData: Array.from({ length: 365 }, (_, i) => {
          const sessions = Math.floor(Math.random() * 5); // 0 to 4 focus sessions
          const completed = Math.max(0, sessions - (Math.random() < 0.15 ? 1 : 0)); // occasional incomplete
          const minutes = completed * 25; // 25 min session duration
          return {
            date: new Date(Date.now() - (364 - i) * 86400000).toISOString().split('T')[0],
            sessions,
            minutes,
            completed
          };
        }),
        emergencyUnlocks: {
          total: 8,
          reasons: {
            'Work Related': 3,
            'Quick Check': 2,
            'Habit': 2,
            'Bored': 1
          }
        },
        sessions: [
          { id: '1', taskName: 'Architect Neural Net', startTime: '2:15 PM', duration: 120, efficiency: 94, aiNote: 'Exceptional flow state.', tags: ['AI'] }
        ]
      });
    }

    // Fetch user streaks
    const db = getSupabase();
    const { data: streaks } = await db
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Fetch recent focus sessions
    const { data: sessions } = await db
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    // Fetch blocked attempts
    const { data: attempts } = await db
      .from('blocked_attempts')
      .select('*')
      .eq('user_id', userId);

    // Fetch emergency unlocks
    const { data: unlocks } = await db
      .from('emergency_unlocks')
      .select('*')
      .eq('user_id', userId);

    // Calculate Metrics
    const totalFocusSeconds = sessions?.reduce((acc: number, s: any) => acc + (s.duration || 0), 0) || 0;
    const totalFocusHours = (totalFocusSeconds / 3600).toFixed(1);
    const deepWorkSeconds = sessions?.filter((s: any) => s.is_deep_work).reduce((acc: number, s: any) => acc + (s.duration || 0), 0) || 0;
    const deepWorkPercentage = totalFocusSeconds > 0 ? Math.round((deepWorkSeconds / totalFocusSeconds) * 100) : 0;

    // Calculate Top Distractions
    const distractionCounts: Record<string, number> = {};
    attempts?.forEach((a: any) => {
      distractionCounts[a.domain] = (distractionCounts[a.domain] || 0) + 1;
    });
    
    const topDistractions = Object.entries(distractionCounts)
      .map(([domain, count]) => ({
        domain,
        category: 'Distraction',
        attempts: count,
        timeSaved: count * 5, // Estimate 5 mins saved per block
        iconColor: '#EF4444'
      }))
      .sort((a, b) => b.attempts - a.attempts)
      .slice(0, 5);

    // Calculate Weekly Focus (last 7 days)
    const today = new Date();
    const weeklyMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      weeklyMap[d.toLocaleDateString('en-US', { weekday: 'short' })] = 0;
    }
    
    sessions?.forEach((s: any) => {
      const d = new Date(s.start_time);
      if (today.getTime() - d.getTime() <= 7 * 24 * 60 * 60 * 1000) {
        const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
        if (weeklyMap[dayStr] !== undefined) {
          weeklyMap[dayStr] += (s.duration || 0) / 3600;
        }
      }
    });

    const weeklyFocus = Object.entries(weeklyMap).map(([date, hours]) => ({
      date,
      focusHours: Number(hours.toFixed(1)),
      deepWorkHours: Number((hours * 0.8).toFixed(1)), // Estimated
      score: Math.min(100, Math.round(hours * 15))
    }));

    // Heatmap (Last 365 days)
    const heatmapData = Array.from({ length: 365 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (364 - i));
      const dateStr = d.toISOString().split('T')[0];
      const daySessions = sessions?.filter((s: any) => s.start_time?.startsWith(dateStr)) || [];
      const completedSessions = daySessions.filter((s: any) => s.completed !== false);
      const totalMinutes = completedSessions.reduce((acc: number, s: any) => acc + Math.round((s.duration || 0) / 60), 0);
      
      return {
        date: dateStr,
        sessions: daySessions.length,
        minutes: totalMinutes,
        completed: completedSessions.length
      };
    });

    // Calculate Emergency Unlocks Stats
    const totalEmergencyUnlocks = unlocks?.length || 0;
    const unlockReasonsMap: Record<string, number> = {
      'Work Related': 0,
      'Quick Check': 0,
      'Habit': 0,
      'Bored': 0
    };
    unlocks?.forEach((u: any) => {
      if (u.reason && unlockReasonsMap[u.reason] !== undefined) {
        unlockReasonsMap[u.reason]++;
      }
    });

    res.json({
      success: true,
      metrics: {
        dailyFocusScore: 85, // Stubbed for now
        focusScoreTrend: 5,
        totalFocusHours: Number(totalFocusHours),
        focusHoursTrend: 2,
        currentStreak: streaks?.current_streak || 0,
        bestStreak: streaks?.best_streak || 0,
        deepWorkPercentage,
        deepWorkTrend: 1
      },
      weeklyFocus,
      topDistractions,
      heatmapData,
      emergencyUnlocks: {
        total: totalEmergencyUnlocks,
        reasons: unlockReasonsMap
      },
      sessions: sessions?.slice(0, 10).map((s: any) => ({
        id: s.id,
        taskName: s.task_name || 'Deep Work',
        startTime: new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: Math.round(s.duration / 60),
        efficiency: s.efficiency_score || 0,
        aiNote: s.ai_coach_notes || 'Focus mode maintained.',
        tags: s.tags || []
      })) || []
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Log a blocked attempt (distraction)
router.post('/block-attempt', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const { domain, category } = req.body;
    
    if (!domain) {
      return res.status(400).json({ success: false, error: 'Domain is required' });
    }

    const { data, error } = await getSupabase()
      .from('blocked_attempts')
      .insert([{
        user_id: userId,
        domain,
        category: category || 'Uncategorized'
      }])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, attempt: data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Log an emergency unlock
router.post('/emergency-unlock', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const { domain, reason } = req.body;
    
    if (!domain || !reason) {
      return res.status(400).json({ success: false, error: 'Domain and reason are required' });
    }

    const validReasons = ['Work Related', 'Quick Check', 'Habit', 'Bored'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ success: false, error: 'Invalid reason' });
    }

    if (userId === 'user-1') {
      return res.json({
        success: true,
        unlock: {
          id: 'mock-unlock-id',
          user_id: userId,
          domain,
          reason,
          unlocked_at: new Date().toISOString()
        }
      });
    }

    const { data, error } = await getSupabase()
      .from('emergency_unlocks')
      .insert([{
        user_id: userId,
        domain,
        reason
      }])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, unlock: data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Log a coach event (distraction intervention outcome)
router.post('/coach-event', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const { domain, coachingMessage, action } = req.body;
    
    if (!domain || !coachingMessage || !action) {
      return res.status(400).json({ success: false, error: 'Domain, coachingMessage, and action are required' });
    }

    const validActions = ['Returned to Work', 'Unlocked'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ success: false, error: 'Invalid action' });
    }

    if (userId === 'user-1') {
      return res.json({
        success: true,
        event: {
          id: 'mock-coach-event-id',
          user_id: userId,
          domain,
          coaching_message: coachingMessage,
          action,
          created_at: new Date().toISOString()
        }
      });
    }

    const { data, error } = await getSupabase()
      .from('coach_events')
      .insert([{
        user_id: userId,
        domain,
        coaching_message: coachingMessage,
        action
      }])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, event: data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/analytics/weekly-reports — Get historical reports
router.get('/weekly-reports', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    if (userId === 'user-1') {
      // Mock historical reports
      const today = new Date();
      const format = (d: Date) => d.toISOString().split('T')[0];
      
      const reports = [
        {
          id: 'mock-report-1',
          user_id: userId,
          start_date: format(new Date(today.getTime() - 7 * 86400000)),
          end_date: format(today),
          focus_hours: 34.2,
          focus_score: 88,
          session_count: 15,
          completed_count: 13,
          unlock_reasons: { 'Work Related': 2, 'Quick Check': 1, 'Habit': 1 },
          top_distractions: [
            { domain: 'twitter.com', count: 12 },
            { domain: 'reddit.com', count: 8 }
          ],
          productivity_change: 14.5,
          ai_summary: "Your productivity improved by 14.5% compared to last week. You logged 34.2 hours of focus across 15 sessions, finishing 13 successfully. Excellent job managing distractions like twitter.com, which was blocked 12 times.",
          created_at: new Date().toISOString()
        },
        {
          id: 'mock-report-2',
          user_id: userId,
          start_date: format(new Date(today.getTime() - 14 * 86400000)),
          end_date: format(new Date(today.getTime() - 7 * 86400000)),
          focus_hours: 29.8,
          focus_score: 82,
          session_count: 18,
          completed_count: 14,
          unlock_reasons: { 'Bored': 3, 'Habit': 2 },
          top_distractions: [
            { domain: 'youtube.com', count: 15 },
            { domain: 'reddit.com', count: 10 }
          ],
          productivity_change: -5.2,
          ai_summary: "Your productivity dropped by 5.2% compared to the week before. You completed 14 out of 18 focus sessions, with boredom triggering 3 emergency unlocks. Keep working on minimizing visits to youtube.com.",
          created_at: new Date(today.getTime() - 7 * 86400000).toISOString()
        }
      ];
      return res.json({ success: true, reports });
    }

    const { data, error } = await getSupabase()
      .from('weekly_reports')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false });

    if (error) throw error;
    res.json({ success: true, reports: data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/analytics/weekly-reports/generate — Generate report on demand
router.post('/weekly-reports/generate', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    
    // Define dates for the report (last 7 days)
    const today = new Date();
    const startDateObj = new Date(today.getTime() - 7 * 86400000);
    const format = (d: Date) => d.toISOString().split('T')[0];
    const startDateStr = format(startDateObj);
    const endDateStr = format(today);

    if (userId === 'user-1') {
      const mockReport = {
        id: 'mock-report-' + Date.now(),
        user_id: userId,
        start_date: startDateStr,
        end_date: endDateStr,
        focus_hours: 36.5,
        focus_score: 91,
        session_count: 16,
        completed_count: 15,
        unlock_reasons: { 'Work Related': 1, 'Quick Check': 1 },
        top_distractions: [
          { domain: 'twitter.com', count: 8 },
          { domain: 'news.ycombinator.com', count: 5 }
        ],
        productivity_change: 6.7,
        ai_summary: "Your productivity improved 6.7% compared to last week. You logged 36.5 focus hours with a score of 91/100, finishing 15 of 16 sessions. Twitter attempts dropped to 8, indicating great self-discipline.",
        created_at: new Date().toISOString()
      };
      return res.json({ success: true, report: mockReport });
    }

    const db = getSupabase();

    // 1. Fetch focus sessions for the current week
    const { data: thisWeekSessions } = await db
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', startDateObj.toISOString())
      .lte('start_time', today.toISOString());

    // 2. Fetch focus sessions for the previous week (7-14 days ago)
    const prevWeekStart = new Date(today.getTime() - 14 * 86400000);
    const { data: prevWeekSessions } = await db
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', prevWeekStart.toISOString())
      .lte('start_time', startDateObj.toISOString());

    // 3. Fetch distractions (blocked attempts) for the current week
    const { data: distractions } = await db
      .from('blocked_attempts')
      .select('*')
      .eq('user_id', userId)
      .gte('attempted_at', startDateObj.toISOString())
      .lte('attempted_at', today.toISOString());

    // 4. Fetch unlocks for the current week
    const { data: unlocks } = await db
      .from('emergency_unlocks')
      .select('*')
      .eq('user_id', userId)
      .gte('unlocked_at', startDateObj.toISOString())
      .lte('unlocked_at', today.toISOString());

    // --- AGGREGATION LOGIC ---
    // Focus hours & completed counts
    const completedSessions = (thisWeekSessions || []).filter((s: any) => s.completed !== false);
    const totalFocusSeconds = completedSessions.reduce((acc: number, s: any) => acc + (s.duration || 0), 0);
    const focusHours = Number((totalFocusSeconds / 3600).toFixed(1));
    const sessionCount = (thisWeekSessions || []).length;
    const completedCount = completedSessions.length;

    // Focus score calculation (avg efficiency score of completed sessions)
    const avgScore = completedCount > 0
      ? completedSessions.reduce((acc: number, s: any) => acc + (s.efficiency_score || 70), 0) / completedCount
      : 70;
    const focusScore = Math.round(avgScore);

    // Productivity change vs previous week
    const prevCompletedSessions = (prevWeekSessions || []).filter((s: any) => s.completed !== false);
    const prevFocusSeconds = prevCompletedSessions.reduce((acc: number, s: any) => acc + (s.duration || 0), 0);
    
    let productivityChange = 0;
    if (prevFocusSeconds > 0) {
      productivityChange = Number((((totalFocusSeconds - prevFocusSeconds) / prevFocusSeconds) * 100).toFixed(1));
    }

    // Top distractions aggregation
    const distractionMap: Record<string, number> = {};
    (distractions || []).forEach((d: any) => {
      distractionMap[d.domain] = (distractionMap[d.domain] || 0) + 1;
    });
    const topDistractions = Object.entries(distractionMap)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Unlock reasons aggregation
    const unlockReasons: Record<string, number> = {
      'Work Related': 0,
      'Quick Check': 0,
      'Habit': 0,
      'Bored': 0
    };
    (unlocks || []).forEach((u: any) => {
      if (u.reason && unlockReasons[u.reason] !== undefined) {
        unlockReasons[u.reason]++;
      }
    });

    // 5. Generate AI Summary
    const aiSummary = await reportAiService.generateWeeklySummary({
      focusHours,
      focusScore,
      sessionCount,
      completedCount,
      unlockReasons,
      topDistractions,
      productivityChange
    });

    // 6. Save in DB
    const { data: newReport, error: saveError } = await db
      .from('weekly_reports')
      .insert([{
        user_id: userId,
        start_date: startDateStr,
        end_date: endDateStr,
        focus_hours: focusHours,
        focus_score: focusScore,
        session_count: sessionCount,
        completed_count: completedCount,
        unlock_reasons: unlockReasons,
        top_distractions: topDistractions,
        productivity_change: productivityChange,
        ai_summary: aiSummary
      }])
      .select()
      .single();

    if (saveError) throw saveError;
    res.json({ success: true, report: newReport });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/analytics/weekly-reports/:id/email — Serve raw HTML email report
router.get('/weekly-reports/:id/email', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const reportId = req.params.id;

    let reportData: any = null;

    if (userId === 'user-1') {
      // Mock data for user-1 email template rendering
      reportData = {
        start_date: '2026-05-27',
        end_date: '2026-06-03',
        focus_hours: 34.2,
        focus_score: 88,
        session_count: 15,
        completed_count: 13,
        unlock_reasons: { 'Work Related': 2, 'Quick Check': 1, 'Habit': 1 },
        top_distractions: [
          { domain: 'twitter.com', count: 12 },
          { domain: 'reddit.com', count: 8 }
        ],
        productivity_change: 14.5,
        ai_summary: "Your productivity improved by 14.5% compared to last week. You logged 34.2 hours of focus across 15 sessions, finishing 13 successfully. Excellent job managing distractions like twitter.com, which was blocked 12 times."
      };
    } else {
      const { data, error } = await getSupabase()
        .from('weekly_reports')
        .select('*')
        .eq('id', reportId)
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      reportData = data;
    }

    if (!reportData) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    const html = generateEmailReportHtml({
      startDate: reportData.start_date,
      endDate: reportData.end_date,
      focusHours: Number(reportData.focus_hours),
      focusScore: Number(reportData.focus_score),
      sessionCount: Number(reportData.session_count),
      completedCount: Number(reportData.completed_count),
      unlockReasons: reportData.unlock_reasons,
      topDistractions: reportData.top_distractions,
      productivityChange: Number(reportData.productivity_change),
      aiSummary: reportData.ai_summary
    });

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

