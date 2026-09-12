-- ==============================================================================
-- MIGRATION: 002_complete_user_progress_schema.sql
-- LIFE RPG: SEPARATE USER PROFILES & USER PROGRESSION SCHEMA
-- ==============================================================================

-- 1. PROFILES TABLE: Identity, credentials & account info only
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  full_name TEXT,
  date_of_birth DATE,
  country TEXT,
  avatar_class TEXT NOT NULL DEFAULT 'warrior',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure identity columns exist for existing tables
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_class TEXT NOT NULL DEFAULT 'warrior';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 2. USER_PROGRESSION TABLE: Dedicated table for all RPG progression stats
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

-- 3. QUESTS TABLE: Tasks CRUD with attribute categorization & rewards
CREATE TABLE IF NOT EXISTS public.quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('fitness', 'knowledge', 'habits', 'wellness')),
  attribute TEXT NOT NULL CHECK (attribute IN ('BRAWN', 'INTELLECT', 'SWIFTNESS', 'VITALITY')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'epic')),
  xp_reward INTEGER NOT NULL DEFAULT 25,
  gold_reward INTEGER NOT NULL DEFAULT 15,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. UNLOCKED REWARDS / ARMORY: Inventory & items bought with earned Gold
CREATE TABLE IF NOT EXISTS public.unlocked_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  title TEXT NOT NULL,
  cost INTEGER NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. QUEST COMPLETION HISTORY / AUDIT LOG: Historical log of completed tasks
CREATE TABLE IF NOT EXISTS public.quest_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id UUID REFERENCES public.quests(id) ON DELETE SET NULL,
  quest_title TEXT NOT NULL,
  attribute TEXT NOT NULL,
  xp_earned INTEGER NOT NULL,
  gold_earned INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict isolation: Users can ONLY access and modify their own records.
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progression ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unlocked_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_history ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- User Progression Policies
DROP POLICY IF EXISTS "Users can view their own progression" ON public.user_progression;
CREATE POLICY "Users can view their own progression" ON public.user_progression
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own progression" ON public.user_progression;
CREATE POLICY "Users can insert their own progression" ON public.user_progression
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own progression" ON public.user_progression;
CREATE POLICY "Users can update their own progression" ON public.user_progression
  FOR UPDATE USING (auth.uid() = user_id);

-- Quests Policies
DROP POLICY IF EXISTS "Users can view their own quests" ON public.quests;
CREATE POLICY "Users can view their own quests" ON public.quests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own quests" ON public.quests;
CREATE POLICY "Users can insert their own quests" ON public.quests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own quests" ON public.quests;
CREATE POLICY "Users can update their own quests" ON public.quests
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own quests" ON public.quests;
CREATE POLICY "Users can delete their own quests" ON public.quests
  FOR DELETE USING (auth.uid() = user_id);

-- Unlocked Rewards Policies
DROP POLICY IF EXISTS "Users can view their own rewards" ON public.unlocked_rewards;
CREATE POLICY "Users can view their own rewards" ON public.unlocked_rewards
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own rewards" ON public.unlocked_rewards;
CREATE POLICY "Users can insert their own rewards" ON public.unlocked_rewards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Quest History Policies
DROP POLICY IF EXISTS "Users can view their own quest history" ON public.quest_history;
CREATE POLICY "Users can view their own quest history" ON public.quest_history
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert into their quest history" ON public.quest_history;
CREATE POLICY "Users can insert into their quest history" ON public.quest_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- AUTOMATIC PROFILE & USER PROGRESSION CREATION TRIGGER ON SIGNUP
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Create Profile record (identity & user attributes)
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

  -- 2. Create User Progression record (dedicated RPG progression table)
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
  
  -- 3. Insert 3 starter welcome quests for the new adventurer
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
