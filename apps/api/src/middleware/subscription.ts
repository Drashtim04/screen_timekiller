import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_KEY || 'placeholder'
);

/**
 * Express Middleware enforcing Pro Plan feature restrictions.
 */
export const requireProPlan = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Check user tier
    const { data: user, error } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    if (error || !user || user.subscription_tier !== 'premium') {
      return res.status(403).json({ 
        success: false, 
        error: 'Forbidden: This feature requires an active Pro subscription.',
        requiresUpgrade: true 
      });
    }

    next();
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Internal server subscription verification error' });
  }
};
