"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient, isSupabaseConfigured } from "./supabase/client";
import { Quest, UserProfile, RewardItem, AttributeType, DifficultyType, CategoryType } from "./types/rpg";
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

const LOCAL_STORAGE_USER_KEY = "life_rpg_session_user";
const LOCAL_STORAGE_PROFILE_KEY = "life_rpg_profile";
const LOCAL_STORAGE_QUESTS_KEY = "life_rpg_quests";
const LOCAL_STORAGE_REWARDS_KEY = "life_rpg_rewards";

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

const DEFAULT_GUEST_PROFILE: UserProfile = {
  id: "guest-adventurer",
  username: "Knight Valiant",
  avatar_class: "warrior",
  level: 1,
  current_xp: 0,
  gold: 50,
  streak_days: 0,
  last_active_date: null,
  brawn_xp: 0,
  intellect_xp: 0,
  swiftness_xp: 0,
  vitality_xp: 0,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [unlockedRewards, setUnlockedRewards] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  const supabaseConfigured = isSupabaseConfigured();

  // Load user data from Supabase or Local Storage
  const loadUserData = useCallback(
    async (userId: string) => {
      if (supabaseConfigured) {
        const supabase = createClient();
        try {
          // 1. Fetch Quests first so we can verify actual completed task activity
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
                id: crypto.randomUUID(),
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

          // 2. Fetch Profile & Progression
          const { data: profileData, error: profileErr } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

          const { data: progData, error: progErr } = await supabase
            .from("user_progression")
            .select("*")
            .eq("user_id", userId)
            .single();

          let progression = progData;

          if (progErr && progErr.code === "PGRST116") {
            const initialProg = {
              user_id: userId,
              level: 1,
              current_xp: 0,
              gold: 50,
              streak_days: 0,
              last_active_date: null,
              brawn_xp: 0,
              intellect_xp: 0,
              swiftness_xp: 0,
              vitality_xp: 0,
              total_quests_completed: 0,
            };
            const { data: insertedProg } = await supabase
              .from("user_progression")
              .insert([initialProg])
              .select()
              .single();
            progression = insertedProg || initialProg;
          }

          // Evaluate midnight streak reset & validate against real completed quests
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

          if (!profileErr && profileData) {
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
          } else if (profileErr && profileErr.code === "PGRST116") {
            const initialProfile = {
              id: userId,
              username: "Adventurer",
              avatar_class: "warrior",
            };
            await supabase.from("profiles").insert([initialProfile]);
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

          // 3. Fetch Unlocked Rewards
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
      } else {
        // Local storage / offline guest mode
        // 1. Quests are loaded first
        const storedQuests = localStorage.getItem(LOCAL_STORAGE_QUESTS_KEY);
        let loadedQuests: Quest[] = [];

        if (storedQuests) {
          try {
            loadedQuests = JSON.parse(storedQuests);
          } catch {
            loadedQuests = STARTER_QUESTS.map((q) => ({
              ...q,
              id: "quest-" + Math.random().toString(36).substring(2, 9),
              user_id: userId,
              created_at: new Date().toISOString(),
            }));
          }
        } else {
          loadedQuests = STARTER_QUESTS.map((q) => ({
            ...q,
            id: "quest-" + Math.random().toString(36).substring(2, 9),
            user_id: userId,
            created_at: new Date().toISOString(),
          }));
          localStorage.setItem(LOCAL_STORAGE_QUESTS_KEY, JSON.stringify(loadedQuests));
        }

        // Check for 00:00 IST midnight reset of recurring quests
        const { updatedQuests: refreshedQuests, resetCount } = resetRecurringQuestsForNewDay(loadedQuests);
        if (resetCount > 0) {
          loadedQuests = refreshedQuests;
          localStorage.setItem(LOCAL_STORAGE_QUESTS_KEY, JSON.stringify(loadedQuests));
        }
        setQuests(loadedQuests);

        // 2. Count completed tasks
        const todayStr = getLocalDateString();
        const completedTodayCount = loadedQuests.filter(
          (q) => q.completed && q.completed_at && q.completed_at.startsWith(todayStr)
        ).length;
        const hasAnyCompleted = loadedQuests.some((q) => q.completed);

        const storedProfile = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
        if (storedProfile) {
          try {
            const parsed = JSON.parse(storedProfile);
            const rawStreak = parsed.streak_days ?? 0;
            const rawLastActive = parsed.last_active_date ?? null;

            const { currentStreak, lastActiveDate } = evaluateMidnightStreak(
              rawStreak,
              rawLastActive,
              completedTodayCount,
              hasAnyCompleted
            );

            const updated: UserProfile = {
              ...parsed,
              streak_days: currentStreak,
              last_active_date: lastActiveDate,
            };
            setProfile(updated);
            localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updated));
          } catch {
            setProfile(DEFAULT_GUEST_PROFILE);
            localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(DEFAULT_GUEST_PROFILE));
          }
        } else {
          setProfile(DEFAULT_GUEST_PROFILE);
          localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(DEFAULT_GUEST_PROFILE));
        }

        const storedRewards = localStorage.getItem(LOCAL_STORAGE_REWARDS_KEY);
        if (storedRewards) {
          try {
            setUnlockedRewards(JSON.parse(storedRewards));
          } catch {
            setUnlockedRewards([]);
          }
        }
      }
    },
    [supabaseConfigured]
  );

  // Initialize authentication on app mount
  useEffect(() => {
    async function initAuth() {
      setLoading(true);
      if (supabaseConfigured) {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setSessionCookie();
          setUser({ id: session.user.id, email: session.user.email });
          setIsGuest(false);
          await loadUserData(session.user.id);
        } else {
          // Check if guest mode session was active
          const localUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
          if (localUser) {
            try {
              const parsed = JSON.parse(localUser);
              setSessionCookie();
              setUser(parsed);
              setIsGuest(true);
              await loadUserData(parsed.id);
            } catch {
              clearSessionCookie();
              setUser(null);
            }
          } else {
            clearSessionCookie();
          }
        }

        // Listen to Supabase auth changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            setSessionCookie();
            setUser({ id: session.user.id, email: session.user.email });
            setIsGuest(false);
            await loadUserData(session.user.id);
          } else if (!isGuest) {
            clearSessionCookie();
            setUser(null);
            setProfile(null);
            setQuests([]);
          }
        });

        setLoading(false);
        return () => {
          subscription.unsubscribe();
        };
      } else {
        // Offline / Local mode
        const localUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
        if (localUser) {
          try {
            const parsed = JSON.parse(localUser);
            setSessionCookie();
            setUser(parsed);
            setIsGuest(true);
            await loadUserData(parsed.id);
          } catch {
            clearSessionCookie();
            setUser(null);
          }
        } else {
          clearSessionCookie();
        }
        setLoading(false);
      }
    }

    initAuth();
  }, [supabaseConfigured, loadUserData, isGuest]);

  // Sign In with Email & Password
  const signInWithEmail = async (email: string, password: string): Promise<{ error?: string }> => {
    playQuestSound("click");
    if (!supabaseConfigured) {
      // Demo authentication simulation
      const demoUser = { id: "user-" + btoa(email).substring(0, 10), email };
      setSessionCookie();
      setUser(demoUser);
      setIsGuest(false);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(demoUser));

      const existingProfile = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
      if (!existingProfile) {
        const newProfile: UserProfile = {
          ...DEFAULT_GUEST_PROFILE,
          id: demoUser.id,
          username: email.split("@")[0],
        };
        setProfile(newProfile);
        localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(newProfile));
      } else {
        await loadUserData(demoUser.id);
      }
      return {};
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      setSessionCookie();
      setUser({ id: data.user.id, email: data.user.email });
      setIsGuest(false);
      await loadUserData(data.user.id);
    }
    return {};
  };

  // Sign Up with Full Name, DOB, Username, Email, Country, Password, and Archetype
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
    if (!supabaseConfigured) {
      const demoUser = { id: "user-" + btoa(email).substring(0, 10), email };
      setSessionCookie();
      setUser(demoUser);
      setIsGuest(false);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(demoUser));

      const newProfile: UserProfile = {
        ...DEFAULT_GUEST_PROFILE,
        id: demoUser.id,
        username: username || email.split("@")[0],
        full_name: fullName,
        date_of_birth: dateOfBirth,
        country: country,
        avatar_class: avatarClass || "warrior",
        level: 1,
        current_xp: 0,
        gold: 50,
      };
      setProfile(newProfile);
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(newProfile));

      const initialQuests: Quest[] = STARTER_QUESTS.map((q) => ({
        ...q,
        id: "quest-" + Math.random().toString(36).substring(2, 9),
        user_id: demoUser.id,
        created_at: new Date().toISOString(),
      }));
      setQuests(initialQuests);
      localStorage.setItem(LOCAL_STORAGE_QUESTS_KEY, JSON.stringify(initialQuests));
      return {};
    }

    const supabase = createClient();
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
      if (!data.session) {
        // Confirmation email sent
        return { requiresEmailConfirmation: true };
      }
      setSessionCookie();
      setUser({ id: data.user.id, email: data.user.email });
      setIsGuest(false);
      await loadUserData(data.user.id);
    }
    return {};
  };

  // Guest Adventurer Quick Play
  const signInAsGuest = async () => {
    playQuestSound("click");
    setSessionCookie();
    const guestUser = { id: "guest-adventurer", email: "guest@adventurer.guild" };
    setUser(guestUser);
    setIsGuest(true);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(guestUser));
    await loadUserData(guestUser.id);
  };

  // Sign Out
  const signOut = async () => {
    playQuestSound("click");
    clearSessionCookie();
    if (supabaseConfigured) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    setUser(null);
    setProfile(null);
    setQuests([]);
    setIsGuest(false);
  };

  // Update Profile Information (Full Name, Date of Birth, Country, Avatar Class, Username)
  const updateProfile = async (updates: Partial<UserProfile>): Promise<{ error?: string }> => {
    if (!profile) return { error: "No profile loaded." };
    const updatedProfile: UserProfile = { ...profile, ...updates };
    setProfile(updatedProfile);

    if (supabaseConfigured && !isGuest) {
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
    } else {
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updatedProfile));
    }

    return {};
  };

  // Create Quest (CRUD: Create)
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

    // Optimistic UI update
    setQuests((prev) => [newQuest, ...prev]);
    playQuestSound("click");

    if (supabaseConfigured && !isGuest) {
      const supabase = createClient();
      const { error } = await supabase.from("quests").insert([newQuest]);
      if (error) {
        console.error("Error creating quest:", error);
        // Rollback on failure
        setQuests((prev) => prev.filter((q) => q.id !== newQuest.id));
        return { error: error.message };
      }
    } else {
      const updated = [newQuest, ...quests];
      localStorage.setItem(LOCAL_STORAGE_QUESTS_KEY, JSON.stringify(updated));
    }

    return {};
  };

  // Toggle Quest Complete / Incomplete (CRUD: Update + XP & Gold progression)
  const toggleQuestCompletion = async (questId: string) => {
    const quest = quests.find((q) => q.id === questId);
    if (!quest || !profile) return {};

    const willBeCompleted = !quest.completed;
    const nowIso = willBeCompleted ? new Date().toISOString() : null;
    const completedDate = willBeCompleted ? getIndianDateString() : null;

    // Update quest state optimistically
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

    if (willBeCompleted) {
      xpEarned = quest.xp_reward;
      goldEarned = quest.gold_reward;

      // Process XP & non-linear leveling
      const result = processXpGain(profile, xpEarned, goldEarned, quest.attribute);
      leveledUp = result.leveledUp;
      newLevel = result.newLevel;

      setProfile(result.updatedProfile);

      if (leveledUp) {
        playQuestSound("levelup");
      } else {
        playQuestSound("complete");
      }

      // Persist user_progression and history log to Supabase
      if (supabaseConfigured && !isGuest) {
        const supabase = createClient();
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

        // Record progress in quest_history table
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

        // Record streak audit event if streak was incremented (+1 day of streak)
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
        localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(result.updatedProfile));
      }
    } else {
      playQuestSound("click");
      // Rollback XP & Gold if user unchecks a quest
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

      // Streak rollback check: Does the user have any other tasks completed today?
      const todayStr = getLocalDateString();
      const otherTasksCompletedToday = updatedQuests.filter(
        (q) => q.id !== questId && q.completed && q.completed_at && q.completed_at.startsWith(todayStr)
      );

      let revertedStreak = profile.streak_days;
      let revertedLastActive: string | null = profile.last_active_date ?? null;

      // If no other tasks remain completed today, revoke today's +1 streak credit
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

      if (supabaseConfigured && !isGuest) {
        const supabase = createClient();
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
      } else {
        localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(revertedProfile));
      }
    }

    // Persist quest update
    if (supabaseConfigured && !isGuest) {
      const supabase = createClient();
      await supabase
        .from("quests")
        .update({
          completed: willBeCompleted,
          completed_at: nowIso,
          last_completed_date: completedDate,
        })
        .eq("id", questId);
    } else {
      localStorage.setItem(LOCAL_STORAGE_QUESTS_KEY, JSON.stringify(updatedQuests));
    }

    return { leveledUp, newLevel, xpEarned, goldEarned };
  };

  // Delete Quest (CRUD: Delete)
  const deleteQuest = async (questId: string): Promise<{ error?: string }> => {
    playQuestSound("delete");
    const updatedQuests = quests.filter((q) => q.id !== questId);
    setQuests(updatedQuests);

    if (supabaseConfigured && !isGuest) {
      const supabase = createClient();
      const { error } = await supabase.from("quests").delete().eq("id", questId);
      if (error) {
        console.error("Error deleting quest:", error);
        return { error: error.message };
      }
    } else {
      localStorage.setItem(LOCAL_STORAGE_QUESTS_KEY, JSON.stringify(updatedQuests));
    }

    return {};
  };

  // Purchase Reward from Economy / Shop
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

    if (supabaseConfigured && !isGuest) {
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
    } else {
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updatedProfile));
      localStorage.setItem(LOCAL_STORAGE_REWARDS_KEY, JSON.stringify(newUnlocked));
    }

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
        isConfigured: supabaseConfigured,
        isGuest,
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
