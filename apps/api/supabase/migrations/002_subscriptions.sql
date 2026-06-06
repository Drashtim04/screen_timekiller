-- ============================================================
-- Migration 002: Subscriptions & Payment Transactions
-- Run this in your Supabase SQL Editor.
-- Safe to run multiple times (uses IF NOT EXISTS / IF EXISTS).
-- ============================================================

-- 1. Extend existing subscriptions table with all required fields
ALTER TABLE IF EXISTS subscriptions
  ADD COLUMN IF NOT EXISTS plan             TEXT         NOT NULL DEFAULT 'pro',
  ADD COLUMN IF NOT EXISTS start_date       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS renewal_date     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_id  TEXT,
  ADD COLUMN IF NOT EXISTS payment_id       TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS billing_cycle    TEXT         NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW();

-- Ensure subscriptions table exists even if it was never created before
CREATE TABLE IF NOT EXISTS subscriptions (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan              TEXT         NOT NULL DEFAULT 'pro',
  status            TEXT         NOT NULL DEFAULT 'active',
  billing_cycle     TEXT         NOT NULL DEFAULT 'monthly',
  start_date        TIMESTAMPTZ,
  renewal_date      TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ,
  subscription_id   TEXT,
  payment_id        TEXT,
  cashfree_order_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 2. Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id        TEXT         NOT NULL,
  payment_id      TEXT,
  subscription_id TEXT,
  amount          INTEGER      NOT NULL DEFAULT 0,
  currency        TEXT         NOT NULL DEFAULT 'INR',
  status          TEXT         NOT NULL,
  plan            TEXT         NOT NULL DEFAULT 'pro',
  billing_cycle   TEXT         NOT NULL DEFAULT 'monthly',
  gateway_event   TEXT,
  raw_payload     JSONB,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 3. Enable Row Level Security
ALTER TABLE subscriptions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies (idempotent — drop then recreate)
DROP POLICY IF EXISTS "Users read own subscription"    ON subscriptions;
DROP POLICY IF EXISTS "Users read own transactions"    ON payment_transactions;
DROP POLICY IF EXISTS "Service can write subscriptions"    ON subscriptions;
DROP POLICY IF EXISTS "Service can write transactions"     ON payment_transactions;

-- Users can only see their own data
CREATE POLICY "Users read own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users read own transactions"
  ON payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Backend uses service role key so it bypasses RLS entirely.
-- These policies are here for completeness if anon key is used.
CREATE POLICY "Service can write subscriptions"
  ON subscriptions FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service can write transactions"
  ON payment_transactions FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Useful indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id      ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status       ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id       ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order_id      ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_id    ON payment_transactions(payment_id);
