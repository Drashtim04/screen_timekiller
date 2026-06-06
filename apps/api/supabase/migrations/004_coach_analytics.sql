-- ============================================================
-- Migration 004: Coach Analytics
-- Run this in your Supabase SQL Editor.
-- Safe to run multiple times (uses IF NOT EXISTS).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.coach_events (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain            TEXT         NOT NULL,
  coaching_message  TEXT         NOT NULL,
  action            TEXT         NOT NULL CHECK (action IN ('Returned to Work', 'Unlocked')),
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.coach_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users read own coach events" ON public.coach_events;
DROP POLICY IF EXISTS "Users insert own coach events" ON public.coach_events;

-- Users can only read their own coach events
CREATE POLICY "Users read own coach events"
  ON public.coach_events FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own coach events
CREATE POLICY "Users insert own coach events"
  ON public.coach_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_coach_events_user_id ON public.coach_events(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_events_action ON public.coach_events(action);
