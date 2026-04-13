-- ============================================================
-- StickerGen — Migration 002: Plans, Usage, Stripe
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Add plan + Stripe fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'pro', 'ultra')),
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';

-- 2. Daily usage table
CREATE TABLE IF NOT EXISTS public.daily_usage (
  user_id  UUID  NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date     DATE  NOT NULL DEFAULT CURRENT_DATE,
  count    INT   NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

-- 3. RLS for daily_usage
ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_select" ON public.daily_usage
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "usage_insert" ON public.daily_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "usage_update" ON public.daily_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. Atomic increment function (upsert pattern, safe for concurrent calls)
CREATE OR REPLACE FUNCTION public.increment_daily_usage(p_user_id UUID)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_count INT;
BEGIN
  INSERT INTO public.daily_usage (user_id, date, count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET count = daily_usage.count + 1
  RETURNING count INTO new_count;
  RETURN new_count;
END;
$$;
