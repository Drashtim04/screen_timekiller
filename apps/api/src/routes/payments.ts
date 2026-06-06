import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import {
  createCashfreeOrder,
  createCashfreeSubscription,
  cancelCashfreeSubscription,
  fetchCashfreeSubscription,
  fetchCashfreeOrder,
  calcRenewalDate,
  PLAN_AMOUNTS,
  CASHFREE_PLAN_IDS,
} from '../services/cashfreeService';

const router = Router();

const isDemoMode = process.env.DEMO_MODE === 'true';

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  // Credentials guaranteed by validateEnv() in index.ts — no placeholder fallbacks.
  if (!url || !key) throw new Error('[payments] SUPABASE_URL / SUPABASE_KEY not set.');
  const { createClient } = require('@supabase/supabase-js');
  return createClient(url, key);
}

// ─────────────────────────────────────────────────────────────
// EXISTING: POST /api/payments/create-order (one-time order)
// ─────────────────────────────────────────────────────────────
router.post('/create-order', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId    = req.user?.id;
    const userEmail = req.user?.email || '';
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const plan         = (req.body.plan as string)         || 'pro';
    const billingCycle = (req.body.billing_cycle as string) || 'monthly';
    const amount       = PLAN_AMOUNTS[plan]?.[billingCycle] || 999;

    if (isDemoMode) {
      const demoOrderId = `demo_order_${userId}_${Date.now()}`;
      console.log(`[Demo] Simulated order created: ${demoOrderId}`);
      return res.json({
        order_id:           demoOrderId,
        payment_session_id: `demo_session_${Date.now()}`,
        order_amount:       amount,
        demo:               true,
      });
    }

    const orderId = `dw_${plan}_${userId}_${Date.now()}`;
    const order   = await createCashfreeOrder({
      orderId,
      amount,
      currency:       'INR',
      customerId:     userId,
      customerEmail:  userEmail,
      customerPhone:  req.body.phone || '9999999999',
      plan,
      billingCycle,
      frontendUrl:    process.env.FRONTEND_URL || 'http://localhost:5173',
      apiUrl:         process.env.API_URL       || 'http://localhost:3001',
    });

    res.json({
      order_id:           order.order_id,
      payment_session_id: order.payment_session_id,
      order_amount:       amount,
    });
  } catch (err: any) {
    console.error('[Cashfree] create-order error:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/payments/subscribe
// Creates a TRUE recurring Cashfree subscription (mandate capture).
// On success, Cashfree fires SUBSCRIPTION_STATUS_CHANGE (ACTIVE) webhook
// which activates the user — this endpoint only returns the session ID.
// ─────────────────────────────────────────────────────────────
router.post('/subscribe', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId    = req.user?.id;
    const userEmail = req.user?.email || '';
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const plan         = (req.body.plan         as string) || 'pro';
    const billingCycle = (req.body.billing_cycle as string) || 'monthly';
    const amount       = PLAN_AMOUNTS[plan]?.[billingCycle] || 999;

    // ── DEMO MODE ──
    if (isDemoMode) {
      const supabase    = getSupabase();
      const renewalDate = calcRenewalDate(billingCycle as any);
      const demoOrderId = `demo_sub_${userId}_${Date.now()}`;

      await supabase.from('subscriptions').upsert({
        user_id:            userId,
        plan,
        status:             'active',
        billing_cycle:      billingCycle,
        start_date:         new Date().toISOString(),
        renewal_date:       renewalDate.toISOString(),
        current_period_end: renewalDate.toISOString(),
        cashfree_order_id:  demoOrderId,
        payment_id:         `demo_pay_${Date.now()}`,
      }, { onConflict: 'user_id' });

      await supabase.from('users').update({ subscription_tier: 'premium' }).eq('id', userId);
      await supabase.from('payment_transactions').insert({
        user_id:       userId,
        order_id:      demoOrderId,
        payment_id:    `demo_pay_${Date.now()}`,
        amount,
        currency:      'INR',
        status:        'PAID',
        plan,
        billing_cycle: billingCycle,
        gateway_event: 'DEMO_UPGRADE',
      });

      console.log(`[Demo] User ${userId} subscribed to ${plan} (${billingCycle})`);
      return res.json({
        success:       true,
        demo:          true,
        plan,
        billing_cycle: billingCycle,
        renewal_date:  renewalDate.toISOString(),
        message:       `Demo subscription activated. Renews ${renewalDate.toDateString()}.`,
      });
    }

    // ── PRODUCTION: create a true Cashfree recurring subscription ──
    // The plan_id must exist in Cashfree Dashboard → Subscriptions → Plans.
    const planId         = CASHFREE_PLAN_IDS[plan]?.[billingCycle];
    const subscriptionId = `dw_sub_${plan}_${userId}_${Date.now()}`;

    const subscription = await createCashfreeSubscription({
      subscriptionId,
      planId,
      amount,
      currency:      'INR',
      customerId:    userId,
      customerEmail: userEmail,
      customerPhone: req.body.phone || '9999999999',
      customerName:  req.body.name  || userEmail.split('@')[0],
      billingCycle:  billingCycle as 'monthly' | 'yearly',
      frontendUrl:   process.env.FRONTEND_URL || 'http://localhost:5173',
      apiUrl:        process.env.API_URL       || 'http://localhost:3001',
    });

    // Record a pending transaction — webhook SUBSCRIPTION_STATUS_CHANGE (ACTIVE)
    // will activate the user once the mandate is captured.
    const supabase = getSupabase();
    await supabase.from('payment_transactions').insert({
      user_id:         userId,
      order_id:        subscriptionId,
      subscription_id: subscription.subscription_id,
      amount,
      currency:        'INR',
      status:          'PENDING',
      plan,
      billing_cycle:   billingCycle,
      gateway_event:   'SUBSCRIPTION_CREATED',
    });

    res.json({
      // payment_session_id is used by Cashfree JS SDK for mandate capture UI
      payment_session_id: subscription.payment_session_id,
      subscription_id:    subscription.subscription_id,
      plan,
      billing_cycle:      billingCycle,
      order_amount:       amount,
    });
  } catch (err: any) {
    console.error('[Cashfree] subscribe error:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Failed to initiate subscription' });
  }
});

