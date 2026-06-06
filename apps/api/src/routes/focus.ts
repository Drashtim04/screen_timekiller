import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
function getSupabase() {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_KEY || 'placeholder'
  );
}

// Get focus sessions for a user
router.get('/sessions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await getSupabase()
      .from('focus_sessions')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('start_time', { ascending: false });

    if (error) throw error;
    res.json({ success: true, sessions: data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Log a new focus session
router.post('/sessions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { task_name, start_time, end_time, duration, is_deep_work, efficiency_score, completed } = req.body;
    const { data, error } = await getSupabase()
      .from('focus_sessions')
      .insert([
        { 
          user_id: req.user!.id, 
          task_name: task_name || 'Focus Session',
          start_time: start_time ? new Date(start_time).toISOString() : new Date().toISOString(),
          end_time: end_time ? new Date(end_time).toISOString() : null,
          duration: duration || 0,
          is_deep_work: is_deep_work || false,
          efficiency_score: efficiency_score || 0,
          completed: completed !== undefined ? completed : true
        }
      ])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, session: data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
