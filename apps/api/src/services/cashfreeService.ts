/**
 * Cashfree Service Layer
 * Centralises all Cashfree SDK interactions so routes stay thin.
 * Uses lazy initialisation — safe to import at module level.
 */

let _cf: any = null;

async function getCashfree() {
  if (_cf) return _cf;
  const sdk = await import('cashfree-pg');
  _cf = sdk.Cashfree;
  // Credentials validated at startup by validateEnv() in index.ts — no placeholder fallbacks.
  _cf.XClientId     = process.env.CASHFREE_APP_ID    || '';
  _cf.XClientSecret = process.env.CASHFREE_SECRET_KEY || '';
  _cf.XEnvironment  = process.env.CASHFREE_ENV === 'production'
    ? _cf.PRODUCTION
    : _cf.SANDBOX;
  return _cf;
}

const API_VERSION = '2025-01-01';

/**
 * Create a one-time Cashfree order.
 * Kept for non-subscription purchases and backwards compatibility.
 */
export async function createCashfreeOrder(params: {
  orderId:       string;
  amount:        number;
  currency:      string;
  customerId:    string;
  customerEmail: string;
  customerPhone: string;
  plan:          string;
  billingCycle:  string;
  frontendUrl:   string;
  apiUrl:        string;
}) {
  const cf = await getCashfree();
  const orderRequest = {
    order_id:       params.orderId,
    order_amount:   params.amount,
    order_currency: params.currency,
    customer_details: {
      customer_id:    params.customerId,
      customer_email: params.customerEmail,
      customer_phone: params.customerPhone,
    },
    order_meta: {
      return_url: `${params.frontendUrl}/dashboard?order_id={order_id}&payment_status={order_status}`,
      notify_url: `${params.apiUrl}/api/webhook`,
    },
    order_tags: {
      plan:          params.plan,
      billing_cycle: params.billingCycle,
    },
    order_note: `DeepWork AI ${params.plan} Plan — ${params.billingCycle} subscription`,
  };
  const response = await cf.PGCreateOrder(API_VERSION, orderRequest);
  return response.data;
}

/**
 * Create a TRUE recurring subscription via Cashfree Subscriptions API.
 *
 * Flow:
 *  1. Call this → get back payment_session_id
 *  2. Customer completes mandate capture (UPI AutoPay / eNACH / card)
 *  3. Cashfree fires SUBSCRIPTION_STATUS_CHANGE (ACTIVE) webhook → activate user
 *  4. Each billing cycle: SUBSCRIPTION_PAYMENT_SUCCESS → extend renewal_date
 *  5. Failure: SUBSCRIPTION_PAYMENT_FAILED → mark past_due
 *
 * The returned subscription_id must be saved to subscriptions.subscription_id
 * so it can be used for cancellation.
 *
 * Pre-requisite: the plan_id must be created in Cashfree Dashboard →
 *   Subscriptions → Plans BEFORE calling this function.
 */
export async function createCashfreeSubscription(params: {
  subscriptionId: string;        // our unique ID, e.g. dw_sub_<userId>_<ts>
  planId:         string;        // Cashfree plan_id (created in Cashfree dashboard)
  amount:         number;        // first charge amount (mandate capture)
  currency:       string;
  customerId:     string;
  customerEmail:  string;
  customerPhone:  string;
  customerName:   string;
  billingCycle:   'monthly' | 'yearly';
  frontendUrl:    string;
  apiUrl:         string;
}): Promise<{ subscription_id: string; payment_session_id: string }> {
  const cf = await getCashfree();

  const subscriptionRequest = {
    subscription_id:   params.subscriptionId,
    subscription_note: `DeepWork AI ${params.planId} — ${params.billingCycle}`,
    customer_details: {
      customer_id:    params.customerId,
      customer_email: params.customerEmail,
      customer_phone: params.customerPhone,
      customer_name:  params.customerName || params.customerEmail.split('@')[0],
    },
    plan: {
      plan_id: params.planId,
    },
    authorization: {
      // Collect mandate + first payment together
      collect_now:    true,
      collect_amount: params.amount,
    },
    subscription_meta: {
      return_url: `${params.frontendUrl}/dashboard?subscription_id=${params.subscriptionId}`,
      notify_url: `${params.apiUrl}/api/webhook`,
    },
  };

  const response = await cf.PGCreateSubscription(API_VERSION, subscriptionRequest);
  const data = response.data;
  return {
    subscription_id:    data.subscription_id,
    payment_session_id: data.payment_session_id,
  };
}

