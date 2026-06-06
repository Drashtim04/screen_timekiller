import { Router, Request, Response } from 'express';
import { verifyCashfreeWebhook, calcRenewalDate } from '../services/cashfreeService';

const router = Router();

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  // Credentials guaranteed by validateEnv() in index.ts — no placeholder fallbacks.
  if (!url || !key) throw new Error('[webhook] SUPABASE_URL / SUPABASE_KEY not set.');
  const { createClient } = require('@supabase/supabase-js');
  return createClient(url, key);
}

/**
 * Helper: record a payment transaction row (idempotent via onConflict order_id).
 */
async function recordTransaction(supabase: any, payload: {
  userId:       string;
  orderId:      string;
  paymentId?:   string;
  subId?:       string;
  amount:       number;
  currency:     string;
  status:       string;
  plan:         string;
  billingCycle: string;
  event:        string;
  raw:          any;
}) {
  await supabase.from('payment_transactions').upsert({
    user_id:        payload.userId,
    order_id:       payload.orderId,
    payment_id:     payload.paymentId  || null,
    subscription_id: payload.subId     || null,
    amount:         payload.amount,
    currency:       payload.currency   || 'INR',
    status:         payload.status,
    plan:           payload.plan       || 'pro',
    billing_cycle:  payload.billingCycle || 'monthly',
    gateway_event:  payload.event,
    raw_payload:    payload.raw,
  }, { onConflict: 'order_id' });
}

/**
 * POST /api/webhook
 * Cashfree sends all payment + subscription lifecycle events here.
 */
