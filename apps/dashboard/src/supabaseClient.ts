import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Missing env vars. Auth will not work until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
}

/**
 * Singleton Supabase client for the dashboard.
 * Import this wherever you need direct Supabase access.
 * Kept separate from AuthContext to avoid React HMR conflicts.
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      // Persist session in localStorage across page refreshes AND browser restarts
      persistSession: true,
      // Automatically refresh tokens before they expire
      autoRefreshToken: true,
      // Required for PKCE OAuth code exchange (Google OAuth default in Supabase v2)
      detectSessionInUrl: true,
      // Use PKCE (Proof Key for Code Exchange) — Supabase v2 default for OAuth
      // This is required for Google OAuth to correctly exchange the ?code= param after redirect
      flowType: 'pkce',
      // Namespaced storage key prevents session collisions between projects on localhost
      storageKey: 'deepwork-ai-auth',
    },
  }
);
