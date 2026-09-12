"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "./supabase/client";
import { Quest, UserProfile, RewardItem, DifficultyType, CategoryType } from "./types/rpg";
import {
  processXpGain,
  getCategoryAttribute,
  getDifficultyRewards,
  playQuestSound,
  evaluateMidnightStreak,
  getLocalDateString,
  getIndianDateString,
  resetRecurringQuestsForNewDay,
  STARTER_QUESTS,
} from "./rpg-engine";

export interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  dateOfBirth: string;
  username: string;
  country: string;
  avatarClass?: string;
}

interface AuthContextType {
  user: { id: string; email?: string } | null;
  profile: UserProfile | null;
  quests: Quest[];
  unlockedRewards: string[];
  loading: boolean;
  isConfigured: boolean;
  isGuest: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (
    params: SignUpParams
  ) => Promise<{ error?: string; requiresEmailConfirmation?: boolean }>;
  signInAsGuest: () => void;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error?: string }>;
  createQuest: (params: {
    title: string;
    category: CategoryType;
    difficulty: DifficultyType;
    isRecurring?: boolean;
    isPriority?: boolean;
  }) => Promise<{ error?: string }>;
  toggleQuestCompletion: (questId: string) => Promise<{
    leveledUp?: boolean;
    newLevel?: number;
    xpEarned?: number;
    goldEarned?: number;
  }>;
  deleteQuest: (questId: string) => Promise<{ error?: string }>;
  purchaseReward: (reward: RewardItem) => Promise<{ error?: string }>;
  refreshData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function setSessionCookie() {
  if (typeof document !== "undefined") {
    document.cookie = "life_rpg_logged_in=true; path=/; max-age=604800; SameSite=Lax";
  }
}

