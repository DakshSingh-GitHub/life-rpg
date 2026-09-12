-- ==============================================================================
-- MIGRATION: 005_recurring_and_priority_quests.sql
-- LIFE RPG: RECURRING TASKS (00:00 IST RESET) & PRIORITY TASKS SECTION
-- ==============================================================================

-- 1. Add is_recurring, is_priority, and last_completed_date to public.quests table
ALTER TABLE public.quests
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_priority BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_completed_date DATE DEFAULT NULL;

-- 2. Create index for fast filtering by priority, recurrence, and user
CREATE INDEX IF NOT EXISTS idx_quests_user_priority ON public.quests (user_id, is_priority);
CREATE INDEX IF NOT EXISTS idx_quests_user_recurring ON public.quests (user_id, is_recurring);

-- 3. Update Starter Quests in handle_new_user trigger to include recurring / priority defaults
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
    0,
    NULL,
    0,
    0,
    0,
    0,
    0
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  
  -- C. Insert starter welcome quests (with recurring and priority examples)
  INSERT INTO public.quests (user_id, title, category, attribute, difficulty, xp_reward, gold_reward, is_recurring, is_priority)
  VALUES
    (NEW.id, 'Daily Morning Hydration (Drink 500ml Water)', 'fitness', 'BRAWN', 'easy', 20, 10, TRUE, FALSE),
    (NEW.id, '25-minute Focused Work or Study Sprint', 'knowledge', 'INTELLECT', 'medium', 35, 20, TRUE, TRUE),
    (NEW.id, 'Tidy Workspace & Plan Tomorrow', 'habits', 'SWIFTNESS', 'easy', 25, 15, TRUE, FALSE);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