router.post('/', async (req: Request, res: Response) => {
  if (!Buffer.isBuffer(req.body)) {
    console.error('[Webhook] Expected body to be a raw Buffer. Ensure index.ts is configured correctly.');
    return res.status(400).json({ error: 'Expected raw body Buffer' });
  }

  const rawBody = req.body.toString('utf8');
  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch (err: any) {
    console.error('[Webhook] JSON parse error:', err.message);
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const signature = req.headers['x-webhook-signature'] as string;
  const timestamp = req.headers['x-webhook-timestamp'] as string;

  // ── Signature Verification ──
  // In sandbox mode Cashfree may not send a real signature — allow bypass.
  if (process.env.CASHFREE_ENV !== 'sandbox' || signature) {
    try {
      verifyCashfreeWebhook(signature, rawBody, timestamp);
    } catch (sigErr) {
      console.error('[Webhook] Signature verification failed:', sigErr);
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    // ── Timestamp Freshness Check ──
    if (timestamp) {
      const timestampMs = Number(timestamp);
      const now = Date.now();
      const fiveMinutesMs = 5 * 60 * 1000;
      if (isNaN(timestampMs) || Math.abs(now - timestampMs) > fiveMinutesMs) {
        console.error('[Webhook] Webhook timestamp outside of valid 5-minute window:', timestamp);
        return res.status(400).json({ error: 'Webhook timestamp expired or invalid' });
      }
    }
  }

  const eventType: string = event?.type || event?.event_type || '';
  const supabase  = getSupabase();

  console.log(`[Webhook] Event: ${eventType}`);

  try {
    switch (eventType) {

      // ── Payment Succeeded ──────────────────────────────────────────────
      case 'PAYMENT_SUCCESS_WEBHOOK': {
        const orderId    = event?.data?.order?.order_id      || '';
        const paymentId  = event?.data?.payment?.cf_payment_id?.toString() || '';
        const customerId = event?.data?.order?.customer_details?.customer_id || '';
        const amount     = Number(event?.data?.order?.order_amount) || 0;
        const plan       = event?.data?.order?.order_tags?.plan          || 'pro';
        const billingCycle = event?.data?.order?.order_tags?.billing_cycle || 'monthly';

        if (!customerId || !orderId) break;

        // Verify transaction exists and matches customer
        const { data: tx, error: txErr } = await supabase
          .from('payment_transactions')
          .select('amount, status')
          .eq('order_id', orderId)
          .eq('user_id', customerId)
          .limit(1)
          .maybeSingle();

        if (txErr || !tx) {
          console.error(`[Webhook] PAYMENT_SUCCESS verification failed: No pending transaction found for order ${orderId} and customer ${customerId}`);
          break;
        }

        // Verify amount
        if (Math.abs(tx.amount - amount) > 0.01) {
          console.error(`[Webhook] PAYMENT_SUCCESS verification failed: Amount mismatch for order ${orderId}. Expected ${tx.amount}, got ${amount}`);
          break;
        }

        const renewalDate = calcRenewalDate(billingCycle as any);

        await supabase.from('subscriptions').upsert({
          user_id:            customerId,
          plan,
          status:             'active',
          billing_cycle:      billingCycle,
          start_date:         new Date().toISOString(),
          renewal_date:       renewalDate.toISOString(),
          current_period_end: renewalDate.toISOString(),
          cashfree_order_id:  orderId,
          payment_id:         paymentId,
        }, { onConflict: 'user_id' });

        await supabase.from('users')
          .update({ subscription_tier: 'premium' })
          .eq('id', customerId);

        await recordTransaction(supabase, {
          userId: customerId, orderId, paymentId, amount,
          currency: 'INR', status: 'PAID', plan, billingCycle,
          event: eventType, raw: event,
        });

        console.log(`[Webhook] User ${customerId} → Pro (${plan}/${billingCycle}). Order: ${orderId}`);
        break;
      }

      // ── Payment Failed ─────────────────────────────────────────────────
      case 'PAYMENT_FAILED_WEBHOOK': {
        const orderId    = event?.data?.order?.order_id      || '';
        const paymentId  = event?.data?.payment?.cf_payment_id?.toString() || '';
        const customerId = event?.data?.order?.customer_details?.customer_id || '';
        const amount     = Number(event?.data?.order?.order_amount) || 0;
        const plan       = event?.data?.order?.order_tags?.plan          || 'pro';
        const billingCycle = event?.data?.order?.order_tags?.billing_cycle || 'monthly';

        if (!customerId) break;

        // Verify transaction exists
        const { data: tx, error: txErr } = await supabase
          .from('payment_transactions')
          .select('status')
          .eq('order_id', orderId)
          .eq('user_id', customerId)
          .limit(1)
          .maybeSingle();

        if (txErr || !tx) {
          console.error(`[Webhook] PAYMENT_FAILED verification failed: No transaction found for order ${orderId}`);
          break;
        }

        // Mark subscription as past_due if it was already active (renewal failure)
        await supabase.from('subscriptions')
          .update({ status: 'past_due' })
          .eq('user_id', customerId)
          .eq('status', 'active');

        await recordTransaction(supabase, {
          userId: customerId, orderId, paymentId, amount,
          currency: 'INR', status: 'FAILED', plan, billingCycle,
          event: eventType, raw: event,
        });

        console.log(`[Webhook] Payment failed for user ${customerId}. Marked past_due.`);
        break;
      }

      // ── Subscription Status Changed ────────────────────────────────────
      case 'SUBSCRIPTION_STATUS_CHANGE': {
        const subscriptionStatus = event?.data?.subscription?.subscription_status || '';
        const subscriptionId     = event?.data?.subscription?.subscription_id     || '';
        const customerId         = event?.data?.subscription?.customer_details?.customer_id || '';

        if (!customerId) break;

        if (['CANCELLED', 'EXPIRED'].includes(subscriptionStatus)) {
          // Verify that this user actually owns this subscription ID
          const { data: sub, error: subErr } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('subscription_id', subscriptionId)
            .eq('user_id', customerId)
            .limit(1)
            .maybeSingle();

          if (subErr || !sub) {
            console.error(`[Webhook] SUBSCRIPTION_STATUS_CHANGE CANCEL/EXPIRE verification failed: No subscription found for ID ${subscriptionId}`);
            break;
          }

          await supabase.from('subscriptions')
            .update({
              status:       subscriptionStatus === 'CANCELLED' ? 'cancelled' : 'expired',
              cancelled_at: new Date().toISOString(),
              subscription_id: subscriptionId,
            })
            .eq('user_id', customerId);

          await supabase.from('users')
            .update({ subscription_tier: 'free' })
            .eq('id', customerId);

          console.log(`[Webhook] User ${customerId} → Free. Subscription ${subscriptionStatus}`);
        }

        if (subscriptionStatus === 'ACTIVE') {
          // Verify that a transaction with subscriptionId exists
          const { data: tx, error: txErr } = await supabase
            .from('payment_transactions')
            .select('user_id, plan, billing_cycle')
            .eq('subscription_id', subscriptionId)
            .limit(1)
            .maybeSingle();

          if (txErr || !tx || tx.user_id !== customerId) {
            console.error(`[Webhook] Subscription ACTIVE check failed: No valid transaction found for subscription ${subscriptionId}`);
            break;
          }

          const userBillingCycle = tx.billing_cycle || 'monthly';
          const userPlan = tx.plan || 'pro';
          const renewalDate = calcRenewalDate(userBillingCycle as any);

          await supabase.from('subscriptions').upsert({
            user_id:            customerId,
            plan:               userPlan,
            status:             'active',
            billing_cycle:      userBillingCycle,
            start_date:         new Date().toISOString(),
            renewal_date:       renewalDate.toISOString(),
            current_period_end: renewalDate.toISOString(),
            subscription_id:    subscriptionId,
          }, { onConflict: 'user_id' });

          await supabase.from('users')
            .update({ subscription_tier: 'premium' })
            .eq('id', customerId);

          console.log(`[Webhook] User ${customerId} subscription renewed/activated → active`);
        }

        break;
      }

      // ── Subscription Payment Succeeded (recurring renewal) ─────────────
      case 'SUBSCRIPTION_PAYMENT_SUCCESS': {
        const customerId     = event?.data?.subscription?.customer_details?.customer_id || '';
        const subscriptionId = event?.data?.subscription?.subscription_id || '';
        const orderId        = event?.data?.order?.order_id || `renew_${Date.now()}`;
        const paymentId      = event?.data?.payment?.cf_payment_id?.toString() || '';
        const amount         = Number(event?.data?.order?.order_amount) || 0;
        const plan           = event?.data?.subscription?.plan_id || 'pro';

        if (!customerId) break;

        // Verify that this subscription exists in our database
        const { data: sub, error: subErr } = await supabase
          .from('subscriptions')
          .select('billing_cycle, plan')
          .eq('subscription_id', subscriptionId)
          .eq('user_id', customerId)
          .limit(1)
          .maybeSingle();

        if (subErr || !sub) {
          console.error(`[Webhook] SUBSCRIPTION_PAYMENT_SUCCESS verification failed: No subscription found for ID ${subscriptionId}`);
          break;
        }

        const billingCycle = sub.billing_cycle || 'monthly';
        const renewalDate = calcRenewalDate(billingCycle as any);

        await supabase.from('subscriptions')
          .update({
            status:             'active',
            renewal_date:       renewalDate.toISOString(),
            current_period_end: renewalDate.toISOString(),
            payment_id:         paymentId,
            subscription_id:    subscriptionId,
          })
          .eq('user_id', customerId);

        await supabase.from('users')
          .update({ subscription_tier: 'premium' })
          .eq('id', customerId);

        await recordTransaction(supabase, {
          userId: customerId, orderId, paymentId, subId: subscriptionId,
          amount, currency: 'INR', status: 'PAID', plan,
          billingCycle, event: eventType, raw: event,
        });

        console.log(`[Webhook] Renewal succeeded for user ${customerId}. Next renewal: ${renewalDate.toDateString()}`);
        break;
      }

      // ── Subscription Renewal Failed ────────────────────────────────────
      case 'SUBSCRIPTION_PAYMENT_FAILED': {
        const customerId     = event?.data?.subscription?.customer_details?.customer_id || '';
        const subscriptionId = event?.data?.subscription?.subscription_id || '';
        const orderId        = event?.data?.order?.order_id || `fail_${Date.now()}`;
        const amount         = Number(event?.data?.order?.order_amount) || 0;

        if (!customerId) break;

        // Verify that this subscription exists in our database
        const { data: sub, error: subErr } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('subscription_id', subscriptionId)
          .eq('user_id', customerId)
          .limit(1)
          .maybeSingle();

        if (subErr || !sub) {
          console.error(`[Webhook] SUBSCRIPTION_PAYMENT_FAILED verification failed: No subscription found for ID ${subscriptionId}`);
          break;
        }

        // Grace period: mark past_due but don't remove access yet
        await supabase.from('subscriptions')
          .update({ status: 'past_due', subscription_id: subscriptionId })
          .eq('user_id', customerId)
          .in('status', ['active', 'trialing']);

        await recordTransaction(supabase, {
          userId: customerId, orderId, subId: subscriptionId,
          amount, currency: 'INR', status: 'FAILED', plan: 'pro',
          billingCycle: 'monthly', event: eventType, raw: event,
        });

        console.log(`[Webhook] Renewal failed for user ${customerId}. Marked past_due.`);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event: ${eventType}`);
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error('[Webhook] Handler error:', err.message);
    res.status(500).json({ error: 'Internal webhook error' });
  }
});

export default router;
