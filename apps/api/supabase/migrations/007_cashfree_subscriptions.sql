-- ============================================================
-- Migration 007: Cashfree Recurring Subscriptions
-- Run this in your Supabase SQL Editor.
-- Safe to run multiple times (uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
-- ============================================================

-- 1. Ensure cashfree_order_id column exists (added here for completeness;
--    may already exist from migration 002).
ALTER TABLE IF EXISTS subscriptions
  ADD COLUMN IF NOT EXISTS cashfree_order_id TEXT;

-- 2. Add unique index on subscription_id for idempotent webhook upserts.
--    subscription_id stores the Cashfree Subscriptions API subscription_id
--    (distinct from the one-time order_id).
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_subscription_id
  ON subscriptions(subscription_id)
  WHERE subscription_id IS NOT NULL;

-- 3. Add unique index on order_id in payment_transactions for idempotent
--    webhook upserts (already exists via migration 002; safe to repeat).
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_order_id_unique
  ON payment_transactions(order_id);

-- 4. Optional: index for fast lookup of pending/active subscriptions
--    when checking renewal status.
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_renewal
  ON subscriptions(status, renewal_date);
