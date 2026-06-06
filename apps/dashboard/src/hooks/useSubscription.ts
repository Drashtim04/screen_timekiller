import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

const apiUrl    = import.meta.env.VITE_API_URL    || 'http://localhost:3001';
const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

declare global {
  interface Window { Cashfree?: any; }
}

export interface SubscriptionDetail {
  plan:          string;
  status:        string;
  billing_cycle: string;
  renewal_date:  string | null;
  start_date:    string | null;
  cancelled_at:  string | null;
  demo?:         boolean;
}

export interface PaymentTransaction {
  id:            string;
  order_id:      string;
  payment_id?:   string;
  amount:        number;
  currency:      string;
  status:        string;
  plan:          string;
  billing_cycle: string;
  created_at:    string;
}

export function useSubscription() {
  const { user, session } = useAuth();

  const [tier, setTier]                 = useState<'free' | 'premium'>('free');
  const [loading, setLoading]           = useState(true);
  const [upgrading, setUpgrading]       = useState(false);
  const [cancelling, setCancelling]     = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionDetail | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);

  // ── Auth header helper ──────────────────────────────────────────────
  const authHeader = useCallback(() => ({
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type':  'application/json',
  }), [session?.access_token]);

  // ── Refresh subscription status from DB and API ───────────────────
  const refresh = useCallback(() => {
    if (!user) return;

    // 1. Quick tier read from users table
    supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.warn('[useSubscription] users lookup error:', error.message);
        if (data) setTier(data.subscription_tier as 'free' | 'premium');
      })
      .catch((err) => {
        console.warn('[useSubscription] Unexpected users lookup failure:', err?.message);
      });

    // 2. Load full subscription detail from API
    if (session?.access_token) {
      fetch(`${apiUrl}/api/payments/subscription`, { headers: authHeader() })
        .then(r => r.json())
        .then(data => {
          if (data.success && data.subscription) {
            setSubscription(data.subscription);
            if (data.subscription.status === 'active' || data.subscription.status === 'trialing') {
              setTier('premium');
            } else {
              setTier('free');
            }
          } else {
            setSubscription(null);
            setTier('free');
          }
        })
        .catch(console.error);
    }
  }, [user, session?.access_token, authHeader]);

  // ── Load subscription tier + detail on mount / user change ──────────
  useEffect(() => {
    if (!user) {
      setTier('free');
      setSubscription(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    if (isDemoMode) {
      setTier('premium');
      setSubscription({
        plan: 'pro',
        status: 'active',
        billing_cycle: 'monthly',
        renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        start_date: new Date().toISOString(),
        cancelled_at: null,
        demo: true,
      });
      setLoading(false);
      return;
    }

    // Initial fetch
    refresh();
    setLoading(false);

    // Subscribe to realtime database changes for the user's subscription and user row.
    // This allows the dashboard to reflect successful payment status instantly.
    const channel = supabase
      .channel(`db-sub-changes-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          console.log('[useSubscription] Subscription record updated in DB. Refreshing...');
          refresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`,
        },
        () => {
          console.log('[useSubscription] User record updated in DB. Refreshing...');
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isDemoMode, refresh]);

  // ── Fetch payment history ───────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res  = await fetch(`${apiUrl}/api/payments/history`, { headers: authHeader() });
      const data = await res.json();
      if (data.success) setTransactions(data.transactions || []);
    } catch (err) {
      console.error('[useSubscription] fetchHistory error:', err);
    }
  }, [session?.access_token]);

  // ── Cashfree JS SDK loader ──────────────────────────────────────────
  const loadCashfreeSDK = (): Promise<void> => new Promise((resolve) => {
    if (window.Cashfree) return resolve();
    const script  = document.createElement('script');
    script.src    = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.onload = () => resolve();
    document.head.appendChild(script);
  });

  // ── DEMO: instant upgrade ───────────────────────────────────────────
  const handleDemoUpgrade = async (plan = 'pro', billingCycle = 'monthly') => {
    if (!session?.access_token || upgrading) return;
    setUpgrading(true);
    try {
      await new Promise(r => setTimeout(r, 1200)); // simulate loading

      const res  = await fetch(`${apiUrl}/api/payments/subscribe`, {
        method:  'POST',
        headers: authHeader(),
        body:    JSON.stringify({ plan, billing_cycle: billingCycle }),
      });
      const data = await res.json();

      if (data.success) {
        setTier('premium');
        setSubscription({
          plan,
          status:        'active',
          billing_cycle: billingCycle,
          renewal_date:  data.renewal_date,
          start_date:    new Date().toISOString(),
          cancelled_at:  null,
          demo:          true,
        });
      }
    } catch (err) {
      console.error('[Demo] upgrade error:', err);
    } finally {
      setUpgrading(false);
    }
  };

  // ── PRODUCTION: Cashfree checkout ──────────────────────────────────
  const handleRealUpgrade = async (plan = 'pro', billingCycle = 'monthly') => {
    if (!session?.access_token || upgrading) return;
    setUpgrading(true);
    try {
      const res  = await fetch(`${apiUrl}/api/payments/subscribe`, {
        method:  'POST',
        headers: authHeader(),
        body:    JSON.stringify({ plan, billing_cycle: billingCycle }),
      });
      const { order_id, payment_session_id } = await res.json();
      if (!payment_session_id) throw new Error('No payment session returned');

      await loadCashfreeSDK();
      const cashfree = window.Cashfree({ mode: import.meta.env.VITE_CASHFREE_ENV || 'sandbox' });
      cashfree.checkout({ paymentSessionId: payment_session_id, redirectTarget: '_self' });
    } catch (err) {
      console.error('[Cashfree] checkout error:', err);
      setUpgrading(false);
    }
  };

  // ── Cancel subscription ─────────────────────────────────────────────
  const cancelSubscription = async () => {
    if (!session?.access_token || cancelling) return false;
    setCancelling(true);
    try {
      const res  = await fetch(`${apiUrl}/api/payments/cancel`, {
        method:  'POST',
        headers: authHeader(),
      });
      const data = await res.json();
      if (data.success) {
        setSubscription(prev => prev ? { ...prev, status: 'cancelled', cancelled_at: new Date().toISOString() } : null);
        return true;
      }
      return false;
    } catch (err) {
      console.error('[Cancel] error:', err);
      return false;
    } finally {
      setCancelling(false);
    }
  };

  // ── Verify a completed payment by orderId (called on redirect back) ─
  const verifyPayment = async (orderId: string) => {
    if (!session?.access_token) return null;
    try {
      const res  = await fetch(`${apiUrl}/api/payments/verify/${orderId}`, { headers: authHeader() });
      const data = await res.json();
      if (data.upgraded) {
        setTier('premium');
        // Refresh subscription detail
        fetch(`${apiUrl}/api/payments/subscription`, { headers: authHeader() })
          .then(r => r.json())
          .then(d => { if (d.success && d.subscription) setSubscription(d.subscription); });
      }
      return data;
    } catch (err) {
      console.error('[Verify] error:', err);
      return null;
    }
  };

  const handleUpgrade = isDemoMode
    ? (plan?: string, billingCycle?: string) => handleDemoUpgrade(plan, billingCycle)
    : (plan?: string, billingCycle?: string) => handleRealUpgrade(plan, billingCycle);

  return {
    // Existing (unchanged API surface)
    tier,
    loading,
    upgrading,
    isDemoMode,
    handleUpgrade,

    // New additions
    subscription,
    transactions,
    cancelling,
    cancelSubscription,
    verifyPayment,
    fetchHistory,

    // Convenience flags
    isPro:      tier === 'premium',
    isActive:   subscription?.status === 'active' || subscription?.status === 'trialing',
    renewalDate: subscription?.renewal_date ? new Date(subscription.renewal_date) : null,
  };
}
