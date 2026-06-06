import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

/**
 * Feature gating middleware — blocks access to Pro-only API routes
 * for users without an active subscription.
 *
 * Usage in routes:
 *   router.get('/pro-feature', requireAuth, requirePro, handler)
 *
 * Does NOT touch auth, analytics, blocking, or any existing routes.
 */

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  // Credentials are guaranteed by validateEnv() in index.ts before any request arrives.
  // No fallbacks — a missing value should surface immediately, not hide behind a network error.
  if (!url || !key) {
    throw new Error('[requirePro] SUPABASE_URL / SUPABASE_KEY not set. Check apps/api/.env.');
  }
  const { createClient } = require('@supabase/supabase-js');
  return createClient(url, key);
}

export const requirePro = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Demo mode user always has pro access
    if (userId === 'user-1') return next();

    const supabase = getSupabase();
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('status, renewal_date, plan')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing', 'past_due', 'cancelled'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !subscription) {
      return res.status(403).json({
        success: false,
        error: 'Pro subscription required',
        code: 'REQUIRES_PRO',
        upgrade_url: `${process.env.FRONTEND_URL}/dashboard`,
      });
    }

    // Check if subscription has expired (grace period / period end validation)
    if (subscription.renewal_date) {
      const renewalDate = new Date(subscription.renewal_date);
      // Give a 3-day grace period only for past_due status (renewal failed)
      // Cancelled status stops exactly on renewal_date
      const graceDays = subscription.status === 'past_due' ? 3 : 0;
      const gracePeriodEnd = new Date(renewalDate.getTime() + graceDays * 24 * 60 * 60 * 1000);
      if (new Date() > gracePeriodEnd) {
        return res.status(403).json({
          success: false,
          error: subscription.status === 'cancelled' ? 'Subscription cancelled and expired' : 'Subscription expired',
          code: 'SUBSCRIPTION_EXPIRED',
          upgrade_url: `${process.env.FRONTEND_URL}/dashboard`,
        });
      }
    }

    next();
  } catch (err: any) {
    console.error('[requirePro] Error:', err.message);
    return res.status(500).json({ success: false, error: 'Could not verify subscription' });
  }
};

/**
 * Soft feature gate — does not block, but attaches isPro flag to the request.
 * Useful for returning different data shapes based on plan.
 */
export const attachProStatus = async (
  req: AuthenticatedRequest & { isPro?: boolean },
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) { req.isPro = false; return next(); }

    // Demo user
    if (userId === 'user-1') { req.isPro = true; return next(); }

    const supabase = getSupabase();
    const { data } = await supabase
      .from('subscriptions')
      .select('status, renewal_date')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing', 'past_due', 'cancelled'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) {
      req.isPro = false;
      return next();
    }

    // Check if subscription has expired
    if (data.renewal_date) {
      const renewalDate = new Date(data.renewal_date);
      const graceDays = data.status === 'past_due' ? 3 : 0;
      const gracePeriodEnd = new Date(renewalDate.getTime() + graceDays * 24 * 60 * 60 * 1000);
      if (new Date() > gracePeriodEnd) {
        req.isPro = false;
        return next();
      }
    }

    req.isPro = true;
    next();
  } catch {
    req.isPro = false;
    next();
  }
};
