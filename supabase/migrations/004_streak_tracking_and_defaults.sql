-- ==============================================================================
-- MIGRATION: 004_streak_tracking_and_defaults.sql
-- LIFE RPG: DEFAULT 0 STREAK, MIDNIGHT RESET LOGIC & DEDICATED STREAK RECORDS
-- ==============================================================================

-- 1. Alter user_progression table to default streak to 0 and last_active_date to NULL
ALTER TABLE public.user_progression 
  ALTER COLUMN streak_days SET DEFAULT 0;

ALTER TABLE public.user_progression 
  ALTER COLUMN last_active_date DROP NOT NULL;

ALTER TABLE public.user_progression 
  ALTER COLUMN last_active_date SET DEFAULT NULL;

-- 2. Create dedicated streak_records audit table
-- Every time a user completes a task that alters or logs their daily streak,
-- an audit record is stored here for analytics and history.
CREATE TABLE IF NOT EXISTS public.streak_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  streak_count INTEGER NOT NULL DEFAULT 0,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  tasks_completed_count INTEGER NOT NULL DEFAULT 1,
  action TEXT NOT NULL DEFAULT 'increment' CHECK (action IN ('increment', 'reset', 'maintain', 'rollback')),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Row Level Security for streak_records
ALTER TABLE public.streak_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own streak records" ON public.streak_records;
CREATE POLICY "Users can view their own streak records"
  ON public.streak_records FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own streak records" ON public.streak_records;
CREATE POLICY "Users can insert their own streak records"
  ON public.streak_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Clean up any existing placeholder/stale streaks:
-- Reset streak to 0 if last_active_date is null or older than yesterday (midnight passed without activity)
UPDATE public.user_progression
SET streak_days = 0
WHERE last_active_date IS NULL OR last_active_date < CURRENT_DATE - INTERVAL '1 day';

-- 5. Update handle_new_user trigger so all newly registered adventurers start with streak = 0
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- A. Insert user profile (identity)
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

  -- B. Insert dedicated user progression row with DEFAULT 0 STREAK
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
    0,            -- Default streak is strictly 0 until first daily task is completed!
    NULL,         -- No active date until a quest is completed
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
