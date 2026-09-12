/**
 * LifeRPG Authoritative Backend Client
 * Connects the Next.js frontend with the Python FastAPI game engine.
 */

const getBaseUrl = (): string => {
  // In browser, relative URL `/api/backend` is automatically rewritten
  // by next.config.ts to either local FastAPI (http://127.0.0.1:8000/api)
  // or Vercel Python serverless function (/api/index.py).
  if (typeof window !== "undefined") {
    return "/api/backend";
  }
  let url = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000/api").trim();
  if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("/")) {
    url = `https://${url}`;
  }
  return url.replace(/\/+$/, "");
};

export interface BackendQuestCompleteResult {
  quest_id: string;
  quest_title: string;
  attribute: string;
  xp_earned: number;
  gold_earned: number;
  is_critical_hit: boolean;
  bonus_multiplier: number;
  new_level: number;
  current_xp: number;
  next_level_xp: number;
  level_up: boolean;
  new_gold: number;
  new_streak: number;
  streak_incremented: boolean;
  attribute_xp: {
    brawn: number;
    intellect: number;
    swiftness: number;
    vitality: number;
  };
  completed_at: string;
}

export interface BackendShopRedeemResult {
  success: boolean;
  item_id: string;
  title: string;
  cost: number;
  remaining_gold: number;
  unlocked_reward_id: string;
  purchased_at: string;
}

export interface AIQuestItem {
  day: number;
  title: string;
  category: "fitness" | "knowledge" | "habits" | "wellness";
  attribute: "BRAWN" | "INTELLECT" | "SWIFTNESS" | "VITALITY";
  difficulty: "easy" | "medium" | "hard" | "epic";
  xp_reward: number;
  gold_reward: number;
  lore_flavor: string;
  is_priority?: boolean;
  is_recurring?: boolean;
}

export interface AIGeneratedQuestline {
  questline_title: string;
  lore_brief: string;
  target_goal: string;
  hero_class: string;
  duration_days: number;
  total_estimated_xp: number;
  total_estimated_gold: number;
  quests: AIQuestItem[];
}

/**
 * Authoritative Quest Completion via FastAPI Game Engine
 */
export async function completeQuestViaBackend(
  questId: string,
  userId: string
): Promise<{ data?: BackendQuestCompleteResult; error?: string }> {
  try {
    const res = await fetch(`${getBaseUrl()}/quests/${questId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return { error: errJson.detail || `Backend error: ${res.statusText}` };
    }

    const data: BackendQuestCompleteResult = await res.json();
    return { data };
  } catch (err: any) {
    console.warn("FastAPI backend unreachable, fallback allowed:", err);
    return { error: err?.message || "Network error reaching backend" };
  }
}

/**
 * Atomic Shop Redemption via FastAPI
 */
export async function redeemShopViaBackend(
  userId: string,
  itemId: string,
  title: string,
  cost: number
): Promise<{ data?: BackendShopRedeemResult; error?: string }> {
  try {
    const res = await fetch(`${getBaseUrl()}/shop/redeem`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        item_id: itemId,
        title: title,
        cost: cost,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return { error: errJson.detail || `Redeem failed: ${res.statusText}` };
    }

    const data: BackendShopRedeemResult = await res.json();
    return { data };
  } catch (err: any) {
    return { error: err?.message || "Network error reaching backend" };
  }
}

/**
 * Generate an AI Questline with Gemini Dungeon Master
 */
export async function generateQuestlineViaAI(
  goal: string,
  heroClass: string = "warrior",
  durationDays: number = 7,
  dailyMinutes: number = 30
): Promise<{ data?: AIGeneratedQuestline; error?: string }> {
  try {
    const res = await fetch(`${getBaseUrl()}/ai/generate-questline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goal: goal,
        hero_class: heroClass,
        duration_days: durationDays,
        daily_time_minutes: dailyMinutes,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return { error: errJson.detail || `AI generation failed: ${res.statusText}` };
    }

    const data: AIGeneratedQuestline = await res.json();
    return { data };
  } catch (err: any) {
    return { error: err?.message || "Failed to reach AI Dungeon Master" };
  }
}

/**
 * Batch enroll AI-generated quests into user's Quest Log
 */
export async function enrollQuestlineViaBackend(
  userId: string,
  quests: AIQuestItem[]
): Promise<{ success: boolean; enrolled_count?: number; error?: string }> {
  try {
    const res = await fetch(`${getBaseUrl()}/ai/enroll-questline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        quests: quests,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return { success: false, error: errJson.detail || "Enrollment failed" };
    }

    const data = await res.json();
    return { success: true, enrolled_count: data.enrolled_count };
  } catch (err: any) {
    return { success: false, error: err?.message || "Network error enrolling quests" };
  }
}

/**
 * Fetch Leaderboards from Backend
 */
export async function getLeaderboardsViaBackend(
  limit: number = 25,
  sortBy: string = "level"
): Promise<{ data?: any; error?: string }> {
  try {
    const res = await fetch(`${getBaseUrl()}/leaderboards?limit=${limit}&sort_by=${sortBy}`);
    if (!res.ok) {
      return { error: "Failed to fetch leaderboards" };
    }
    const data = await res.json();
    return { data };
  } catch (err: any) {
    return { error: err?.message || "Network error fetching leaderboards" };
  }
}

/**
 * Backend Health Check
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${getBaseUrl()}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
