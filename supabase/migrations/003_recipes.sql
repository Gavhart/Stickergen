-- Migration 003: Recipe app schema
-- Run this in your Supabase SQL editor

-- Add plan & usage fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_uses_today integer NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_uses_reset_at timestamptz NOT NULL DEFAULT now();

-- Recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  ingredients jsonb NOT NULL DEFAULT '[]',
  steps jsonb NOT NULL DEFAULT '[]',
  servings integer NOT NULL DEFAULT 4,
  prep_time integer,
  cook_time integer,
  tags text[] DEFAULT '{}',
  image_url text,
  is_public boolean NOT NULL DEFAULT true,
  source text NOT NULL DEFAULT 'manual',
  nutrition jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Saves (bookmarks)
CREATE TABLE IF NOT EXISTS saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

-- Likes
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

-- RLS
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saves   ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes   ENABLE ROW LEVEL SECURITY;

-- Recipes policies
CREATE POLICY "Public recipes readable by all"  ON recipes FOR SELECT USING (is_public = true);
CREATE POLICY "Users read own recipes"          ON recipes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own recipes"        ON recipes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own recipes"        ON recipes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own recipes"        ON recipes FOR DELETE USING (auth.uid() = user_id);

-- Saves policies
CREATE POLICY "Users manage own saves"          ON saves FOR ALL USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Likes readable by all"           ON likes FOR SELECT USING (true);
CREATE POLICY "Users insert own likes"          ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own likes"          ON likes FOR DELETE USING (auth.uid() = user_id);

-- Updated_at trigger for recipes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS recipes_updated_at ON recipes;
CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to increment AI usage & enforce daily limit
CREATE OR REPLACE FUNCTION increment_ai_uses(p_user_id uuid, p_limit integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  rec profiles%rowtype;
BEGIN
  SELECT * INTO rec FROM profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;

  -- Reset counter if it's a new day
  IF rec.ai_uses_reset_at < date_trunc('day', now()) THEN
    UPDATE profiles SET ai_uses_today = 0, ai_uses_reset_at = now() WHERE id = p_user_id;
    rec.ai_uses_today := 0;
  END IF;

  -- Enforce limit (p_limit = -1 means unlimited)
  IF p_limit >= 0 AND rec.ai_uses_today >= p_limit THEN
    RETURN false;
  END IF;

  UPDATE profiles SET ai_uses_today = ai_uses_today + 1 WHERE id = p_user_id;
  RETURN true;
END;
$$;
