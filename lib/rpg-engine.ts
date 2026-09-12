import { AttributeType, DifficultyType, CategoryType, Quest, UserProfile } from "./types/rpg";

// Non-linear XP curve: each level requires exponentially more XP than the previous
export function getXpRequiredForLevel(level: number): number {
  if (level <= 1) return 100;
  return Math.round(100 * Math.pow(level, 1.35));
}

export function getCategoryAttribute(category: CategoryType): AttributeType {
  switch (category) {
    case "fitness":
      return "BRAWN";
    case "knowledge":
      return "INTELLECT";
    case "habits":
      return "SWIFTNESS";
    case "wellness":
      return "VITALITY";
  }
}

export function getDifficultyRewards(difficulty: DifficultyType): { xp: number; gold: number } {
  switch (difficulty) {
    case "easy":
      return { xp: 20, gold: 10 };
    case "medium":
      return { xp: 40, gold: 25 };
    case "hard":
      return { xp: 75, gold: 50 };
    case "epic":
      return { xp: 150, gold: 100 };
  }
}

// Attribute color tokens and badges
export const ATTRIBUTE_CONFIG: Record<
  AttributeType,
  {
    name: string;
    label: string;
    icon: string;
    color: string;
    bg: string;
    border: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  BRAWN: {
    name: "Brawn",
    label: "Strength & Physical Grit",
    icon: "🥊",
    color: "#FF6B8B",
    bg: "bg-[#FFEAEF]",
    border: "border-[#FF6B8B]",
    badgeBg: "bg-[#FF6B8B]",
    badgeText: "text-white",
  },
  INTELLECT: {
    name: "Intellect",
    label: "Focus, Coding & Mind Agility",
    icon: "🧠",
    color: "#8B5CF6",
    bg: "bg-[#F0EBFF]",
    border: "border-[#8B5CF6]",
    badgeBg: "bg-[#8B5CF6]",
    badgeText: "text-white",
  },
  SWIFTNESS: {
    name: "Swiftness",
    label: "Daily Execution & Speed",
    icon: "⚡",
    color: "#06D6A0",
    bg: "bg-[#E8FAF5]",
    border: "border-[#06D6A0]",
    badgeBg: "bg-[#06D6A0]",
    badgeText: "text-slate-950",
  },
  VITALITY: {
    name: "Vitality",
    label: "Recovery, Sleep & Well-being",
    icon: "🌿",
    color: "#D97706",
    bg: "bg-[#FFF8E7]",
    border: "border-[#D97706]",
    badgeBg: "bg-[#FFD166]",
    badgeText: "text-slate-950",
  },
};

// Calculate level from attribute specific XP
export function getAttributeLevel(xp: number): { level: number; currentXp: number; nextLevelXp: number; percent: number } {
  const xpPerLevel = 60;
  const level = Math.floor(xp / xpPerLevel) + 1;
  const currentXp = xp % xpPerLevel;
  const percent = Math.min(100, Math.round((currentXp / xpPerLevel) * 100));
  return { level, currentXp, nextLevelXp: xpPerLevel, percent };
}

// Helper to get local date in YYYY-MM-DD format based on user's timezone
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Helper to get date string in Indian Standard Time (IST, UTC+5:30)
// Used for daily recurring task reset at 00:00 Indian Time zone
export function getIndianDateString(d: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    // Fallback offset: UTC + 5 hours 30 mins
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(d.getTime() + istOffset);
    return istDate.toISOString().split("T")[0];
  }
}

// Check recurring tasks and reset any completed before today's date in Indian Standard Time (00:00 IST)
export function resetRecurringQuestsForNewDay(
  quests: Quest[]
): { updatedQuests: Quest[]; resetCount: number } {
  const currentIstDate = getIndianDateString();
  let resetCount = 0;

  const updatedQuests = quests.map((q) => {
    if (!q.is_recurring) return q;

    // If recurring quest was marked completed:
    if (q.completed) {
      // Check when it was last completed in IST
      const completedDate =
        q.last_completed_date || (q.completed_at ? q.completed_at.split("T")[0] : null);

      // If completed on a previous day before today's IST date (00:00 IST passed):
      if (completedDate && completedDate < currentIstDate) {
        resetCount++;
        return {
          ...q,
          completed: false,
          completed_at: null,
        };
      }
    }
    return q;
  });

  return { updatedQuests, resetCount };
}