function clearSessionCookie() {
  if (typeof document !== "undefined") {
    document.cookie = "life_rpg_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax";
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [unlockedRewards, setUnlockedRewards] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load user data directly from Supabase
  const loadUserData = useCallback(async (userId: string) => {
    const supabase = createClient();
    try {
      // 1. Fetch Quests from Supabase
      const { data: questsData, error: questsErr } = await supabase
        .from("quests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      let loadedQuests: Quest[] = [];
      if (!questsErr && questsData) {
        if (questsData.length === 0) {
          const initialQuests: Quest[] = STARTER_QUESTS.map((q) => ({
            ...q,
            id: crypto.randomUUID ? crypto.randomUUID() : "q-" + Math.random().toString(36).substring(2, 9),
            user_id: userId,
            completed_at: null,
            created_at: new Date().toISOString(),
          }));
          await supabase.from("quests").insert(initialQuests);
          loadedQuests = initialQuests;
        } else {
          loadedQuests = questsData as Quest[];
        }
      }

      // Check for 00:00 IST midnight reset of recurring quests
      const { updatedQuests: refreshedQuests, resetCount } = resetRecurringQuestsForNewDay(loadedQuests);
      if (resetCount > 0) {
        loadedQuests = refreshedQuests;
        for (const q of refreshedQuests.filter((x) => x.is_recurring && !x.completed)) {
          await supabase
            .from("quests")
            .update({ completed: false, completed_at: null })
            .eq("id", q.id);
        }
      }
      setQuests(loadedQuests);

      // 2. Fetch Progression
      const { data: progData, error: progErr } = await supabase
        .from("user_progression")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      let progression = progData;
      if (!progression) {
        const initialProg = {
          user_id: userId,
          level: 1,
          current_xp: 0,
          gold: 50,
          streak_days: 1,
          last_active_date: new Date().toISOString().split("T")[0],
          brawn_xp: 0,
          intellect_xp: 0,
          swiftness_xp: 0,
          vitality_xp: 0,
          total_quests_completed: 0,
        };
        const { data: insertedProg } = await supabase
          .from("user_progression")
          .upsert([initialProg])
          .select()
          .single();
        progression = insertedProg || initialProg;
      }

      // Evaluate midnight streak reset
      const todayStr = getLocalDateString();
      const completedTodayCount = loadedQuests.filter(
        (q) => q.completed && q.completed_at && q.completed_at.startsWith(todayStr)
      ).length;
      const hasAnyCompleted = loadedQuests.some((q) => q.completed);

      const rawStreak = progression?.streak_days ?? 0;
      const rawLastActive = progression?.last_active_date ?? null;
      const { currentStreak, lastActiveDate, resetOccurred } = evaluateMidnightStreak(
        rawStreak,
        rawLastActive,
        completedTodayCount,
        hasAnyCompleted
      );

      if ((resetOccurred && rawStreak > 0) || currentStreak !== rawStreak || lastActiveDate !== rawLastActive) {
        await supabase
          .from("user_progression")
          .update({
            streak_days: currentStreak,
            last_active_date: lastActiveDate,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (resetOccurred && rawStreak > 0) {
          await supabase.from("streak_records").insert([
            {
              user_id: userId,
              streak_count: 0,
              activity_date: todayStr,
              tasks_completed_count: 0,
              action: "reset",
            },
          ]);
        }
      }

      // 3. Fetch Profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileData) {
        setProfile({
          id: userId,
          username: profileData.username || "Adventurer",
          full_name: profileData.full_name,
          date_of_birth: profileData.date_of_birth,
          country: profileData.country,
          avatar_class: profileData.avatar_class || "warrior",
          level: progression?.level ?? 1,
          current_xp: progression?.current_xp ?? 0,
          gold: progression?.gold ?? 50,
          streak_days: currentStreak,
          last_active_date: lastActiveDate,
          brawn_xp: progression?.brawn_xp ?? 0,
          intellect_xp: progression?.intellect_xp ?? 0,
          swiftness_xp: progression?.swiftness_xp ?? 0,
          vitality_xp: progression?.vitality_xp ?? 0,
        });
      } else {
        const initialProfile = {
          id: userId,
          username: "Adventurer",
          avatar_class: "warrior",
        };
        await supabase.from("profiles").upsert([initialProfile]);
        setProfile({
          ...initialProfile,
          level: progression?.level ?? 1,
          current_xp: progression?.current_xp ?? 0,
          gold: progression?.gold ?? 50,
          streak_days: currentStreak,
          last_active_date: lastActiveDate,
          brawn_xp: progression?.brawn_xp ?? 0,
          intellect_xp: progression?.intellect_xp ?? 0,
          swiftness_xp: progression?.swiftness_xp ?? 0,
          vitality_xp: progression?.vitality_xp ?? 0,
        });
      }

      // 4. Fetch Unlocked Rewards
      const { data: rewardsData } = await supabase
        .from("unlocked_rewards")
        .select("item_id")
        .eq("user_id", userId);

      if (rewardsData) {
        setUnlockedRewards(rewardsData.map((r) => r.item_id));
      }
    } catch (err) {
      console.error("Error loading user data from Supabase:", err);
    }
  }, []);

  // Initialize authentication on app mount via Supabase
  useEffect(() => {
    async function initAuth() {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setSessionCookie();
        setUser({ id: session.user.id, email: session.user.email });
        await loadUserData(session.user.id);
      } else {
        clearSessionCookie();
        setUser(null);
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setSessionCookie();
          setUser({ id: session.user.id, email: session.user.email });
          await loadUserData(session.user.id);
        } else {
          clearSessionCookie();
          setUser(null);
          setProfile(null);
          setQuests([]);
          setUnlockedRewards([]);
        }
      });

      setLoading(false);
      return () => {
        subscription.unsubscribe();
      };
    }

    initAuth();
  }, [loadUserData]);

  // Sign In with Email & Password
  const signInWithEmail = async (email: string, password: string): Promise<{ error?: string }> => {
    playQuestSound("click");
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      setSessionCookie();
      setUser({ id: data.user.id, email: data.user.email });
      await loadUserData(data.user.id);
    }
    return {};
  };

  // Sign Up: Directly persists account to Supabase auth, profiles, progression, and quests tables
  const signUpWithEmail = async ({
    email,
    password,
    fullName,
    dateOfBirth,
    username,
    country,
    avatarClass = "warrior",
  }: SignUpParams): Promise<{ error?: string; requiresEmailConfirmation?: boolean }> => {
    playQuestSound("click");
    const supabase = createClient();

    // 1. Create auth user in Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName,
          date_of_birth: dateOfBirth,
          country,
          avatar_class: avatarClass,
        },
      },
    });

    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      const userId = data.user.id;

      // 2. Explicitly persist profile to public.profiles table in Supabase
      const { error: profileErr } = await supabase.from("profiles").upsert({
        id: userId,
        username: username || email.split("@")[0],
        full_name: fullName,
        date_of_birth: dateOfBirth || null,
        country: country,
        avatar_class: avatarClass || "warrior",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (profileErr) {
        console.error("Supabase profile insert error:", profileErr);
      }

      // 3. Explicitly persist progression to public.user_progression table in Supabase
      const { error: progErr } = await supabase.from("user_progression").upsert({
        user_id: userId,
        level: 1,
        current_xp: 0,
        gold: 50,
        streak_days: 1,
        last_active_date: new Date().toISOString().split("T")[0],
        brawn_xp: 0,
        intellect_xp: 0,
        swiftness_xp: 0,
        vitality_xp: 0,
        total_quests_completed: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (progErr) {
        console.error("Supabase progression insert error:", progErr);
      }

      // 4. Explicitly persist starter quests to public.quests table in Supabase
      const initialQuests = STARTER_QUESTS.map((q) => ({
        user_id: userId,
        title: q.title,
        category: q.category,
        attribute: q.attribute,
        difficulty: q.difficulty,
        xp_reward: q.xp_reward,
        gold_reward: q.gold_reward,
        completed: false,
      }));
      await supabase.from("quests").insert(initialQuests);

      if (!data.session) {
        return { requiresEmailConfirmation: true };
      }

      setSessionCookie();
      setUser({ id: userId, email: data.user.email });
      await loadUserData(userId);
    }

    return {};
  };

  const signInAsGuest = () => {
    // No-op: Guest mode disabled to ensure 100% Supabase persistence
  };

  // Sign Out
  const signOut = async () => {
    playQuestSound("click");
    clearSessionCookie();
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setQuests([]);
    setUnlockedRewards([]);
  };

  // Update Profile Information in Supabase
  const updateProfile = async (updates: Partial<UserProfile>): Promise<{ error?: string }> => {
    if (!profile) return { error: "No profile loaded." };
    const updatedProfile: UserProfile = { ...profile, ...updates };
    setProfile(updatedProfile);

    const supabase = createClient();
    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.full_name !== undefined) payload.full_name = updates.full_name;
    if (updates.date_of_birth !== undefined) payload.date_of_birth = updates.date_of_birth || null;
    if (updates.country !== undefined) payload.country = updates.country;
    if (updates.username !== undefined) payload.username = updates.username;
    if (updates.avatar_class !== undefined) payload.avatar_class = updates.avatar_class;

    const { error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", profile.id);

    if (error) {
      console.error("Error updating profile in Supabase:", error);
      return { error: error.message };
    }

    return {};
  };

  // Create Quest in Supabase
  const createQuest = async ({
    title,
    category,
    difficulty,
    isRecurring = false,
    isPriority = false,
  }: {
    title: string;
    category: CategoryType;
    difficulty: DifficultyType;
    isRecurring?: boolean;
    isPriority?: boolean;
  }): Promise<{ error?: string }> => {
    if (!user) return { error: "You must be signed in to create a quest." };

    const attribute = getCategoryAttribute(category);
    const rewards = getDifficultyRewards(difficulty);

    const newQuest: Quest = {
      id: crypto.randomUUID ? crypto.randomUUID() : "q-" + Date.now(),
      user_id: user.id,
      title: title.trim(),
      category,
      attribute,
      difficulty,
      xp_reward: rewards.xp,
      gold_reward: rewards.gold,
      completed: false,
      completed_at: null,
      is_recurring: Boolean(isRecurring),
      is_priority: Boolean(isPriority),
      last_completed_date: null,
      created_at: new Date().toISOString(),
    };

    setQuests((prev) => [newQuest, ...prev]);
    playQuestSound("click");

    const supabase = createClient();
    const { error } = await supabase.from("quests").insert([newQuest]);
    if (error) {
      console.error("Error creating quest in Supabase:", error);
      setQuests((prev) => prev.filter((q) => q.id !== newQuest.id));
      return { error: error.message };
    }

    return {};
  };

  // Toggle Quest Complete / Incomplete in Supabase
  const toggleQuestCompletion = async (questId: string) => {
    const quest = quests.find((q) => q.id === questId);
    if (!quest || !profile) return {};

    const willBeCompleted = !quest.completed;
    const nowIso = willBeCompleted ? new Date().toISOString() : null;
    const completedDate = willBeCompleted ? getIndianDateString() : null;

    const updatedQuests = quests.map((q) =>
      q.id === questId
        ? {
            ...q,
            completed: willBeCompleted,
            completed_at: nowIso,
            last_completed_date: completedDate ?? q.last_completed_date,
          }
        : q
    );
    setQuests(updatedQuests);

    let leveledUp = false;
    let newLevel = profile.level;
    let xpEarned = 0;
    let goldEarned = 0;

    const supabase = createClient();

    if (willBeCompleted) {
      xpEarned = quest.xp_reward;
      goldEarned = quest.gold_reward;

      const result = processXpGain(profile, xpEarned, goldEarned, quest.attribute);
      leveledUp = result.leveledUp;
      newLevel = result.newLevel;

      setProfile(result.updatedProfile);

      if (leveledUp) {
        playQuestSound("levelup");
      } else {
        playQuestSound("complete");
      }

      await supabase
        .from("user_progression")
        .update({
          level: result.updatedProfile.level,
          current_xp: result.updatedProfile.current_xp,
          gold: result.updatedProfile.gold,
          streak_days: result.updatedProfile.streak_days,
          last_active_date: result.updatedProfile.last_active_date,
          brawn_xp: result.updatedProfile.brawn_xp,
          intellect_xp: result.updatedProfile.intellect_xp,
          swiftness_xp: result.updatedProfile.swiftness_xp,
          vitality_xp: result.updatedProfile.vitality_xp,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", profile.id);

      await supabase.from("quest_history").insert([
        {
          user_id: profile.id,
          quest_id: questId,
          quest_title: quest.title,
          attribute: quest.attribute,
          xp_earned: xpEarned,
          gold_earned: goldEarned,
        },
      ]);

      if (result.streakIncremented) {
        await supabase.from("streak_records").insert([
          {
            user_id: profile.id,
            streak_count: result.updatedProfile.streak_days,
            activity_date: result.updatedProfile.last_active_date,
            tasks_completed_count: 1,
            action: "increment",
          },
        ]);
      }
    } else {
      playQuestSound("click");
      const xpToSubtract = quest.xp_reward;
      const goldToSubtract = quest.gold_reward;
      const updatedGold = Math.max(0, profile.gold - goldToSubtract);
      const updatedXp = Math.max(0, profile.current_xp - xpToSubtract);
      let updatedBrawn = profile.brawn_xp;
      let updatedIntellect = profile.intellect_xp;
      let updatedSwiftness = profile.swiftness_xp;
      let updatedVitality = profile.vitality_xp;
      if (quest.attribute === "BRAWN") updatedBrawn = Math.max(0, updatedBrawn - xpToSubtract);
      if (quest.attribute === "INTELLECT") updatedIntellect = Math.max(0, updatedIntellect - xpToSubtract);
      if (quest.attribute === "SWIFTNESS") updatedSwiftness = Math.max(0, updatedSwiftness - xpToSubtract);
      if (quest.attribute === "VITALITY") updatedVitality = Math.max(0, updatedVitality - xpToSubtract);

      const todayStr = getLocalDateString();
      const otherTasksCompletedToday = updatedQuests.filter(
        (q) => q.id !== questId && q.completed && q.completed_at && q.completed_at.startsWith(todayStr)
      );

      let revertedStreak = profile.streak_days;
      let revertedLastActive: string | null = profile.last_active_date ?? null;

      if (otherTasksCompletedToday.length === 0 && profile.last_active_date === todayStr) {
        revertedStreak = Math.max(0, profile.streak_days - 1);
        revertedLastActive = null;
      }

      const revertedProfile: UserProfile = {
        ...profile,
        current_xp: updatedXp,
        gold: updatedGold,
        streak_days: revertedStreak,
        last_active_date: revertedLastActive,
        brawn_xp: updatedBrawn,
        intellect_xp: updatedIntellect,
        swiftness_xp: updatedSwiftness,
        vitality_xp: updatedVitality,
      };
      setProfile(revertedProfile);

      await supabase
        .from("user_progression")
        .update({
          current_xp: updatedXp,
          gold: updatedGold,
          streak_days: revertedStreak,
          last_active_date: revertedLastActive,
          brawn_xp: updatedBrawn,
          intellect_xp: updatedIntellect,
          swiftness_xp: updatedSwiftness,
          vitality_xp: updatedVitality,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", profile.id);

      if (revertedStreak !== profile.streak_days) {
        await supabase.from("streak_records").insert([
          {
            user_id: profile.id,
            streak_count: revertedStreak,
            activity_date: todayStr,
            tasks_completed_count: 0,
            action: "rollback",
          },
        ]);
      }
    }

    await supabase
      .from("quests")
      .update({
        completed: willBeCompleted,
        completed_at: nowIso,
        last_completed_date: completedDate,
      })
      .eq("id", questId);

    return { leveledUp, newLevel, xpEarned, goldEarned };
  };

  // Delete Quest in Supabase
  const deleteQuest = async (questId: string): Promise<{ error?: string }> => {
    playQuestSound("delete");
    const updatedQuests = quests.filter((q) => q.id !== questId);
    setQuests(updatedQuests);

    const supabase = createClient();
    const { error } = await supabase.from("quests").delete().eq("id", questId);
    if (error) {
      console.error("Error deleting quest in Supabase:", error);
      return { error: error.message };
    }

    return {};
  };

  // Purchase Reward in Supabase
  const purchaseReward = async (reward: RewardItem): Promise<{ error?: string }> => {
    if (!profile) return { error: "Profile not loaded." };
    if (profile.gold < reward.cost) {
      return { error: "Not enough Gold! Complete more quests to earn Gold." };
    }

    const updatedGold = profile.gold - reward.cost;
    const updatedProfile = { ...profile, gold: updatedGold };
    setProfile(updatedProfile);

    const newUnlocked = [...unlockedRewards, reward.id];
    setUnlockedRewards(newUnlocked);
    playQuestSound("levelup");

    const supabase = createClient();
    await supabase
      .from("user_progression")
      .update({ gold: updatedGold, updated_at: new Date().toISOString() })
      .eq("user_id", profile.id);

    await supabase.from("unlocked_rewards").insert([
      {
        user_id: profile.id,
        item_id: reward.id,
        title: reward.title,
        cost: reward.cost,
      },
    ]);

    return {};
  };

  const refreshData = async () => {
    if (user) {
      await loadUserData(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        quests,
        unlockedRewards,
        loading,
        isConfigured: true,
        isGuest: false,
        signInWithEmail,
        signUpWithEmail,
        signInAsGuest,
        signOut,
        updateProfile,
        createQuest,
        toggleQuestCompletion,
        deleteQuest,
        purchaseReward,
        refreshData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