/**
 * Cancel a recurring Cashfree subscription by its Cashfree subscription_id.
 * The subscription stops at the end of the current billing period.
 */
export async function cancelCashfreeSubscription(subscriptionId: string): Promise<void> {
  const cf = await getCashfree();
  await cf.PGCancelSubscription(API_VERSION, subscriptionId);
}

/**
 * Fetch subscription details from Cashfree (used for mandate / recurring status checks).
 */
export async function fetchCashfreeSubscription(subscriptionId: string) {
  const cf = await getCashfree();
  if (typeof cf.PGFetchSubscription === 'function') {
    const response = await cf.PGFetchSubscription(API_VERSION, subscriptionId);
    return response.data;
  }
  // Fallback: make a direct REST API call if the SDK method name differs
  const env = process.env.CASHFREE_ENV === 'production' ? 'api' : 'sandbox';
  const url = `https://${env}.cashfree.com/pg/subscriptions/${subscriptionId}`;
  const response = await fetch(url, {
    headers: {
      'x-api-version': API_VERSION,
      'x-client-id':     process.env.CASHFREE_APP_ID || '',
      'x-client-secret': process.env.CASHFREE_SECRET_KEY || '',
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch subscription from Cashfree: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch order details from Cashfree (used for payment verification of one-time orders).
 */
export async function fetchCashfreeOrder(orderId: string) {
  const cf = await getCashfree();
  const response = await cf.PGFetchOrder(API_VERSION, orderId);
  return response.data;
}

/**
 * Verify a Cashfree webhook signature.
 * Throws if the signature is invalid.
 */
export function verifyCashfreeWebhook(
  signature: string,
  rawBody:   string,
  timestamp: string
): void {
  const { Cashfree } = require('cashfree-pg');
  Cashfree.XClientId     = process.env.CASHFREE_APP_ID     || '';
  Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY || '';
  Cashfree.XEnvironment  = process.env.CASHFREE_ENV === 'production'
    ? Cashfree.PRODUCTION
    : Cashfree.SANDBOX;
  Cashfree.PGVerifyWebhookSignature(signature, rawBody, timestamp);
}

/**
 * Calculate renewal date based on billing cycle.
 */
export function calcRenewalDate(billingCycle: 'monthly' | 'yearly' = 'monthly'): Date {
  const d = new Date();
  if (billingCycle === 'yearly') {
    d.setFullYear(d.getFullYear() + 1);
  } else {
    d.setMonth(d.getMonth() + 1);
  }
  return d;
}

/**
 * Cashfree Plan IDs — must match plan_id values created in Cashfree Dashboard.
 * Steps:
 *   1. Go to Cashfree Dashboard → Subscriptions → Plans → Create Plan
 *   2. Set interval (MONTH / YEAR), amount, currency
 *   3. Copy the plan_id and set it in apps/api/.env:
 *        CASHFREE_PLAN_ID_PRO_MONTHLY=deepwork_pro_monthly
 *        CASHFREE_PLAN_ID_PRO_YEARLY=deepwork_pro_yearly
 */
export const CASHFREE_PLAN_IDS: Record<string, Record<string, string>> = {
  pro: {
    monthly: process.env.CASHFREE_PLAN_ID_PRO_MONTHLY || 'deepwork_pro_monthly',
    yearly:  process.env.CASHFREE_PLAN_ID_PRO_YEARLY  || 'deepwork_pro_yearly',
  },
};

/**
 * Plan amounts in INR (used for mandate capture / first charge amount).
 * Cashfree accepts the currency unit directly, not paise.
 */
export const PLAN_AMOUNTS: Record<string, Record<string, number>> = {
  pro: {
    monthly: Number(process.env.CASHFREE_PRO_PLAN_AMOUNT)  || 999,
    yearly:  Number(process.env.CASHFREE_PRO_YEARLY_AMOUNT) || 7999,
  },
};