// Difference in calendar days between two YYYY-MM-DD strings (date2 - date1)
export function getCalendarDaysDiff(dateStr1: string, dateStr2: string): number {
  if (!dateStr1 || !dateStr2) return 999;
  const [y1, m1, d1] = dateStr1.split("-").map(Number);
  const [y2, m2, d2] = dateStr2.split("-").map(Number);
  if (isNaN(y1) || isNaN(m1) || isNaN(d1) || isNaN(y2) || isNaN(m2) || isNaN(d2)) return 999;
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

export interface StreakEvaluationResult {
  currentStreak: number;
  lastActiveDate: string | null;
  resetOccurred: boolean;
  completedToday: boolean;
}

// Evaluate if streak should be reset at 00:00 midnight or if it's currently 0
export function evaluateMidnightStreak(
  streak_days: number,
  last_active_date?: string | null,
  completedQuestsTodayCount: number = 0,
  hasAnyCompletedQuests: boolean = true
): StreakEvaluationResult {
  const todayStr = getLocalDateString();

  // If user has 0 completed quests in total, or missing active date, or streak <= 0:
  if (!hasAnyCompletedQuests || !last_active_date || streak_days <= 0) {
    return {
      currentStreak: 0,
      lastActiveDate: null,
      resetOccurred: streak_days > 0,
      completedToday: false,
    };
  }

  const diffDays = getCalendarDaysDiff(last_active_date, todayStr);

  if (diffDays === 0) {
    // Marked active today: verify that the user actually completed at least 1 quest today!
    if (completedQuestsTodayCount > 0) {
      return {
        currentStreak: Math.max(1, streak_days),
        lastActiveDate: todayStr,
        resetOccurred: false,
        completedToday: true,
      };
    } else {
      // Inconsistent: 0 completed tasks today -> revoke today's active date; streak is 0 or yesterday's
      return {
        currentStreak: 0,
        lastActiveDate: null,
        resetOccurred: true,
        completedToday: false,
      };
    }
  } else if (diffDays === 1) {
    // Completed yesterday! Daily streak is preserved from yesterday awaiting today's quest.
    return {
      currentStreak: streak_days,
      lastActiveDate: last_active_date,
      resetOccurred: false,
      completedToday: false,
    };
  } else {
    // diffDays > 1 (or negative): Midnight passed with NO activity yesterday!
    // Streak resets to 0.
    return {
      currentStreak: 0,
      lastActiveDate: null,
      resetOccurred: true,
      completedToday: false,
    };
  }
}

// Calculate streak updates when a task is completed
export function calculateStreakOnTaskCompletion(
  streak_days: number,
  last_active_date?: string | null
): { newStreak: number; streakIncremented: boolean; todayStr: string } {
  const todayStr = getLocalDateString();

  if (last_active_date === todayStr) {
    // Already completed at least one task today; streak is already incremented
    return { newStreak: Math.max(1, streak_days), streakIncremented: false, todayStr };
  }

  if (!last_active_date || streak_days <= 0) {
    // Default 0 streak -> becomes 1 upon first completed task of the day
    return { newStreak: 1, streakIncremented: true, todayStr };
  }

  const diffDays = getCalendarDaysDiff(last_active_date, todayStr);

  if (diffDays === 1) {
    // Consecutive day completion -> +1 day of streak!
    return { newStreak: streak_days + 1, streakIncremented: true, todayStr };
  } else {
    // Missed days (diffDays > 1) -> reset & start at 1
    return { newStreak: 1, streakIncremented: true, todayStr };
  }
}

// Process leveling up logic when gaining XP
export function processXpGain(
  profile: UserProfile,
  xpEarned: number,
  goldEarned: number,
  attribute: AttributeType
): { updatedProfile: UserProfile; leveledUp: boolean; newLevel: number; streakIncremented: boolean } {
  let { level, current_xp, gold, brawn_xp, intellect_xp, swiftness_xp, vitality_xp } = profile;

  // Add gold
  gold += goldEarned;

  // Add attribute XP
  switch (attribute) {
    case "BRAWN":
      brawn_xp += xpEarned;
      break;
    case "INTELLECT":
      intellect_xp += xpEarned;
      break;
    case "SWIFTNESS":
      swiftness_xp += xpEarned;
      break;
    case "VITALITY":
      vitality_xp += xpEarned;
      break;
  }

  // Add character XP and check for level ups
  let newCurrentXp = current_xp + xpEarned;
  let newLevel = level;
  let leveledUp = false;

  while (true) {
    const requiredXp = getXpRequiredForLevel(newLevel);
    if (newCurrentXp >= requiredXp) {
      newCurrentXp -= requiredXp;
      newLevel += 1;
      leveledUp = true;
    } else {
      break;
    }
  }

  // Calculate streak update
  const { newStreak, todayStr, streakIncremented } = calculateStreakOnTaskCompletion(
    profile.streak_days,
    profile.last_active_date
  );

  const updatedProfile: UserProfile = {
    ...profile,
    level: newLevel,
    current_xp: newCurrentXp,
    gold,
    streak_days: newStreak,
    last_active_date: todayStr,
    brawn_xp,
    intellect_xp,
    swiftness_xp,
    vitality_xp,
  };

  return { updatedProfile, leveledUp, newLevel, streakIncremented };
}

// Default initial quests for new players
export const STARTER_QUESTS: Omit<Quest, "id" | "user_id">[] = [
  {
    title: "Morning Hydration (Drink 500ml Water)",
    category: "fitness",
    attribute: "BRAWN",
    difficulty: "easy",
    xp_reward: 20,
    gold_reward: 10,
    completed: false,
    is_recurring: true,
    is_priority: false,
  },
  {
    title: "25-min Deep Focus / Coding Session",
    category: "knowledge",
    attribute: "INTELLECT",
    difficulty: "medium",
    xp_reward: 40,
    gold_reward: 25,
    completed: false,
    is_recurring: true,
    is_priority: true,
  },
  {
    title: "Tidy Up Desk & Plan Daily Priorities",
    category: "habits",
    attribute: "SWIFTNESS",
    difficulty: "easy",
    xp_reward: 20,
    gold_reward: 10,
    completed: false,
    is_recurring: true,
    is_priority: false,
  },
  {
    title: "10-minute Evening Stretch or Meditation",
    category: "wellness",
    attribute: "VITALITY",
    difficulty: "easy",
    xp_reward: 20,
    gold_reward: 10,
    completed: false,
    is_recurring: false,
    is_priority: false,
  },
];

// Play pleasant synthesizer sound effects via browser Web Audio API
export function playQuestSound(type: "complete" | "levelup" | "click" | "delete") {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === "complete") {
      // Happy two-tone ding
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + index * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + index * 0.08);
        osc.stop(ctx.currentTime + index * 0.08 + 0.25);
      });
    } else if (type === "levelup") {
      // Fanfare arpeggio
      const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.1);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + index * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.1 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + index * 0.1);
        osc.stop(ctx.currentTime + index * 0.1 + 0.4);
      });
    } else if (type === "click") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    }
  } catch {
    // AudioContext blocked by browser autoplay policy until user interaction
  }
}
