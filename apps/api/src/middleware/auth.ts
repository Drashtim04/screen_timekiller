import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// Lazy singleton — created on first request, after dotenv has loaded all env vars.
// Throws immediately if credentials are missing so the failure is obvious in logs.
let _supabase: any = null;
function getSupabase() {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_KEY;

    // Fail fast: refuse to create a Supabase client with missing or placeholder credentials.
    // This surfaces the real problem (missing env var) instead of hiding it behind a
    // network error from placeholder.supabase.co.
    if (!url || url.trim() === '' || url.includes('placeholder.supabase.co')) {
      throw new Error(
        '[Auth] SUPABASE_URL is missing or still set to the placeholder value. ' +
        'Set a real URL in apps/api/.env before starting the server.'
      );
    }
    if (!key || key.trim() === '' || key === 'placeholder') {
      throw new Error(
        '[Auth] SUPABASE_KEY is missing or still set to the placeholder value. ' +
        'Set a real anon key in apps/api/.env before starting the server.'
      );
    }

    // Dynamic require keeps this outside the ES-module import hoisting phase.
    const { createClient } = require('@supabase/supabase-js');
    _supabase = createClient(url, key);   // No || fallbacks — credentials are validated above.
  }
  return _supabase;
}

/**
 * Express middleware that verifies the Supabase JWT in the Authorization header.
 *
 * Two token types are accepted:
 *  1. 'mock-jwt-token-123' — accepted in DEMO_MODE for local development without a live Supabase project.
 *  2. Real Supabase JWTs — verified via supabase.auth.getUser().
 */
export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];

    // --- DEMO / MOCK BYPASS ---
    // Accepted when DEMO_MODE=true OR whenever the mock token is presented,
    // so the dashboard can still call the API without a live Supabase project.
    if (token === 'mock-jwt-token-123') {
      req.user = { id: 'user-1', email: 'demo@deepwork.ai' };
      return next();
    }

    // --- REAL SUPABASE JWT VERIFICATION ---
    const supabase = getSupabase();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ success: false, error: 'Unauthorized: invalid or expired token' });
    }

    req.user = {
      id: user.id,
      email: user.email || '',
    };

    next();
  } catch (error: any) {
    console.error('[Auth] Middleware error:', error.message);
    return res.status(500).json({ success: false, error: 'Internal server auth error' });
  }
};
