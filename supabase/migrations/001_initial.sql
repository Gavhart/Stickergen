-- ============================================================
-- StickerGen — Supabase Initial Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT UNIQUE CHECK (char_length(username) <= 30),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Stickers
CREATE TABLE IF NOT EXISTS public.stickers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  prompt      TEXT NOT NULL,
  style       TEXT NOT NULL,
  color       TEXT NOT NULL,
  provider    TEXT NOT NULL DEFAULT 'pollinations',
  image_url   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS stickers_user_id_idx ON public.stickers(user_id);
CREATE INDEX IF NOT EXISTS stickers_created_at_idx ON public.stickers(created_at DESC);

-- 4. Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stickers ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, self write
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Stickers: owner only
CREATE POLICY "stickers_select" ON public.stickers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "stickers_insert" ON public.stickers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "stickers_delete" ON public.stickers FOR DELETE USING (auth.uid() = user_id);

-- 5. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Storage buckets (run separately if buckets already exist)
-- In Dashboard: Storage → New bucket
-- Bucket name: "avatars"  — Public: true
-- Bucket name: "stickers" — Public: true

-- Storage policies (run after creating buckets)
CREATE POLICY "avatars_select" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "stickers_obj_select" ON storage.objects FOR SELECT USING (bucket_id = 'stickers');
CREATE POLICY "stickers_obj_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'stickers' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "stickers_obj_delete" ON storage.objects FOR DELETE USING (bucket_id = 'stickers' AND auth.uid()::text = (storage.foldername(name))[1]);
