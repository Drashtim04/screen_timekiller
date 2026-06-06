-- ============================================================
-- Migration 003: Emergency Unlocks
-- Run this in your Supabase SQL Editor.
-- Safe to run multiple times (uses IF NOT EXISTS).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.emergency_unlocks (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain      TEXT         NOT NULL,
  reason      TEXT         NOT NULL CHECK (reason IN ('Work Related', 'Quick Check', 'Habit', 'Bored')),
  unlocked_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.emergency_unlocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies (idempotent — drop then recreate)
DROP POLICY IF EXISTS "Users read own emergency unlocks" ON public.emergency_unlocks;
DROP POLICY IF EXISTS "Users insert own emergency unlocks" ON public.emergency_unlocks;

-- Users can only read their own unlocks
CREATE POLICY "Users read own emergency unlocks"
  ON public.emergency_unlocks FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own unlocks
CREATE POLICY "Users insert own emergency unlocks"
  ON public.emergency_unlocks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_emergency_unlocks_user_id ON public.emergency_unlocks(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_unlocks_reason ON public.emergency_unlocks(reason);
