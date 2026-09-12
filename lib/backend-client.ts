/**
 * LifeRPG Authoritative Backend Client
 * Connects the Next.js frontend with the Python FastAPI game engine.
 */

const getBaseUrl = (): string => {
  let configuredUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "").trim();
  if (configuredUrl) {
    if (!configuredUrl.startsWith("http://") && !configuredUrl.startsWith("https://")) {
      configuredUrl = `https://${configuredUrl}`;
    }
    configuredUrl = configuredUrl.replace(/\/+$/, "");
    return configuredUrl.endsWith("/api") ? configuredUrl : `${configuredUrl}/api`;
  }
  // In browser, relative URL `/api/backend` is automatically rewritten
  // by next.config.ts to either local FastAPI (http://127.0.0.1:8000/api)
  // or Vercel Python serverless function (/api/index.py).
  if (typeof window !== "undefined") {
    return "/api/backend";
  }
  return "http://127.0.0.1:8000/api";
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
 * Client-Side Intelligent Procedural Questline Generator
 * Guarantees zero downtime even during serverless cold starts, CORS blocks, or network disconnects.
 */
export function generateClientFallbackQuestline(
  goal: string,
  heroClass: string = "warrior",
  durationDays: number = 7,
  dailyMinutes: number = 30
): AIGeneratedQuestline {
  const goalLower = goal.toLowerCase();
  
  let attribute: "BRAWN" | "INTELLECT" | "SWIFTNESS" | "VITALITY" = "BRAWN";
  let category: "fitness" | "knowledge" | "habits" | "wellness" = "fitness";
  let titles = [
    "Awakening the Muscle Memory (Day 1 Warmup)",
    "The Endurance Pilgrim's Trek (Day 2 Pace)",
    "The Core Resistance Rite (Day 3 Stamina)",
    "Elixir of Active Recovery (Day 4 Mobility)",
    "Breaking the Stride Boundary (Day 5 Threshold)",
    "The Veteran Warrior's Form (Day 6 Rhythm)",
    "Ascension: Conquer the Final Horizon (Day 7 Milestone)",
  ];

  if (
    goalLower.includes("code") ||
    goalLower.includes("program") ||
    goalLower.includes("learn") ||
    goalLower.includes("read") ||
    goalLower.includes("study")
  ) {
    attribute = "INTELLECT";
    category = "knowledge";
    titles = [
      "Decipher the Foundation Scrolls (Day 1 Discovery)",
      "Forge the First Working Artifact (Day 2 Syntax Trial)",
      "Conquer the Logic Labyrinth (Day 3 Problem Solving)",
      "Debug the Spectral Glitches (Day 4 Refinement)",
      "Construct the Grand Module (Day 5 Integration)",
      "The Polish & Review Ritual (Day 6 Verification)",
      "Ascension: Deploy the Masterwork (Day 7 Mastery)",
    ];
  } else if (
    goalLower.includes("walk") ||
    goalLower.includes("run") ||
    goalLower.includes("step") ||
    goalLower.includes("hike") ||
    goalLower.includes("jog")
  ) {
    attribute = "SWIFTNESS";
    category = "fitness";
    titles = [
      "The Trailblazer's First Footing (Day 1 Scout)",
      "Cadence of the Wind-Strider (Day 2 Pace)",
      "Conquering the Extended Ridge (Day 3 Stamina)",
      "The Ranger's Rest & Mobility Rite (Day 4 Recovery)",
      "Pushing the Boundary Marker (Day 5 Push)",
      "The Fleet-Footed Discipline (Day 6 Rhythm)",
      "Grand Odyssey: Milestone Victory (Day 7 Triumph)",
    ];
  } else if (
    goalLower.includes("sleep") ||
    goalLower.includes("water") ||
    goalLower.includes("meditate") ||
    goalLower.includes("health") ||
    goalLower.includes("diet")
  ) {
    attribute = "VITALITY";
    category = "wellness";
    titles = [
      "The Renewal Ceremony (Day 1 Foundation)",
      "Purification of the Daily Vessel (Day 2 Rhythm)",
      "Deep Restoration Sanctuary (Day 3 Habit)",
      "Harmonizing the Inner Life-Force (Day 4 Balance)",
      "Strengthening the Vital Shield (Day 5 Fortify)",
      "The Calm & Centered Ritual (Day 6 Stability)",
      "Avatar of Vital Equilibrium (Day 7 Ascension)",
    ];
  }

  const difficulties: Array<"easy" | "medium" | "hard" | "epic"> = [
    "easy", "easy", "medium", "medium", "hard", "hard", "epic",
  ];

  const quests: AIQuestItem[] = [];
  for (let d = 1; d <= durationDays; d++) {
    const idx = (d - 1) % titles.length;
    const diff = difficulties[Math.min(d - 1, difficulties.length - 1)];
    const xp = diff === "easy" ? 25 : diff === "medium" ? 50 : diff === "hard" ? 85 : 150;
    const gold = diff === "easy" ? 15 : diff === "medium" ? 30 : diff === "hard" ? 50 : 100;

    quests.push({
      day: d,
      title: `${titles[idx]} - ${goal.length > 35 ? goal.slice(0, 32) + "..." : goal}`,
      category,
      attribute,
      difficulty: diff,
      xp_reward: xp,
      gold_reward: gold,
      lore_flavor: `Day ${d} milestone for the ${heroClass.toUpperCase()} to conquer "${goal}" and claim legendary renown.`,
      is_priority: d === 1 || d === durationDays,
      is_recurring: false,
    });
  }

  const totalXp = quests.reduce((sum, q) => sum + q.xp_reward, 0);
  const totalGold = quests.reduce((sum, q) => sum + q.gold_reward, 0);

  return {
    questline_title: `Campaign: Master "${goal}"`,
    lore_brief: `An epic ${durationDays}-day saga forged for the ${heroClass}. Each step translates real-world dedication into character ascension.`,
    target_goal: goal,
    hero_class: heroClass,
    duration_days: durationDays,
    total_estimated_xp: totalXp,
    total_estimated_gold: totalGold,
    quests,
  };
}

/**
 * Generate an AI Questline with Gemini Dungeon Master (with instant procedural fallback)
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

    if (res.ok) {
      const data: AIGeneratedQuestline = await res.json();
      return { data };
    }

    console.warn(
      `FastAPI AI endpoint returned HTTP ${res.status}. Seamlessly activating RPG Dungeon Master fallback.`
    );
    const fallback = generateClientFallbackQuestline(goal, heroClass, durationDays, dailyMinutes);
    return { data: fallback };
  } catch (err: any) {
    console.warn(
      "Network unreachable for remote AI, activating RPG Dungeon Master fallback:",
      err
    );
    const fallback = generateClientFallbackQuestline(goal, heroClass, durationDays, dailyMinutes);
    return { data: fallback };
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
