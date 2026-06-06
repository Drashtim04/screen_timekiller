import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

/**
 * When VITE_DEMO_MODE=true, auth is bypassed with a mock user so the UI
 * can be tested without a live Supabase project. All real auth methods still
 * exist and can be called — they simply no-op in demo mode.
 */
const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

// Demo session constant — stored in localStorage so it survives browser restarts
const MOCK_SESSION: any = {
  access_token: 'mock-jwt-token-123',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: {
    id: 'user-1',
    email: 'demo@deepwork.ai',
    role: 'authenticated',
  },
};

// localStorage key used to persist demo session across browser restarts
const DEMO_SESSION_KEY = 'deepwork-ai-demo-session';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isDemoMode: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, pass: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Debounce ref: collapses rapid concurrent syncTokenToExtension calls
  // (getSession + onAuthStateChange both fire on login within milliseconds of each other).
  const syncDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // --- DEMO MODE: skip all Supabase network calls ---
    // Persist demo session to localStorage so it survives browser restarts.
    if (IS_DEMO_MODE) {
      try { localStorage.setItem(DEMO_SESSION_KEY, 'true'); } catch (_) {}
      setSession(MOCK_SESSION);
      setUser(MOCK_SESSION.user);
      setIsLoading(false);
      syncTokenToExtension(MOCK_SESSION);
      return;
    }

    // Restore demo session after browser restart (when DEMO_MODE was previously active)
    // This handles the edge case where env var is read before localStorage is cleared.
    try {
      if (localStorage.getItem(DEMO_SESSION_KEY) === 'true' && IS_DEMO_MODE) {
        setSession(MOCK_SESSION);
        setUser(MOCK_SESSION.user);
        setIsLoading(false);
        syncTokenToExtension(MOCK_SESSION);
        return;
      }
    } catch (_) {}

    // --- REAL AUTH ---
    // 1. Restore existing session from localStorage (handles page refreshes).
    //    Also exchanges the #access_token hash from Google OAuth redirects.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      syncTokenToExtension(session);
    });

    // 2. Listen for any future auth state changes (login, logout, token refresh).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      syncTokenToExtension(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 3. Listen to realtime database changes on user's subscription record.
  //    This ensures that when a webhook updates the DB, we instantly sync the updated
  //    plan status to the chrome extension without requiring logout/login.
  useEffect(() => {
    if (IS_DEMO_MODE || !session?.user?.id) return;

    const channel = supabase
      .channel(`sub-changes-${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${session.user.id}`,
        },
        () => {
          console.log('[AuthContext] Realtime subscription change detected. Syncing with extension...');
          syncTokenToExtension(session);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  /**
   * Sends the active JWT + plan status to the Chrome extension.
   *
   * Debounced at 300ms: getSession() and onAuthStateChange both fire on login
   * within milliseconds of each other. Without debouncing, two SYNC_AUTH messages
   * race to write to chrome.storage — the second one wins arbitrarily.
   */
  const syncTokenToExtension = (session: Session | null) => {
    // Cancel any pending sync and reschedule — only the last call within 300ms fires.
    if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
    syncDebounceRef.current = setTimeout(() => _doSyncTokenToExtension(session), 300);
  };

  const _doSyncTokenToExtension = async (session: Session | null) => {
    const extensionId = import.meta.env.VITE_EXTENSION_ID;
    if (!extensionId) return;
    const chrome = (window as any).chrome;
    if (typeof window === 'undefined' || !chrome?.runtime) return;

    let isPro = false;
    if (IS_DEMO_MODE) {
      isPro = true;
    } else if (session?.user?.id) {
      try {
        // maybeSingle() returns null (not an error) when the user has no subscription row.
        // This is the normal state for new/free users — avoids a PGRST116 throw from .single().
        const { data, error } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('user_id', session.user.id)
          .in('status', ['active', 'trialing'])
          .limit(1)
          .maybeSingle();
        if (error) console.warn('[AuthContext] Subscription lookup error:', error.message);
        isPro = !!data;
      } catch (err: any) {
        console.warn('[AuthContext] Unexpected subscription lookup failure:', err?.message);
      }
    }

    try {
      chrome.runtime.sendMessage(
        extensionId,
        {
          type: 'SYNC_AUTH',
          session: session
            ? { access_token: session.access_token, user: session.user }
            : null,
          isPro,
        },
        () => {
          // Log any connection error so it's visible during debugging.
          // Common causes: extension not installed, externally_connectable mismatch.
          if (chrome.runtime.lastError) {
            console.warn('[AuthContext] Extension sync error:', chrome.runtime.lastError.message);
          }
        }
      );
    } catch (err: any) {
      // Thrown when chrome.runtime.sendMessage is called with no extension listeners.
      // Safe to ignore in production — extension is not installed.
      console.warn('[AuthContext] Extension not reachable:', err?.message);
    }
  };


  const signInWithGoogle = async () => {
    if (IS_DEMO_MODE) { window.location.reload(); return; }
    // Build an explicit absolute redirect URL.
    // Must match exactly what is registered in:
    //   1. Supabase Dashboard → Auth → URL Configuration → Redirect URLs
    //   2. Google Cloud Console → OAuth 2.0 → Authorized redirect URIs
    //      (those point to https://<project>.supabase.co/auth/v1/callback — set by Supabase)
    //
    // For localhost dev:  http://localhost:5173/dashboard
    // For production:     https://yourdomain.com/dashboard
    //
    // VITE_SITE_URL can be set in .env for explicit production override.
    const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
    const redirectTo = `${siteUrl}/dashboard`;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        // PKCE flow: Supabase will append ?code= to the redirectTo URL.
        // detectSessionInUrl + flowType: 'pkce' in supabaseClient.ts handles the exchange.
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
  };

  const signInWithEmail = async (email: string, pass: string): Promise<{ error: any }> => {
    if (IS_DEMO_MODE) return { error: null };
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    return { error };
  };

  const signUpWithEmail = async (email: string, pass: string): Promise<{ error: any }> => {
    if (IS_DEMO_MODE) return { error: null };
    // Use the same explicit site URL as Google OAuth for consistency
    const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        // Redirect the email confirmation link back to the dashboard
        emailRedirectTo: `${siteUrl}/dashboard`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    if (IS_DEMO_MODE) {
      // Clear demo session persistence so browser restart doesn't restore it
      try { localStorage.removeItem(DEMO_SESSION_KEY); } catch (_) {}
      return;
    }
    await supabase.auth.signOut();
    syncTokenToExtension(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, isLoading, isDemoMode: IS_DEMO_MODE, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
