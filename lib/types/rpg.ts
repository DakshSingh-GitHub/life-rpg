export type CategoryType = "fitness" | "knowledge" | "habits" | "wellness";
export type AttributeType = "BRAWN" | "INTELLECT" | "SWIFTNESS" | "VITALITY";
export type DifficultyType = "easy" | "medium" | "hard" | "epic";

export interface Quest {
  id: string;
  user_id: string;
  title: string;
  category: CategoryType;
  attribute: AttributeType;
  difficulty: DifficultyType;
  xp_reward: number;
  gold_reward: number;
  completed: boolean;
  completed_at?: string | null;
  is_recurring?: boolean;
  is_priority?: boolean;
  last_completed_date?: string | null;
  created_at?: string;
}

export interface UserProgression {
  id?: string;
  user_id: string;
  level: number;
  current_xp: number;
  gold: number;
  streak_days: number;
  last_active_date?: string | null;
  brawn_xp: number;
  intellect_xp: number;
  swiftness_xp: number;
  vitality_xp: number;
  total_quests_completed?: number;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  full_name?: string;
  date_of_birth?: string;
  country?: string;
  avatar_class: string;
  level: number;
  current_xp: number;
  gold: number;
  streak_days: number;
  last_active_date?: string | null;
  brawn_xp: number;
  intellect_xp: number;
  swiftness_xp: number;
  vitality_xp: number;
  created_at?: string;
}

export interface StreakRecord {
  id?: string;
  user_id: string;
  streak_count: number;
  activity_date: string;
  tasks_completed_count: number;
  action: "increment" | "reset" | "maintain" | "rollback";
  recorded_at?: string;
}

export interface RewardItem {
  id: string;
  title: string;
  icon: string;
  cost: number;
  description: string;
  category: "perk" | "badge" | "treat";
  owned?: boolean;
}
