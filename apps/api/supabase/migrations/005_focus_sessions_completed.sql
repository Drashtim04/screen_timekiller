-- ============================================================
-- Migration 005: Focus Sessions Completed Column
-- Run this in your Supabase SQL Editor.
-- Safe to run multiple times (uses IF NOT EXISTS).
-- ============================================================

ALTER TABLE public.focus_sessions 
ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT TRUE;

-- Create index for performance on queries involving completed sessions
CREATE INDEX IF NOT EXISTS idx_focus_sessions_completed ON public.focus_sessions(completed);