// ─────────────────────────────────────────────────────────────
// EXISTING: POST /api/payments/demo-upgrade
// ─────────────────────────────────────────────────────────────
router.post('/demo-upgrade', requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!isDemoMode) {
    return res.status(403).json({ error: 'Demo mode is not enabled' });
  }
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const supabase    = getSupabase();
    const renewalDate = calcRenewalDate('monthly');

    await supabase.from('subscriptions').upsert({
      user_id:            userId,
      plan:               'pro',
      status:             'active',
      billing_cycle:      'monthly',
      start_date:         new Date().toISOString(),
      renewal_date:       renewalDate.toISOString(),
      current_period_end: renewalDate.toISOString(),
      cashfree_order_id:  `demo_${Date.now()}`,
      payment_id:         `demo_pay_${Date.now()}`,
    }, { onConflict: 'user_id' });

    await supabase.from('users').update({ subscription_tier: 'premium' }).eq('id', userId);

    console.log(`[Demo] User ${userId} instantly upgraded to Premium.`);
    res.json({ success: true, message: 'Demo upgrade successful — user is now Premium.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// EXISTING: GET /api/payments/verify/:orderId
// ─────────────────────────────────────────────────────────────
router.get('/verify/:orderId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { orderId } = req.params;
    const userId      = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const supabase = getSupabase();

    // 1. Quick check: check if the database already has an active subscription for this user
    // (e.g. if the webhook already fired and processed the success asynchronously).
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('status, plan, billing_cycle')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .limit(1)
      .maybeSingle();

    if (existingSub) {
      return res.json({ status: 'ACTIVE', upgraded: true });
    }

    // 2. Demo mode verification
    if (isDemoMode && orderId.startsWith('demo_')) {
      const renewalDate = calcRenewalDate('monthly');
      await supabase.from('subscriptions').upsert({
        user_id:            userId,
        plan:               'pro',
        status:             'active',
        billing_cycle:      'monthly',
        start_date:         new Date().toISOString(),
        renewal_date:       renewalDate.toISOString(),
        current_period_end: renewalDate.toISOString(),
        cashfree_order_id:  orderId,
      }, { onConflict: 'user_id' });
      await supabase.from('users').update({ subscription_tier: 'premium' }).eq('id', userId);
      return res.json({ status: 'PAID', upgraded: true, demo: true });
    }

    // 3. Subscription verification (recurring plan mandate status)
    if (orderId.startsWith('dw_sub_')) {
      // Find subscription ID from transaction history
      const { data: tx } = await supabase
        .from('payment_transactions')
        .select('subscription_id, plan, billing_cycle')
        .eq('order_id', orderId)
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      const subscriptionId = tx?.subscription_id || orderId;

      try {
        const subData = await fetchCashfreeSubscription(subscriptionId);
        const subStatus = subData.subscription_status || '';

        if (subStatus === 'ACTIVE') {
          const plan = tx?.plan || 'pro';
          const billingCycle = tx?.billing_cycle || 'monthly';
          const renewalDate = calcRenewalDate(billingCycle as any);

          await supabase.from('subscriptions').upsert({
            user_id:            userId,
            plan,
            status:             'active',
            billing_cycle:      billingCycle,
            start_date:         new Date().toISOString(),
            renewal_date:       renewalDate.toISOString(),
            current_period_end: renewalDate.toISOString(),
            subscription_id:    subscriptionId,
          }, { onConflict: 'user_id' });

          await supabase.from('users').update({ subscription_tier: 'premium' }).eq('id', userId);

          await supabase.from('payment_transactions')
            .update({ status: 'PAID', gateway_event: 'SUBSCRIPTION_VERIFIED' })
            .eq('order_id', orderId);

          return res.json({ status: 'ACTIVE', upgraded: true });
        }

        return res.json({ status: subStatus, upgraded: false });
      } catch (err: any) {
        console.warn(`[Verify] Cashfree subscription fetch failed: ${err.message}`);
        // Fallback: check again if webhook completed in the background
        const { data: secondCheck } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('user_id', userId)
          .in('status', ['active', 'trialing'])
          .limit(1)
          .maybeSingle();

        if (secondCheck) {
          return res.json({ status: 'ACTIVE', upgraded: true });
        }
        return res.json({ status: 'PENDING', upgraded: false });
      }
    }

    // 4. One-time Order verification (backwards compatibility)
    const order = await fetchCashfreeOrder(orderId);

    if (order.order_status === 'PAID') {
      const renewalDate = calcRenewalDate('monthly');
      const plan        = order.order_tags?.plan || 'pro';
      const billingCycle = order.order_tags?.billing_cycle || 'monthly';

      await supabase.from('subscriptions').upsert({
        user_id:            userId,
        plan,
        status:             'active',
        billing_cycle:      billingCycle,
        start_date:         new Date().toISOString(),
        renewal_date:       renewalDate.toISOString(),
        current_period_end: renewalDate.toISOString(),
        cashfree_order_id:  orderId,
      }, { onConflict: 'user_id' });

      await supabase.from('payment_transactions').upsert({
        user_id:       userId,
        order_id:      orderId,
        amount:        order.order_amount,
        currency:      order.order_currency || 'INR',
        status:        'PAID',
        plan,
        billing_cycle: billingCycle,
        gateway_event: 'ORDER_VERIFIED',
      }, { onConflict: 'order_id' });

      await supabase.from('users').update({ subscription_tier: 'premium' }).eq('id', userId);
      return res.json({ status: 'PAID', upgraded: true });
    }

    res.json({ status: order.order_status, upgraded: false });
  } catch (err: any) {
    console.error('[Cashfree] verify error:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// ─────────────────────────────────────────────────────────────
// NEW: GET /api/payments/subscription
// Returns the user's current subscription details.
// ─────────────────────────────────────────────────────────────
router.get('/subscription', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Demo user
    if (isDemoMode && userId === 'user-1') {
      return res.json({
        success: true,
        subscription: {
          plan:         'pro',
          status:       'active',
          billing_cycle: 'monthly',
          renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          start_date:   new Date().toISOString(),
          demo:         true,
        },
      });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('subscriptions')
      .select('plan, status, billing_cycle, start_date, renewal_date, current_period_end, cancelled_at, subscription_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return res.json({ success: true, subscription: null, plan: 'free' });
    }

    res.json({ success: true, subscription: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/payments/cancel
// Cancels a subscription at period end:
//  1. Calls Cashfree to stop auto-renewal (real production subscriptions)
//  2. Marks DB row as cancelled (access continues until renewal_date)
// ─────────────────────────────────────────────────────────────
router.post('/cancel', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    if (isDemoMode && userId === 'user-1') {
      return res.json({
        success: true,
        message: 'Demo subscription cancelled. Access continues until period end.',
        demo:    true,
      });
    }

    const supabase = getSupabase();

    // Fetch the current subscription to get the Cashfree subscription_id
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('subscription_id, status')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .limit(1)
      .maybeSingle();

    // Cancel at Cashfree if a real subscription mandate exists
    if (sub?.subscription_id) {
      try {
        await cancelCashfreeSubscription(sub.subscription_id);
        console.log(`[Cancel] Cashfree subscription ${sub.subscription_id} cancelled for user ${userId}`);
      } catch (cfErr: any) {
        // Log but don't block — Cashfree may already be cancelled or in sandbox
        console.warn(`[Cancel] Cashfree cancel call failed (continuing with DB update): ${cfErr?.message}`);
      }
    }

    // Mark as cancelled in DB — access continues until renewal_date
    // requirePro grace period logic handles actual access expiry.
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status:       'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .in('status', ['active', 'trialing']);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Subscription cancelled. Your Pro access continues until the end of the current billing period.',
    });
  } catch (err: any) {
    console.error('[Cancel] Error:', err.message);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// ─────────────────────────────────────────────────────────────
// NEW: GET /api/payments/history
// Returns the user's payment transaction history.
// ─────────────────────────────────────────────────────────────
router.get('/history', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    if (isDemoMode && userId === 'user-1') {
      return res.json({
        success: true,
        transactions: [
          {
            id:            'demo-tx-1',
            order_id:      'demo_sub_user-1_example',
            amount:        999,
            currency:      'INR',
            status:        'PAID',
            plan:          'pro',
            billing_cycle: 'monthly',
            created_at:    new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
            demo:          true,
          },
        ],
      });
    }

    const supabase = getSupabase();
    const page     = Number(req.query.page)  || 1;
    const limit    = Number(req.query.limit) || 10;
    const offset   = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('payment_transactions')
      .select('id, order_id, payment_id, amount, currency, status, plan, billing_cycle, created_at', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success:      true,
      transactions: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err: any) {
    console.error('[History] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

export default router;
