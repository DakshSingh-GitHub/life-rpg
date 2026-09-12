-- ==============================================================================
-- MIGRATION: Add Full Name, Date of Birth (DOB), and Country to Profiles
-- Run this in your Supabase Project SQL Editor
-- ==============================================================================

-- 1. Alter the profiles table to add the new columns (idempotent)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT;

-- 2. Update the trigger function so new signups populate these columns
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    date_of_birth,
    country,
    avatar_class,
    level,
    current_xp,
    gold,
    streak_days,
    last_active_date
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
    COALESCE(NEW.raw_user_meta_data->>'avatar_class', 'warrior'),
    1,
    0,
    50,
    1,
    CURRENT_DATE
  );
  
  -- Insert 3 starter welcome quests for the new adventurer
  INSERT INTO public.quests (user_id, title, category, attribute, difficulty, xp_reward, gold_reward)
  VALUES
    (NEW.id, 'Morning Hydration Ritual (Drink 500ml Water)', 'fitness', 'BRAWN', 'easy', 20, 10),
    (NEW.id, '25-minute Focused Work or Study Sprint', 'knowledge', 'INTELLECT', 'medium', 35, 20),
    (NEW.id, 'Tidy Workspace & Plan Tomorrow', 'habits', 'SWIFTNESS', 'easy', 25, 15);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
