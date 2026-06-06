-- ============================================================
-- Migration 006: Weekly Reports
-- Run this in your Supabase SQL Editor.
-- Safe to run multiple times (uses IF NOT EXISTS).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.weekly_reports (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date          DATE         NOT NULL,
  end_date            DATE         NOT NULL,
  focus_hours         NUMERIC      NOT NULL DEFAULT 0.0,
  focus_score         NUMERIC      NOT NULL DEFAULT 0.0,
  session_count       INTEGER      NOT NULL DEFAULT 0,
  completed_count     INTEGER      NOT NULL DEFAULT 0,
  unlock_reasons      JSONB        NOT NULL DEFAULT '{}'::jsonb,
  top_distractions    JSONB        NOT NULL DEFAULT '[]'::jsonb,
  productivity_change NUMERIC      NOT NULL DEFAULT 0.0,
  ai_summary          TEXT         NOT NULL,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users read own weekly reports" ON public.weekly_reports;
DROP POLICY IF EXISTS "Users insert own weekly reports" ON public.weekly_reports;

-- Users can only read their own reports
CREATE POLICY "Users read own weekly reports"
  ON public.weekly_reports FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own reports
CREATE POLICY "Users insert own weekly reports"
  ON public.weekly_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_weekly_reports_user_id ON public.weekly_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_date ON public.weekly_reports(start_date, end_date);
