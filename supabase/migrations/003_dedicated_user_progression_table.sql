-- ==============================================================================
-- MIGRATION: 003_dedicated_user_progression_table.sql
-- CREATE DEDICATED TABLE FOR USER PROGRESSION
-- ==============================================================================

-- 1. Create the dedicated user_progression table
CREATE TABLE IF NOT EXISTS public.user_progression (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1,
  current_xp INTEGER NOT NULL DEFAULT 0,
  gold INTEGER NOT NULL DEFAULT 50,
  streak_days INTEGER NOT NULL DEFAULT 1,
  last_active_date DATE NOT NULL DEFAULT CURRENT_DATE,
  brawn_xp INTEGER NOT NULL DEFAULT 0,
  intellect_xp INTEGER NOT NULL DEFAULT 0,
  swiftness_xp INTEGER NOT NULL DEFAULT 0,
  vitality_xp INTEGER NOT NULL DEFAULT 0,
  total_quests_completed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Migrate existing progression data from profiles if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'level'
  ) THEN
    INSERT INTO public.user_progression (
      user_id,
      level,
      current_xp,
      gold,
      streak_days,
      last_active_date,
      brawn_xp,
      intellect_xp,
      swiftness_xp,
      vitality_xp
    )
    SELECT
      id AS user_id,
      COALESCE(level, 1),
      COALESCE(current_xp, 0),
      COALESCE(gold, 50),
      COALESCE(streak_days, 1),
      COALESCE(last_active_date, CURRENT_DATE),
      COALESCE(brawn_xp, 0),
      COALESCE(intellect_xp, 0),
      COALESCE(swiftness_xp, 0),
      COALESCE(vitality_xp, 0)
    FROM public.profiles
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;

-- 3. Row Level Security (RLS) for user_progression
ALTER TABLE public.user_progression ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own progression" ON public.user_progression;
CREATE POLICY "Users can view their own progression"
  ON public.user_progression FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own progression" ON public.user_progression;
CREATE POLICY "Users can insert their own progression"
  ON public.user_progression FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own progression" ON public.user_progression;
CREATE POLICY "Users can update their own progression"
  ON public.user_progression FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. Update handle_new_user trigger to populate both profiles and user_progression
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- A. Insert user profile (identity & credentials)
  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    date_of_birth,
    country,
    avatar_class
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'full_name',
    CASE
      WHEN NEW.raw_user_meta_data->>'date_of_birth' IS NOT NULL AND NEW.raw_user_meta_data->>'date_of_birth' <> ''
      THEN (NEW.raw_user_meta_data->>'date_of_birth')::DATE
      ELSE NULL
    END,
    NEW.raw_user_meta_data->>'country',
    COALESCE(NEW.raw_user_meta_data->>'avatar_class', 'warrior')
  )
  ON CONFLICT (id) DO NOTHING;

  -- B. Insert dedicated user progression row
  INSERT INTO public.user_progression (
    user_id,
    level,
    current_xp,
    gold,
    streak_days,
    last_active_date,
    brawn_xp,
    intellect_xp,
    swiftness_xp,
    vitality_xp,
    total_quests_completed
  )
  VALUES (
    NEW.id,
    1,
    0,
    50,
    1,
    CURRENT_DATE,
    0,
    0,
    0,
    0,
    0
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- C. Insert starter welcome quests
  INSERT INTO public.quests (user_id, title, category, attribute, difficulty, xp_reward, gold_reward)
  VALUES
    (NEW.id, 'Morning Hydration Ritual (Drink 500ml Water)', 'fitness', 'BRAWN', 'easy', 20, 10),
    (NEW.id, '25-minute Focused Work or Study Sprint', 'knowledge', 'INTELLECT', 'medium', 35, 20),
    (NEW.id, 'Tidy Workspace & Plan Tomorrow', 'habits', 'SWIFTNESS', 'easy', 25, 15);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rebind trigger safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. (Optional Cleanup) Drop legacy progression columns from profiles table
-- Once data is safely migrated, you can optionally execute this cleanup:
/*
ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS level,
  DROP COLUMN IF EXISTS current_xp,
  DROP COLUMN IF EXISTS gold,
  DROP COLUMN IF EXISTS streak_days,
  DROP COLUMN IF EXISTS last_active_date,
  DROP COLUMN IF EXISTS brawn_xp,
  DROP COLUMN IF EXISTS intellect_xp,
  DROP COLUMN IF EXISTS swiftness_xp,
  DROP COLUMN IF EXISTS vitality_xp;
*/
