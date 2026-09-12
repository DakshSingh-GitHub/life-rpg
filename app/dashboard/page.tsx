"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import confetti from "canvas-confetti";
import {
  SPRING_CONFIGS,
  TactileButton,
  TactileTab,
  TactileCheckbox,
  SpringProgressBar,
  AnimatedRollingCounter,
  DopamineBurstOverlay,
  FloatingBadgeItem,
} from "@/components/motion/tactile";
import {
  Sword,
  Shield,
  Sparkles,
  Flame,
  Coins,
  Plus,
  Trash2,
  Check,
  LogOut,
  Zap,
  ShoppingBag,
  CheckCircle2,
  X,
  AlertCircle,
  RotateCcw,
  ChevronDown,
  User,
  Users,
  Settings,
  Wand2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  generateQuestlineViaAI,
  enrollQuestlineViaBackend,
  AIGeneratedQuestline,
} from "@/lib/backend-client";
import {
  getXpRequiredForLevel,
  getAttributeLevel,
  ATTRIBUTE_CONFIG,
} from "@/lib/rpg-engine";
import {
  CategoryType,
  DifficultyType,
  Quest,
  RewardItem,
} from "@/lib/types/rpg";

// Pre-defined Armory / Reward items users can purchase with their earned Gold
const SHOP_REWARDS: RewardItem[] = [
  {
    id: "reward-coffee",
    title: "Artisan Coffee Elixir",
    icon: "☕",
    cost: 50,
    description: "Grant yourself a guilt-free premium barista roast.",
    category: "treat",
  },
  {
    id: "reward-gaming",
    title: "1-Hour Gaming Shield",
    icon: "🎮",
    cost: 80,
    description: "60 minutes of uninterrupted guilt-free video game time.",
    category: "perk",
  },
  {
    id: "reward-movie",
    title: "Cinema Night Ticket",
    icon: "🍿",
    cost: 120,
    description: "Watch a high-octane movie or binge your favorite series.",
    category: "treat",
  },
  {
    id: "reward-book",
    title: "Scroll of Knowledge",
    icon: "📚",
    cost: 150,
    description: "Purchase that new book or audiobook you've been eyeing.",
    category: "perk",
  },
  {
    id: "reward-badge",
    title: "Mythic Guild Champion Badge",
    icon: "👑",
    cost: 250,
    description: "Display an exclusive golden aura on your profile.",
    category: "badge",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const {
    user,
    profile,
    quests,
    unlockedRewards,
    loading,
    signOut,
    createQuest,
    toggleQuestCompletion,
    deleteQuest,
    purchaseReward,
    refreshData,
  } = useAuth();

  // Navigation tabs: 'quests' | 'shop'
  const [activeTab, setActiveTab] = useState<"quests" | "shop">("quests");

  // Category filter
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | CategoryType>("ALL");

  // New Quest Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"manual" | "ai">("manual");
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<CategoryType>("fitness");
  const [newDifficulty, setNewDifficulty] = useState<DifficultyType>("medium");
  const [newIsRecurring, setNewIsRecurring] = useState(false);
  const [newIsPriority, setNewIsPriority] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // AI Quest Generator State
  const [aiGoal, setAiGoal] = useState("");
  const [aiDuration, setAiDuration] = useState(5);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [generatedQuestline, setGeneratedQuestline] = useState<AIGeneratedQuestline | null>(null);
  const [enrollingAi, setEnrollingAi] = useState(false);

  // Level Up Toast
  const [levelUpInfo, setLevelUpInfo] = useState<{ open: boolean; level: number }>({
    open: false,
    level: 1,
  });

  // Streak Info Modal
  const [streakModalOpen, setStreakModalOpen] = useState(false);

  // Completed tasks collapse/expand toggle
  const [showCompleted, setShowCompleted] = useState(true);

  // User Profile Dropdown Menu state
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Motion and accessibility hooks
  const shouldReduceMotion = useReducedMotion();

  // Dopamine burst floating rewards state
  const [floatingRewards, setFloatingRewards] = useState<
    (FloatingBadgeItem & { questId: string })[]
  >([]);

  // Quest card punch wobble state
  const [wobblingQuestId, setWobblingQuestId] = useState<string | null>(null);

  // Floating burst counter ref
  const burstCounterRef = React.useRef(0);

  // Gold Pill coin-shake animation state
  const prevGoldRef = React.useRef(profile?.gold ?? 0);
  const [coinShaking, setCoinShaking] = useState(false);

  useEffect(() => {
    if (profile && profile.gold > prevGoldRef.current) {
      setCoinShaking(true);
      const timer = setTimeout(() => setCoinShaking(false), 800);
      prevGoldRef.current = profile.gold;
      return () => clearTimeout(timer);
    }
    if (profile) {
      prevGoldRef.current = profile.gold;
    }
  }, [profile]);

  // Confetti trigger on Level Up modal open
  useEffect(() => {
    if (levelUpInfo.open) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.55 },
        colors: ["#FF6B8B", "#FFD166", "#06D6A0", "#8B5CF6"],
      });
    }
  }, [levelUpInfo.open]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Immediate route protection: Redirect to /login if user is unauthenticated
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Gatekeeper: Never render dashboard content if user is unauthenticated or loading
  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen bg-[#FDF8EE] flex flex-col items-center justify-center p-4">
        <div className="p-8 bg-white border-3 border-slate-950 rounded-3xl shadow-[5px_5px_0px_0px_#020617] flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-12 h-12 rounded-2xl bg-[#FFEAEF] border-2 border-slate-950 flex items-center justify-center shadow-[2px_2px_0px_0px_#020617]">
            <Shield className="w-6 h-6 text-[#FF6B8B]" />
          </div>
          <h2 className="font-display font-black text-xl text-slate-950">
            Adventurer Sanctum Protected
          </h2>
          <p className="text-xs font-bold text-slate-500">
            Verifying guild credentials... Unauthenticated travelers will be redirected to the gateway.
          </p>
        </div>
      </div>
    );
  }

  // Non-linear Level calculations
  const nextLevelXp = getXpRequiredForLevel(profile.level);
  const xpPercentage = Math.min(100, Math.round((profile.current_xp / nextLevelXp) * 100));

  // Attribute levels
  const brawnStat = getAttributeLevel(profile.brawn_xp);
  const intellectStat = getAttributeLevel(profile.intellect_xp);
  const swiftnessStat = getAttributeLevel(profile.swiftness_xp);
  const vitalityStat = getAttributeLevel(profile.vitality_xp);

  // Client-side separation of tasks fetched from database: priority, recurring, standard, and completed
  const ongoingQuests = quests
    .filter((q) => !q.completed)
    .filter((q) => selectedCategory === "ALL" || q.category === selectedCategory);

  // Priority quests (ALWAYS ON TOP)
  const priorityQuests = ongoingQuests.filter((q) => q.is_priority);

  // Recurring tasks section (daily rituals, resets 00:00 IST)
  const recurringQuests = ongoingQuests.filter((q) => q.is_recurring && !q.is_priority);

  // Standard quests (non-priority, non-recurring)
  const standardQuests = ongoingQuests.filter((q) => !q.is_priority && !q.is_recurring);

  const completedQuests = quests
    .filter((q) => q.completed)
    .filter((q) => selectedCategory === "ALL" || q.category === selectedCategory);

  const totalCount = quests.length;
  const activeCount = quests.filter((q) => !q.completed).length;
  const completedCount = quests.filter((q) => q.completed).length;
  const completionPercentage =
    totalCount > 0 ? Math.min(100, Math.round((completedCount / totalCount) * 100)) : 0;

  // Handle Quest Creation
  const handleCreateQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setFormError("Quest title cannot be empty!");
      return;
    }
    setCreating(true);
    setFormError(null);

    const res = await createQuest({
      title: newTitle.trim(),
      category: newCategory,
      difficulty: newDifficulty,
      isRecurring: newIsRecurring,
      isPriority: newIsPriority,
    });

    setCreating(false);
    if (res.error) {
      setFormError(res.error);
    } else {
      setNewTitle("");
      setNewIsRecurring(false);
      setNewIsPriority(false);
      setModalOpen(false);
    }
  };

  // Handle AI Questline Generation via FastAPI Backend
  const handleGenerateAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiGoal.trim()) {
      setFormError("Please enter a goal for the AI Dungeon Master!");
      return;
    }
    setAiGenerating(true);
    setFormError(null);
    const res = await generateQuestlineViaAI(
      aiGoal.trim(),
      profile?.avatar_class || "warrior",
      aiDuration,
      30
    );
    setAiGenerating(false);
    if (res.error) {
      setFormError(res.error);
    } else if (res.data) {
      setGeneratedQuestline(res.data);
    }
  };

  // Handle Enrolling AI Questline into User's Quest Log
  const handleEnrollAI = async () => {
    if (!generatedQuestline || !profile) return;
    setEnrollingAi(true);
    setFormError(null);
    const res = await enrollQuestlineViaBackend(profile.id, generatedQuestline.quests);
    setEnrollingAi(false);
    if (!res.success) {
      setFormError(res.error || "Failed to enroll quests");
    } else {
      await refreshData();
      setModalOpen(false);
      setGeneratedQuestline(null);
      setAiGoal("");
      setModalMode("manual");
    }
  };

  // Handle Quest Toggle
  const handleToggle = async (questId: string) => {
    const targetQuest = quests.find((q) => q.id === questId);
    const isCompleting = targetQuest ? !targetQuest.completed : false;

    if (isCompleting && targetQuest) {
      // Trigger card celebratory punch/wobble
      setWobblingQuestId(questId);
      setTimeout(() => setWobblingQuestId(null), 550);

      // Spawn floating dopamine numbers burst
      burstCounterRef.current += 1;
      const burstId = `burst-${questId}-${burstCounterRef.current}`;
      const newBurstItem: FloatingBadgeItem & { questId: string } = {
        id: burstId,
        questId,
        xp: targetQuest.xp_reward,
        gold: targetQuest.gold_reward,
      };
      setFloatingRewards((prev) => [...prev, newBurstItem]);
    }

    const result = await toggleQuestCompletion(questId);
    if (result.leveledUp && result.newLevel) {
      setLevelUpInfo({ open: true, level: result.newLevel });
    }
  };

  // Helper to render individual quest card with priority and recurring badges
  const renderQuestCard = (quest: Quest, isPriorityContext: boolean = false) => {
    const cfg = ATTRIBUTE_CONFIG[quest.attribute];
    const isWobbling = wobblingQuestId === quest.id;
    const activeBursts = floatingRewards.filter((b) => b.questId === quest.id);

    return (
      <motion.div
        key={quest.id}
        layout="position"
        style={{
          transform: "translate3d(0, 0, 0)",
          WebkitBackfaceVisibility: "hidden",
          backfaceVisibility: "hidden",
          willChange: "transform, opacity",
        }}
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={
          isWobbling
            ? {
                opacity: 1,
                y: 0,
                scale: [1, 1.025, 0.985, 1],
                rotate: [0, -1, 1, 0],
                transition: { duration: 0.45, ease: "easeOut" },
              }
            : { opacity: 1, y: 0, scale: 1, rotate: 0 }
        }
        exit={{
          opacity: 0,
          scale: 0.95,
          height: 0,
          marginBottom: 0,
          paddingTop: 0,
          paddingBottom: 0,
          overflow: "hidden",
          transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
        }}
        whileHover={
          shouldReduceMotion
            ? undefined
            : {
                y: -2,
                boxShadow: "5px 5px 0px 0px #020617",
                transition: SPRING_CONFIGS.tactile,
              }
        }
        className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-colors relative flex items-center justify-between gap-3 shadow-[3px_3px_0px_0px_#020617] ${
          isPriorityContext
            ? "bg-white border-slate-950 ring-2 ring-[#FF5722]/30"
            : "bg-white border-slate-950"
        }`}
      >
        {/* Floating Numbers Dopamine Burst */}
        {activeBursts.length > 0 && (
          <DopamineBurstOverlay
            items={activeBursts}
            onComplete={(id) => {
              setFloatingRewards((prev) => prev.filter((item) => item.id !== id));
            }}
          />
        )}

        {/* Left: Complete Checkbox + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <TactileCheckbox
            completed={quest.completed}
            onClick={() => handleToggle(quest.id)}
            size="md"
          />

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span
                className={`text-[10px] font-display font-black px-2 py-0.5 rounded-lg border flex items-center gap-1 ${cfg.bg} ${cfg.border} text-slate-900`}
              >
                <span>{cfg.icon}</span>
                <span>{quest.attribute}</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {quest.difficulty}
              </span>
              {quest.is_priority && (
                <span className="text-[10px] font-display font-black px-1.5 py-0.5 rounded-lg border bg-[#FFEAEF] text-[#FF5722] border-[#FF5722] flex items-center gap-0.5">
                  <Zap className="w-3 h-3 fill-[#FF5722]" />
                  <span>Priority</span>
                </span>
              )}
              {quest.is_recurring && (
                <span className="text-[10px] font-display font-black px-1.5 py-0.5 rounded-lg border bg-[#F0FDF4] text-[#059669] border-[#059669] flex items-center gap-0.5">
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>00:00 IST</span>
                </span>
              )}
            </div>
            <div className="font-display font-bold text-sm sm:text-base text-slate-950 truncate">
              {quest.title}
            </div>
          </div>
        </div>

        {/* Right: Rewards Pills + Delete */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline-flex items-center gap-1 bg-[#FFEAEF] text-[#FF6B8B] text-xs font-display font-black px-2 py-1 rounded-xl border border-[#FF6B8B]">
            +{quest.xp_reward} XP
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 bg-[#FFF9DB] text-[#B45309] text-xs font-display font-black px-2 py-1 rounded-xl border border-[#B45309]">
            +{quest.gold_reward} Gold
          </span>

          <motion.button
            type="button"
            whileHover={{ scale: 1.15, rotate: -6 }}
            whileTap={{ scale: 0.85 }}
            onClick={() => deleteQuest(quest.id)}
            className="p-1.5 text-slate-400 hover:text-[#FF6B8B] hover:bg-[#FFEAEF] rounded-lg border border-transparent hover:border-[#FF6B8B] transition-colors cursor-pointer"
            title="Delete Quest"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#FDF8EE] text-slate-900 selection:bg-[#FFD166] selection:text-slate-950 relative flex flex-col">
      {/* Comic Dot Texture */}
      <div className="pointer-events-none fixed inset-0 comic-dots z-0" />

      {/* ============================================================ */}
      {/* 1. TOP HEADER & ADVENTURER STATUS BAR: FLOATING PILL NAVBAR  */}
      {/* ============================================================ */}
      <motion.header
        initial={{ y: -25, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...SPRING_CONFIGS.tabletopDrop, delay: 0.05 }}
        className="fixed top-2.5 sm:top-4 left-0 right-0 z-40 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pointer-events-none"
      >
        <div className="relative pointer-events-auto">
          <nav className="bg-white/90 backdrop-blur-md border-3 border-slate-950 rounded-full px-2.5 sm:px-6 py-2 sm:py-2.5 shadow-[3px_3px_0px_0px_#020617] sm:shadow-[4px_4px_0px_0px_#020617] ring-1 ring-white/80 flex items-center justify-between gap-1.5 sm:gap-2.5 transition-all hardware-accelerated">
          {/* Brand & Page Badge */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Link
              href="/"
              className="flex items-center gap-1.5 sm:gap-2.5 group focus:outline-none"
              title="Return to Home"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#FF6B8B] border-2 border-slate-950 flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_#020617] group-hover:rotate-12 transition-transform shrink-0">
                <Sword className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white transform rotate-45" />
              </div>
              <span className="font-display font-black text-base sm:text-xl tracking-tight text-slate-950">
                Life<span className="text-[#FF6B8B]">RPG</span>
              </span>
            </Link>
            <span className="hidden md:inline-block bg-[#FEF3C7] text-slate-950 text-[11px] font-black px-2.5 py-0.5 rounded-full border-2 border-slate-950 shadow-[1px_1px_0px_0px_#020617]">
              Dashboard
            </span>
          </div>

          {/* Quick Metrics (Streak, Gold, Profile Dropdown) */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Streak Counter */}
            <motion.button
              type="button"
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : {
                      y: -2,
                      boxShadow: "3px 3px 0px 0px #020617",
                      transition: SPRING_CONFIGS.tactile,
                    }
              }
              whileTap={
                shouldReduceMotion
                  ? undefined
                  : {
                      x: 2,
                      y: 2,
                      boxShadow: "1px 1px 0px 0px #020617",
                      transition: { duration: 0.05 },
                    }
              }
              onClick={() => setStreakModalOpen(true)}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border-2 border-slate-950 shadow-[1.5px_1.5px_0px_0px_#020617] sm:shadow-[2px_2px_0px_0px_#020617] transition-colors cursor-pointer focus:outline-none select-none ${
                profile.streak_days > 0
                  ? "bg-[#FFF0E6]/90 backdrop-blur-sm text-[#FF5722] hover:bg-[#ffe5d4]"
                  : "bg-slate-100/90 backdrop-blur-sm text-slate-500 hover:bg-slate-200"
              }`}
              title={
                profile.streak_days > 0
                  ? `${profile.streak_days}d Streak: Active! Click for streak details & midnight reset rules.`
                  : "0d Streak: Complete at least one quest today to ignite your streak! Click for rules."
              }
              id="streak-counter-pill"
            >
              <motion.div
                animate={
                  shouldReduceMotion || profile.streak_days === 0
                    ? undefined
                    : {
                        scale: [1, 1.15, 1],
                      }
                }
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="flex items-center justify-center shrink-0"
              >
                <Flame
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                    profile.streak_days > 0 ? "fill-[#FF5722] text-[#FF5722]" : "text-slate-400"
                  }`}
                />
              </motion.div>
              <span className="font-display font-black text-xs sm:text-sm whitespace-nowrap">
                {profile.streak_days}d<span className="hidden sm:inline"> Streak</span>
              </span>
            </motion.button>

            {/* Gold Balance with Shake Reaction & Rolling Counter */}
            <motion.div
              animate={
                shouldReduceMotion
                  ? undefined
                  : coinShaking
                  ? {
                      rotate: [-10, 10, -6, 6, 0],
                      scale: [1, 1.15, 1],
                    }
                  : { rotate: 0, scale: 1 }
              }
              transition={{ duration: 0.55, ease: "easeOut" }}
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : {
                      y: -2,
                      boxShadow: "3px 3px 0px 0px #020617",
                      transition: SPRING_CONFIGS.tactile,
                    }
              }
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-[#FFF9DB]/90 backdrop-blur-sm text-[#B45309] rounded-full border-2 border-slate-950 shadow-[1.5px_1.5px_0px_0px_#020617] sm:shadow-[2px_2px_0px_0px_#020617] select-none"
              title="Spend Gold in the Reward Armory"
            >
              <motion.div
                animate={
                  shouldReduceMotion || !coinShaking
                    ? undefined
                    : {
                        rotate: [0, -20, 20, -10, 10, 0],
                        scale: [1, 1.25, 1],
                      }
                }
                transition={{ duration: 0.6 }}
                className="shrink-0"
              >
                <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F59E0B]" />
              </motion.div>
              <span className="font-display font-black text-xs sm:text-sm text-slate-950 whitespace-nowrap">
                <AnimatedRollingCounter value={profile.gold} /><span className="hidden sm:inline"> Gold</span>
              </span>
            </motion.div>

            {/* User Dropdown Menu */}
            <div className="relative pl-0.5 sm:pl-2 border-l-2 border-slate-200" ref={menuRef}>
              <motion.button
                type="button"
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : {
                        y: -2,
                        boxShadow: "3px 3px 0px 0px #020617",
                        transition: SPRING_CONFIGS.tactile,
                      }
                }
                whileTap={
                  shouldReduceMotion
                    ? undefined
                    : {
                        x: 2,
                        y: 2,
                        boxShadow: "1px 1px 0px 0px #020617",
                        transition: { duration: 0.05 },
                      }
                }
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1 sm:gap-2 p-1 sm:pl-1.5 sm:pr-2.5 sm:py-1 bg-white/85 backdrop-blur-sm hover:bg-[#FDF8EE] border-2 border-slate-950 rounded-full shadow-[1.5px_1.5px_0px_0px_#020617] sm:shadow-[2px_2px_0px_0px_#020617] transition-colors focus:outline-none cursor-pointer"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
                id="user-dropdown-btn"
              >
                <div className="w-7 h-7 rounded-full bg-[#E8FAF5] border-2 border-slate-950 flex items-center justify-center font-display font-black text-xs shrink-0 shadow-[1px_1px_0px_0px_#020617]">
                  {profile.avatar_class === "warrior" && "🥊"}
                  {profile.avatar_class === "mage" && "🧠"}
                  {profile.avatar_class === "rogue" && "⚡"}
                  {profile.avatar_class === "druid" && "🌿"}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="font-display font-black text-xs text-slate-950 leading-none">
                    {profile.full_name || profile.username}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 capitalize mt-0.5">
                    @{profile.username}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-700 transition-transform duration-200 ${
                    userMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </motion.button>

              {/* Dropdown Card */}
              <AnimatePresence>
                {userMenuOpen && (
                  <>
                    {/* Backdrop dismiss for mobile touch */}
                    <div
                      className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-[2px] sm:hidden"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      style={{ backgroundColor: "#ffffff" }}
                      className="absolute right-0 mt-2.5 w-60 max-w-[calc(100vw-2rem)] bg-white border-3 border-slate-950 rounded-3xl shadow-[5px_5px_0px_0px_#020617] py-2 z-50 overflow-hidden isolate"
                    >
                      {/* User Header summary inside menu */}
                      <div className="px-3.5 py-2.5 border-b-2 border-slate-100 bg-[#FDF8EE]">
                        <div className="font-display font-black text-xs text-slate-950 truncate">
                          {profile.full_name || profile.username}
                        </div>
                        <div className="text-[11px] font-bold text-slate-500">
                          @{profile.username} • Level {profile.level}
                        </div>
                      </div>

                      {/* Menu items */}
                      <div className="p-1.5 space-y-1">
                        {/* Option 1: My Profile */}
                        <Link
                          href="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-display font-black text-slate-800 hover:bg-[#FFEAEF] hover:text-[#FF6B8B] transition-colors group"
                        >
                          <div className="w-7 h-7 rounded-lg bg-[#FFEAEF] group-hover:bg-white border border-slate-950 flex items-center justify-center text-[#FF6B8B] shrink-0 shadow-[1px_1px_0px_0px_#020617]">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-slate-950 group-hover:text-[#FF6B8B]">My Profile</span>
                            <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-500 truncate">
                              Edit name, age &amp; origin
                            </span>
                          </div>
                        </Link>

                        {/* Option 2: Community */}
                        <Link
                          href="/community"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-display font-black text-slate-800 hover:bg-[#E8FAF5] hover:text-[#059669] transition-colors group"
                        >
                          <div className="w-7 h-7 rounded-lg bg-[#E8FAF5] group-hover:bg-white border border-slate-950 flex items-center justify-center text-[#06D6A0] shrink-0 shadow-[1px_1px_0px_0px_#020617]">
                            <Users className="w-3.5 h-3.5 text-[#059669]" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-slate-950 group-hover:text-[#059669]">Community</span>
                            <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-500 truncate">
                              Guild halls &amp; leaderboards
                            </span>
                          </div>
                        </Link>

                        {/* Option 3: General Settings */}
                        <Link
                          href="/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-display font-black text-slate-800 hover:bg-[#F0EBFF] hover:text-[#8B5CF6] transition-colors group"
                        >
                          <div className="w-7 h-7 rounded-lg bg-[#F0EBFF] group-hover:bg-white border border-slate-950 flex items-center justify-center text-[#8B5CF6] shrink-0 shadow-[1px_1px_0px_0px_#020617]">
                            <Settings className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-slate-950 group-hover:text-[#8B5CF6]">General Settings</span>
                            <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-500 truncate">
                              Audio FX &amp; app preferences
                            </span>
                          </div>
                        </Link>

                        <div className="border-t border-slate-100 my-1" />

                        {/* Sign Out */}
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            signOut();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-display font-black text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <div className="w-7 h-7 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                            <LogOut className="w-3.5 h-3.5" />
                          </div>
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </nav>
        </div>
      </motion.header>

      {/* Main Content Area: Responsive 30% / 70% Two-Column Layout */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 min-h-0 lg:overflow-hidden flex flex-col pt-20 sm:pt-24 lg:pt-0 pb-24 sm:pb-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:h-screen">
          {/* ============================================================ */}
          {/* LEFT 30% COLUMN: FIXED (UNAFFECTED BY SCROLLING)             */}
          {/* ============================================================ */}
          <aside className="w-full lg:w-[32%] xl:w-[30%] shrink-0 space-y-3.5 lg:pt-28 lg:pb-6 lg:h-auto custom-scrollbar-none pr-1.5 pb-2">
            {/* 1. Adventurer Profile, XP & Completion Card */}
            <motion.div
              initial={{ y: 22, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ ...SPRING_CONFIGS.tabletopDrop, delay: 0.15 }}
              className="bg-white border-3 border-slate-950 rounded-3xl p-4 sm:p-4.5 shadow-[5px_5px_0px_0px_#020617]"
            >
              {/* User Identity Header */}
              <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-100">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFD166] border-3 border-slate-950 flex items-center justify-center text-xl shadow-[2.5px_2.5px_0px_0px_#020617]">
                    {profile.avatar_class === "warrior" && "🥊"}
                    {profile.avatar_class === "mage" && "🧠"}
                    {profile.avatar_class === "rogue" && "⚡"}
                    {profile.avatar_class === "druid" && "🌿"}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-slate-950 text-white font-display font-black text-[9px] px-1.5 py-0.5 rounded-md border border-white">
                    LVL {profile.level}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h1 className="font-display font-black text-base sm:text-lg text-slate-950 truncate">
                      {profile.full_name || profile.username}
                    </h1>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    <span className="bg-[#FFEAEF] text-[#FF6B8B] text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-[#FF6B8B]">
                      Level {profile.level} Adventurer
                    </span>
                    {profile.country && (
                      <span className="bg-[#FDF8EE] text-slate-700 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-slate-950/20">
                        📍 {profile.country}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 truncate mt-0.5">
                    @{profile.username}
                  </p>
                </div>
              </div>

              {/* Progress Bars: Experience Points (XP) & Daily Completion */}
              <div className="pt-3 space-y-3">
                {/* XP Bar */}
                <div>
                  <div className="flex justify-between items-center text-xs font-display font-black mb-1">
                    <span className="text-slate-950 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                      <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
                      <span>Experience (XP)</span>
                    </span>
                    <span className="text-slate-950 font-black text-xs">
                      {profile.current_xp} / {nextLevelXp} ({xpPercentage}%)
                    </span>
                  </div>
                  <SpringProgressBar
                    percent={xpPercentage}
                    mode="liquid"
                    barColor="#10B981"
                    striped={true}
                    className="h-3.5 bg-[#FDF8EE] rounded-full border-2 border-slate-950 p-0.5 shadow-inner"
                  />
                  <p className="text-[10px] font-bold text-slate-400 mt-1">
                    {nextLevelXp - profile.current_xp} XP needed for Level {profile.level + 1}
                  </p>
                </div>

                {/* Daily Quest Completion Bar */}
                <div className="pt-2.5 border-t border-dashed border-slate-200">
                  <div className="flex justify-between items-center text-xs font-display font-black mb-1">
                    <span className="text-slate-700 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                      <span>Completion</span>
                    </span>
                    <span className="text-slate-800 font-bold text-xs">
                      {completedCount} / {totalCount} ({completionPercentage}%)
                    </span>
                  </div>
                  <SpringProgressBar
                    percent={completionPercentage}
                    mode="liquid"
                    barColor="#10B981"
                    className="h-3 bg-[#FDF8EE] rounded-full border-2 border-slate-950 p-0.5"
                  />
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mt-1">
                    <span>{activeCount} active remaining</span>
                    <span>{completedCount} finished today</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 2. Skillset Levels Card (Brawn, Intellect, Swiftness, Vitality) */}
            <motion.div
              initial={{ y: 22, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ ...SPRING_CONFIGS.tabletopDrop, delay: 0.25 }}
              className="bg-white border-3 border-slate-950 rounded-3xl p-3.5 sm:p-4 shadow-[5px_5px_0px_0px_#020617]"
            >
              <div className="flex items-center justify-between pb-2.5 border-b-2 border-slate-100 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-[#FFD166] border border-slate-950 flex items-center justify-center text-[11px] font-black shadow-[1px_1px_0px_0px_#020617]">
                    ⚡
                  </div>
                  <h3 className="font-display font-black text-xs sm:text-sm text-slate-950 uppercase tracking-wider">
                    Skillset Levels
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400">4 Attributes</span>
              </div>

              {/* 2x2 Attributes Grid */}
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                {/* BRAWN */}
                <div className="bg-[#FDF8EE] border-2 border-slate-950 rounded-xl p-2 sm:p-2.5 shadow-[2px_2px_0px_0px_#020617] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-lg">🥊</span>
                    <span className="bg-[#FFEAEF] text-[#FF6B8B] font-display font-black text-[9px] px-1.5 py-0.5 rounded-md border border-[#FF6B8B]">
                      LVL {brawnStat.level}
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <div className="font-display font-black text-xs text-slate-950">Brawn</div>
                    <div className="text-[8px] font-bold text-slate-400 truncate">Fitness &amp; Strength</div>
                    <SpringProgressBar
                      percent={brawnStat.percent}
                      mode="overshoot"
                      barColor="#FF6B8B"
                      className="h-2 bg-white rounded-full border border-slate-950 mt-1 p-[1px]"
                    />
                  </div>
                </div>

                {/* INTELLECT */}
                <div className="bg-[#FDF8EE] border-2 border-slate-950 rounded-xl p-2 sm:p-2.5 shadow-[2px_2px_0px_0px_#020617] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-lg">🧠</span>
                    <span className="bg-[#F0EBFF] text-[#8B5CF6] font-display font-black text-[9px] px-1.5 py-0.5 rounded-md border border-[#8B5CF6]">
                      LVL {intellectStat.level}
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <div className="font-display font-black text-xs text-slate-950">Intellect</div>
                    <div className="text-[8px] font-bold text-slate-400 truncate">Focus &amp; Learning</div>
                    <SpringProgressBar
                      percent={intellectStat.percent}
                      mode="overshoot"
                      barColor="#8B5CF6"
                      className="h-2 bg-white rounded-full border border-slate-950 mt-1 p-[1px]"
                    />
                  </div>
                </div>

                {/* SWIFTNESS */}
                <div className="bg-[#FDF8EE] border-2 border-slate-950 rounded-xl p-2 sm:p-2.5 shadow-[2px_2px_0px_0px_#020617] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-lg">⚡</span>
                    <span className="bg-[#E8FAF5] text-[#06D6A0] font-display font-black text-[9px] px-1.5 py-0.5 rounded-md border border-[#06D6A0]">
                      LVL {swiftnessStat.level}
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <div className="font-display font-black text-xs text-slate-950">Swiftness</div>
                    <div className="text-[8px] font-bold text-slate-400 truncate">Daily Execution</div>
                    <SpringProgressBar
                      percent={swiftnessStat.percent}
                      mode="overshoot"
                      barColor="#06D6A0"
                      className="h-2 bg-white rounded-full border border-slate-950 mt-1 p-[1px]"
                    />
                  </div>
                </div>

                {/* VITALITY */}
                <div className="bg-[#FDF8EE] border-2 border-slate-950 rounded-xl p-2 sm:p-2.5 shadow-[2px_2px_0px_0px_#020617] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-lg">🌿</span>
                    <span className="bg-[#FFF8E7] text-[#D97706] font-display font-black text-[9px] px-1.5 py-0.5 rounded-md border border-[#D97706]">
                      LVL {vitalityStat.level}
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <div className="font-display font-black text-xs text-slate-950">Vitality</div>
                    <div className="text-[8px] font-bold text-slate-400 truncate">Mind &amp; Recovery</div>
                    <SpringProgressBar
                      percent={vitalityStat.percent}
                      mode="overshoot"
                      barColor="#D97706"
                      className="h-2 bg-white rounded-full border border-slate-950 mt-1 p-[1px]"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </aside>

          {/* ============================================================ */}
          {/* RIGHT 70% COLUMN: THE ONLY SCROLLABLE SECTION                */}
          {/* ============================================================ */}
          <div
            className="w-full lg:w-[68%] xl:w-[70%] min-w-0 lg:h-screen lg:overflow-y-auto lg:pt-28 pb-20 gpu-scroll custom-scrollbar-none scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pr-1"
            id="quest-log-scroll-column"
          >
            <motion.div
              initial={{ y: 24, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ ...SPRING_CONFIGS.tabletopDrop, delay: 0.35 }}
              className="space-y-5 hardware-accelerated"
            >
            {/* Top Navigation & View Switcher Bar */}
            <div className="bg-white border-3 border-slate-950 rounded-3xl p-4 sm:p-5 shadow-[5px_5px_0px_0px_#020617] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display font-black text-xl sm:text-2xl text-slate-950">
                  {activeTab === "quests" ? "Quest Log" : "Armory & Rewards Vault"}
                </h2>
                <p className="text-xs font-bold text-slate-500 mt-0.5">
                  {activeTab === "quests"
                    ? `${activeCount} active quests remaining • ${completedCount} completed today`
                    : "Convert your hard-earned quest gold into real-life treats, perks, and badges"}
                </p>
              </div>

              {/* Tab Switcher */}
              <div className="flex items-center bg-[#FDF8EE] p-1.5 rounded-2xl border-2 border-slate-950 self-start sm:self-auto shrink-0 gap-1.5">
                <TactileTab
                  active={activeTab === "quests"}
                  onClick={() => setActiveTab("quests")}
                  activeClassName="bg-[#FF6B8B] text-white border-slate-950 shadow-[2px_2px_0px_0px_#020617]"
                  inactiveClassName="text-slate-600 hover:text-slate-950 border-transparent"
                >
                  <div className="flex items-center gap-1.5">
                    <Sword className="w-3.5 h-3.5" />
                    <span>Quests ({activeCount})</span>
                  </div>
                </TactileTab>
                <TactileTab
                  active={activeTab === "shop"}
                  onClick={() => setActiveTab("shop")}
                  activeClassName="bg-[#FFD166] text-slate-950 border-slate-950 shadow-[2px_2px_0px_0px_#020617]"
                  inactiveClassName="text-slate-600 hover:text-slate-950 border-transparent"
                >
                  <div className="flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Armory</span>
                  </div>
                </TactileTab>
              </div>
            </div>

            {/* Quests View Content */}
            {activeTab === "quests" ? (
              <section className="bg-white border-3 border-slate-950 rounded-3xl p-5 sm:p-6 shadow-[5px_5px_0px_0px_#020617] space-y-6">
                {/* Category Filter + Add Quest Button */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 border-b-2 border-slate-100">
                  <div className="flex items-center bg-[#FDF8EE] p-1 rounded-2xl border-2 border-slate-950 overflow-x-auto no-scrollbar scroll-smooth text-xs font-display font-black w-full sm:w-auto gap-1">
                    {(
                      [
                        { id: "ALL", label: "All" },
                        { id: "fitness", label: "🥊 Brawn" },
                        { id: "knowledge", label: "🧠 Intellect" },
                        { id: "habits", label: "⚡ Swift" },
                        { id: "wellness", label: "🌿 Vital" },
                      ] as const
                    ).map((cat) => (
                      <TactileTab
                        key={cat.id}
                        active={selectedCategory === cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        activeClassName="bg-[#FF6B8B] text-white border-slate-950 shadow-[1px_1px_0px_0px_#020617]"
                        inactiveClassName="text-slate-600 hover:text-slate-950 border-transparent hover:border-slate-300"
                        className="py-1 px-2.5 shrink-0 whitespace-nowrap"
                      >
                        {cat.label}
                      </TactileTab>
                    ))}
                  </div>

                  <TactileButton
                    onClick={() => {
                      setFormError(null);
                      setModalOpen(true);
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-[#FFD166] hover:bg-[#fcc849] text-slate-950 font-display font-black text-xs sm:text-sm rounded-2xl border-2 border-slate-950 shadow-[2px_2px_0px_0px_#020617] sm:shadow-[3px_3px_0px_0px_#020617] flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>New Quest</span>
                  </TactileButton>
                </div>

                {/* ============================================================ */}
                {/* 1. PRIORITY SECTION (ALWAYS ON TOP OF THE SCREEN)            */}
                {/* ============================================================ */}
                <div className="p-4 sm:p-5 rounded-3xl border-3 border-slate-950 bg-[#FFF7ED] shadow-[4px_4px_0px_0px_#020617]">
                  <div className="flex items-center justify-between pb-3 border-b-2 border-orange-200/80 mb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#FF5722] border-2 border-slate-950 flex items-center justify-center text-white shadow-[1.5px_1.5px_0px_0px_#020617]">
                        <Zap className="w-4 h-4 fill-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-black text-base sm:text-lg text-slate-950">
                            Priority Section
                          </h3>
                          <span className="bg-[#FF5722] text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-slate-950">
                            {priorityQuests.length} {priorityQuests.length === 1 ? "Quest" : "Quests"}
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-500">
                          High priority objectives pinned to the top of the screen
                        </p>
                      </div>
                    </div>
                  </div>

                  {priorityQuests.length === 0 ? (
                    <div className="py-4 px-3 text-center bg-white/60 rounded-2xl border border-dashed border-orange-200">
                      <p className="text-xs font-bold text-orange-950/60">
                        No urgent priority tasks. Toggle &apos;High Priority&apos; when creating a quest to pin it here!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <AnimatePresence mode="popLayout">
                        {priorityQuests.map((quest) => renderQuestCard(quest, true))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* ============================================================ */}
                {/* 2. RECURRING TASKS SECTION (REPEATS DAILY AFTER 00:00 IST)   */}
                {/* ============================================================ */}
                <div className="p-4 sm:p-5 rounded-3xl border-3 border-slate-950 bg-[#F0FDF4] shadow-[4px_4px_0px_0px_#020617]">
                  <div className="flex items-center justify-between pb-3 border-b-2 border-emerald-200 mb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#06D6A0] border-2 border-slate-950 flex items-center justify-center text-slate-950 shadow-[1.5px_1.5px_0px_0px_#020617]">
                        <RotateCcw className="w-4 h-4 stroke-[3]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-black text-base sm:text-lg text-slate-950">
                            Recurring Tasks
                          </h3>
                          <span className="bg-[#059669] text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-slate-950">
                            Resets 00:00 IST
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-500">
                          Daily rituals that automatically repeat every day after midnight Indian Time zone
                        </p>
                      </div>
                    </div>
                  </div>

                  {recurringQuests.length === 0 ? (
                    <div className="py-4 px-3 text-center bg-white/60 rounded-2xl border border-dashed border-emerald-200">
                      <p className="text-xs font-bold text-emerald-950/60">
                        No daily recurring tasks active. Toggle &apos;Recurring Task&apos; to build habits that repeat every day at 00:00 IST.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <AnimatePresence mode="popLayout">
                        {recurringQuests.map((quest) => renderQuestCard(quest, false))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* ============================================================ */}
                {/* 3. STANDARD ACTIVE QUESTS SECTION                            */}
                {/* ============================================================ */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs font-display font-black tracking-wider uppercase text-slate-400">
                      Standard Quests ({standardQuests.length})
                    </span>
                  </div>

                  {standardQuests.length === 0 && ongoingQuests.length === 0 ? (
                    <div className="text-center py-10 px-4 bg-[#FDF8EE] rounded-2xl border-2 border-dashed border-slate-300">
                      <div className="text-4xl mb-2">{completedCount > 0 ? "🎉" : "🛡️"}</div>
                      <h3 className="font-display font-black text-base sm:text-lg text-slate-800">
                        {completedCount > 0
                          ? "All Quests Conquered!"
                          : "No Quests in this Category"}
                      </h3>
                      <p className="text-xs font-bold text-slate-500 mt-1 max-w-sm mx-auto">
                        {completedCount > 0
                          ? "Legendary work! You've finished all your active quests. Create a new quest to continue your journey."
                          : "Take a well-deserved breather or forge a brand-new daily quest to gain more XP and Gold!"}
                      </p>
                      <button
                        onClick={() => {
                          setFormError(null);
                          setModalOpen(true);
                        }}
                        className="mt-4 px-4 py-2 bg-[#FF6B8B] text-white font-display font-black text-xs rounded-xl border-2 border-slate-950 shadow-[2px_2px_0px_0px_#020617] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
                      >
                        + New Quest
                      </button>
                    </div>
                  ) : standardQuests.length === 0 ? (
                    <div className="py-4 px-3 text-center bg-[#FDF8EE]/60 rounded-2xl border border-dashed border-slate-300">
                      <p className="text-xs font-bold text-slate-400">
                        No active standard quests. All ongoing tasks are organized in Priority or Recurring sections above!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <AnimatePresence mode="popLayout">
                        {standardQuests.map((quest) => renderQuestCard(quest, false))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* ============================================================ */}
                {/* 4. COMPLETED TASKS SECTION                                   */}
                {/* ============================================================ */}
                <div className="pt-6 border-t-2 border-slate-100">
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[#E8FAF5] border border-[#06D6A0] flex items-center justify-center text-[#06D6A0]">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <h3 className="font-display font-black text-base sm:text-lg text-slate-950 flex items-center gap-2">
                        Completed tasks
                        <span className="bg-[#E8FAF5] text-[#059669] border border-[#06D6A0] text-xs font-bold px-2 py-0.5 rounded-full">
                          {completedQuests.length}
                        </span>
                      </h3>
                    </div>

                    {completedQuests.length > 0 && (
                      <button
                        onClick={() => setShowCompleted(!showCompleted)}
                        className="flex items-center gap-1.5 text-xs font-display font-bold text-slate-600 hover:text-slate-950 bg-[#FDF8EE] hover:bg-amber-100 border border-slate-950 px-2.5 py-1 rounded-xl shadow-[1px_1px_0px_0px_#020617] active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all cursor-pointer"
                      >
                        <span>{showCompleted ? "Hide" : "Show"}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            showCompleted ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  {completedQuests.length === 0 ? (
                    <div className="py-6 px-4 text-center bg-[#FDF8EE]/60 rounded-2xl border border-dashed border-slate-300">
                      <p className="text-xs font-bold text-slate-400">
                        No completed tasks yet. Finish an active quest above to earn XP &amp; Gold and see it archived here!
                      </p>
                    </div>
                  ) : (
                    showCompleted && (
                      <div className="space-y-2.5">
                        <AnimatePresence mode="popLayout">
                          {completedQuests.map((quest) => {
                            const cfg = ATTRIBUTE_CONFIG[quest.attribute];
                            return (
                              <motion.div
                                key={quest.id}
                                layout="position"
                                style={{
                                  transform: "translate3d(0, 0, 0)",
                                  WebkitBackfaceVisibility: "hidden",
                                  backfaceVisibility: "hidden",
                                  willChange: "transform, opacity",
                                }}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{
                                  opacity: 0,
                                  scale: 0.95,
                                  height: 0,
                                  marginBottom: 0,
                                  paddingTop: 0,
                                  paddingBottom: 0,
                                  overflow: "hidden",
                                  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
                                }}
                                className="p-3 sm:p-3.5 rounded-2xl border-2 border-slate-200 bg-slate-50/90 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                              >
                                {/* Left: Revert checkbox + Title */}
                                <div className="flex items-center gap-3 min-w-0">
                                  <TactileCheckbox
                                    completed={true}
                                    onClick={() => handleToggle(quest.id)}
                                    size="sm"
                                  />

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span
                                        className={`text-[9px] font-display font-black px-1.5 py-0.5 rounded border flex items-center gap-1 ${cfg.bg} ${cfg.border} text-slate-700 opacity-80`}
                                      >
                                        <span>{cfg.icon}</span>
                                        <span>{quest.attribute}</span>
                                      </span>
                                      <span className="text-[10px] font-bold text-[#059669] flex items-center gap-0.5">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Completed
                                      </span>
                                      {quest.is_priority && (
                                        <span className="text-[9px] font-display font-black px-1.5 py-0.5 rounded border bg-[#FFEAEF] text-[#FF5722] border-[#FF5722]/50 flex items-center gap-0.5">
                                          <Zap className="w-2.5 h-2.5 fill-[#FF5722]" />
                                          <span>Priority</span>
                                        </span>
                                      )}
                                      {quest.is_recurring && (
                                        <span className="text-[9px] font-display font-black px-1.5 py-0.5 rounded border bg-[#F0FDF4] text-[#059669] border-[#06D6A0]/50 flex items-center gap-0.5">
                                          <RotateCcw className="w-2.5 h-2.5" />
                                          <span>00:00 IST</span>
                                        </span>
                                      )}
                                    </div>
                                    <div className="font-display font-medium text-xs sm:text-sm text-slate-400 line-through truncate mt-0.5">
                                      {quest.title}
                                    </div>
                                  </div>
                                </div>

                                {/* Right: Reward earned tags + delete */}
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="hidden sm:inline-flex items-center gap-1 bg-[#E8FAF5] text-[#059669] text-[11px] font-display font-bold px-2 py-0.5 rounded-lg border border-[#06D6A0]/40">
                                    +{quest.xp_reward} XP
                                  </span>
                                  <span className="hidden sm:inline-flex items-center gap-1 bg-[#FFF9DB] text-[#B45309] text-[11px] font-display font-bold px-2 py-0.5 rounded-lg border border-[#F59E0B]/40">
                                    +{quest.gold_reward} Gold
                                  </span>

                                  <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.15, rotate: -6 }}
                                    whileTap={{ scale: 0.85 }}
                                    onClick={() => deleteQuest(quest.id)}
                                    className="p-1.5 text-slate-300 hover:text-[#FF6B8B] hover:bg-[#FFEAEF] rounded-lg border border-transparent hover:border-[#FF6B8B] transition-colors cursor-pointer"
                                    title="Delete Quest"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </motion.button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    )
                  )}
                </div>
              </section>
            ) : (
              /* ============================================================ */
              /* ARMORY & REWARDS VAULT                                       */
              /* ============================================================ */
              <section className="bg-white border-3 border-slate-950 rounded-3xl p-5 sm:p-6 shadow-[5px_5px_0px_0px_#020617]">
                <div className="pb-4 border-b-2 border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="font-display font-black text-xl sm:text-2xl text-slate-950">
                      Armory &amp; Rewards Vault
                    </h2>
                    <p className="text-xs font-bold text-slate-500 mt-0.5">
                      Convert your hard-earned quest gold into real-life treats, perks, and badges.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#FFF9DB] text-[#B45309] px-3 py-1.5 rounded-2xl border-2 border-slate-950 shadow-[2px_2px_0px_0px_#020617]">
                    <Coins className="w-4 h-4" />
                    <span className="font-display font-black text-sm text-slate-950">
                      <AnimatedRollingCounter value={profile.gold} /> Gold
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                  {SHOP_REWARDS.map((reward) => {
                    const isOwned = unlockedRewards.includes(reward.id);
                    const canAfford = profile.gold >= reward.cost;

                    return (
                      <div
                        key={reward.id}
                        className="bg-[#FDF8EE] border-2 border-slate-950 rounded-2xl p-4 shadow-[3px_3px_0px_0px_#020617] flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-3xl">{reward.icon}</span>
                            <span className="font-display font-black text-xs px-2.5 py-1 bg-white border-2 border-slate-950 rounded-xl shadow-[1px_1px_0px_0px_#020617]">
                              🪙 {reward.cost} Gold
                            </span>
                          </div>
                          <h3 className="font-display font-black text-base text-slate-950">
                            {reward.title}
                          </h3>
                          <p className="text-xs font-semibold text-slate-600 mt-1">
                            {reward.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200">
                          {isOwned ? (
                            <div className="w-full py-2 bg-[#E8FAF5] text-[#065f46] font-display font-black text-xs rounded-xl border border-[#06D6A0] flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-[#06D6A0]" />
                              <span>Claimed / In Inventory</span>
                            </div>
                          ) : (
                            <TactileButton
                              onClick={() => purchaseReward(reward)}
                              disabled={!canAfford}
                              shadowSize="sm"
                              className={`w-full py-2 font-display font-black text-xs rounded-xl border-2 border-slate-950 ${
                                canAfford
                                  ? "bg-[#FFD166] hover:bg-[#fcc849] text-slate-950"
                                  : "bg-slate-200 text-slate-400 cursor-not-allowed border-slate-300"
                              }`}
                            >
                              {canAfford ? `Unlock for ${reward.cost} Gold` : "Need More Gold"}
                            </TactileButton>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
            </motion.div>
          </div>
        </div>
      </main>

      {/* ============================================================ */}
      {/* 6. MODAL: CREATE NEW QUEST                                   */}
      {/* ============================================================ */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border-3 border-slate-950 rounded-3xl p-6 max-w-md w-full shadow-[8px_8px_0px_0px_#020617] relative"
            >
              <div className="flex items-center justify-between pb-4 border-b-2 border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#FF6B8B] border-2 border-slate-950 flex items-center justify-center text-white">
                    <Plus className="w-4 h-4" />
                  </div>
                  <h3 className="font-display font-black text-xl text-slate-950">
                    {modalMode === "manual" ? "Forge New Quest" : "AI Dungeon Master"}
                  </h3>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded-xl hover:bg-[#FDF8EE] border-2 border-transparent hover:border-slate-950 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mode Switcher: Manual vs AI Dungeon Master */}
              <div className="flex bg-[#FDF8EE] p-1 rounded-2xl border-2 border-slate-950 mt-3.5 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setModalMode("manual");
                    setFormError(null);
                  }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-display font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    modalMode === "manual"
                      ? "bg-white border-2 border-slate-950 shadow-[1px_1px_0px_0px_#020617] text-slate-950"
                      : "text-slate-500 hover:text-slate-900 border-2 border-transparent"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Manual Quest</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalMode("ai");
                    setFormError(null);
                  }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-display font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    modalMode === "ai"
                      ? "bg-[#FFD166] border-2 border-slate-950 shadow-[1px_1px_0px_0px_#020617] text-slate-950"
                      : "text-slate-500 hover:text-slate-900 border-2 border-transparent"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#FF6B8B]" />
                  <span>AI Quest Master</span>
                </button>
              </div>

              {formError && (
                <div className="mt-3 p-3 bg-[#FFEAEF] border-2 border-[#FF6B8B] rounded-2xl flex items-center gap-2 text-xs font-bold text-[#b82143]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {modalMode === "manual" ? (
                <form onSubmit={handleCreateQuest} className="mt-4 space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-display font-black text-slate-800 uppercase tracking-wider mb-1">
                      Quest Description
                    </label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Read 20 pages of clean architecture"
                      className="w-full px-4 py-2.5 bg-[#FDF8EE] border-2 border-slate-950 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B8B]"
                    />
                  </div>

                  {/* Attribute / Category */}
                  <div>
                    <label className="block text-xs font-display font-black text-slate-800 uppercase tracking-wider mb-1">
                      Character Attribute
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          { id: "fitness", label: "🥊 Brawn", sub: "Strength" },
                          { id: "knowledge", label: "🧠 Intellect", sub: "Focus" },
                          { id: "habits", label: "⚡ Swiftness", sub: "Discipline" },
                          { id: "wellness", label: "🌿 Vitality", sub: "Recovery" },
                        ] as const
                      ).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setNewCategory(item.id)}
                          className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                            newCategory === item.id
                              ? "bg-[#FEF3C7] border-slate-950 shadow-[2px_2px_0px_0px_#020617] translate-x-[1px] translate-y-[1px]"
                              : "bg-white border-slate-200 hover:border-slate-400"
                          }`}
                        >
                          <div className="font-display font-black text-xs text-slate-950">
                            {item.label}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400">
                            {item.sub}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="block text-xs font-display font-black text-slate-800 uppercase tracking-wider mb-1">
                      Difficulty &amp; Rewards
                    </label>
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      {(
                        [
                          { id: "easy", label: "Easy", xp: "+20XP" },
                          { id: "medium", label: "Med", xp: "+40XP" },
                          { id: "hard", label: "Hard", xp: "+75XP" },
                          { id: "epic", label: "Epic", xp: "+150XP" },
                        ] as const
                      ).map((diff) => (
                        <button
                          key={diff.id}
                          type="button"
                          onClick={() => setNewDifficulty(diff.id)}
                          className={`p-2 rounded-xl border-2 transition-all ${
                            newDifficulty === diff.id
                              ? "bg-[#FF6B8B] text-white border-slate-950 shadow-[2px_2px_0px_0px_#020617] translate-x-[1px] translate-y-[1px]"
                              : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                          }`}
                        >
                          <div className="font-display font-black text-xs">{diff.label}</div>
                          <div
                            className={`text-[9px] font-extrabold ${
                              newDifficulty === diff.id ? "text-white/90" : "text-slate-400"
                            }`}
                          >
                            {diff.xp}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recurring Task & Priority Task Toggles */}
                  <div className="space-y-2.5 pt-1">
                    {/* Recurring Task Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-2xl border-2 border-slate-950 bg-[#F0FDF4] shadow-[2px_2px_0px_0px_#020617]">
                      <div className="pr-2">
                        <div className="flex items-center gap-1.5 font-display font-black text-xs text-slate-950">
                          <span className="text-sm">🔄</span>
                          <span>Recurring Task</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                          Repeats every day after 00:00 Indian Time zone (IST)
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={newIsRecurring}
                        onClick={() => setNewIsRecurring(!newIsRecurring)}
                        id="toggle-recurring-task"
                        className={`w-12 h-7 rounded-full border-2 border-slate-950 p-0.5 transition-colors relative shrink-0 cursor-pointer ${
                          newIsRecurring ? "bg-[#06D6A0]" : "bg-slate-200"
                        }`}
                      >
                        <motion.div
                          layout
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className={`w-5 h-5 rounded-full bg-white border border-slate-950 shadow-[1px_1px_0px_0px_#020617] transform ${
                            newIsRecurring ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Priority Task Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-2xl border-2 border-slate-950 bg-[#FFF7ED] shadow-[2px_2px_0px_0px_#020617]">
                      <div className="pr-2">
                        <div className="flex items-center gap-1.5 font-display font-black text-xs text-[#C2410C]">
                          <span className="text-sm">⚡</span>
                          <span>High Priority</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                          Forces task to appear in the Priority section on top
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={newIsPriority}
                        onClick={() => setNewIsPriority(!newIsPriority)}
                        id="toggle-priority-task"
                        className={`w-12 h-7 rounded-full border-2 border-slate-950 p-0.5 transition-colors relative shrink-0 cursor-pointer ${
                          newIsPriority ? "bg-[#FF5722]" : "bg-slate-200"
                        }`}
                      >
                        <motion.div
                          layout
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className={`w-5 h-5 rounded-full bg-white border border-slate-950 shadow-[1px_1px_0px_0px_#020617] transform ${
                            newIsPriority ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="pt-2 flex gap-2">
                    <TactileButton
                      type="button"
                      onClick={() => setModalOpen(false)}
                      shadowSize="sm"
                      className="w-1/3 py-2.5 bg-white border-2 border-slate-950 font-display font-bold text-xs rounded-2xl"
                    >
                      Cancel
                    </TactileButton>
                    <TactileButton
                      type="submit"
                      disabled={creating}
                      shadowSize="md"
                      className="w-2/3 py-2.5 bg-[#FF6B8B] hover:bg-[#ff5779] text-white font-display font-black text-sm rounded-2xl border-2 border-slate-950"
                    >
                      {creating ? "Forging..." : "Add to Quest Log"}
                    </TactileButton>
                  </div>
                </form>
              ) : (
                /* AI Dungeon Master Mode */
                <div className="mt-4 space-y-4">
                  {!generatedQuestline ? (
                    <form onSubmit={handleGenerateAI} className="space-y-4">
                      <div>
                        <label className="block text-xs font-display font-black text-slate-800 uppercase tracking-wider mb-1">
                          Real-Life Goal or Habit to Gamify
                        </label>
                        <textarea
                          required
                          rows={3}
                          value={aiGoal}
                          onChange={(e) => setAiGoal(e.target.value)}
                          placeholder="e.g. Train for a 5km marathon, learn Python web scraping, read 1 book per week"
                          className="w-full p-3 bg-[#FDF8EE] border-2 border-slate-950 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B8B] resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-display font-black text-slate-800 uppercase tracking-wider mb-1">
                          Campaign Duration
                        </label>
                        <div className="grid grid-cols-4 gap-1.5 text-center">
                          {[3, 5, 7, 14].map((days) => (
                            <button
                              key={days}
                              type="button"
                              onClick={() => setAiDuration(days)}
                              className={`py-2 px-1 rounded-xl border-2 transition-all font-display font-black text-xs ${
                                aiDuration === days
                                  ? "bg-[#FFD166] text-slate-950 border-slate-950 shadow-[2px_2px_0px_0px_#020617]"
                                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                              }`}
                            >
                              {days} Days
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-3 bg-[#FFF9DB] border-2 border-slate-950 rounded-2xl text-[11px] font-bold text-amber-900 flex items-start gap-2 shadow-[2px_2px_0px_0px_#020617]">
                        <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                          Powered by our FastAPI Game Engine. Transforms your goal into progressive daily milestones with tailored lore and balanced attribute rewards!
                        </span>
                      </div>

                      <div className="pt-2 flex gap-2">
                        <TactileButton
                          type="button"
                          onClick={() => setModalOpen(false)}
                          shadowSize="sm"
                          className="w-1/3 py-2.5 bg-white border-2 border-slate-950 font-display font-bold text-xs rounded-2xl"
                        >
                          Cancel
                        </TactileButton>
                        <TactileButton
                          type="submit"
                          disabled={aiGenerating}
                          shadowSize="md"
                          className="w-2/3 py-2.5 bg-[#06D6A0] hover:bg-[#05b88a] text-slate-950 font-display font-black text-xs sm:text-sm rounded-2xl border-2 border-slate-950 flex items-center justify-center gap-1.5"
                        >
                          <Wand2 className="w-4 h-4" />
                          <span>{aiGenerating ? "Generating..." : "Generate AI Questline"}</span>
                        </TactileButton>
                      </div>
                    </form>
                  ) : (
                    /* AI Questline Generated Preview */
                    <div className="space-y-3.5">
                      <div className="p-3 bg-[#E8FAF5] border-2 border-slate-950 rounded-2xl shadow-[2px_2px_0px_0px_#020617]">
                        <div className="flex items-center justify-between pb-1 border-b border-emerald-200">
                          <span className="font-display font-black text-xs text-emerald-950">
                            {generatedQuestline.questline_title}
                          </span>
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full border border-emerald-400">
                            +{generatedQuestline.total_estimated_xp} XP • {generatedQuestline.total_estimated_gold} Gold
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-emerald-800 mt-1 italic">
                          &ldquo;{generatedQuestline.lore_brief}&rdquo;
                        </p>
                      </div>

                      {/* Scrollable list of quests */}
                      <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {generatedQuestline.quests.map((q) => (
                          <div
                            key={q.day}
                            className="p-2 bg-white border-2 border-slate-950 rounded-xl flex items-center justify-between gap-2 text-left text-xs shadow-[1px_1px_0px_0px_#020617]"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-display font-black text-slate-950 truncate">
                                Day {q.day}: {q.title}
                              </div>
                              <div className="text-[9px] font-bold text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <span className="capitalize">{q.attribute}</span> •
                                <span className="capitalize">{q.difficulty}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-display font-black text-[10px] text-[#FF6B8B]">
                                +{q.xp_reward}XP
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 flex gap-2">
                        <TactileButton
                          type="button"
                          onClick={() => setGeneratedQuestline(null)}
                          shadowSize="sm"
                          className="w-1/3 py-2.5 bg-white border-2 border-slate-950 font-display font-bold text-xs rounded-2xl"
                        >
                          Regenerate
                        </TactileButton>
                        <TactileButton
                          type="button"
                          onClick={handleEnrollAI}
                          disabled={enrollingAi}
                          shadowSize="md"
                          className="w-2/3 py-2.5 bg-[#FF6B8B] hover:bg-[#ff5779] text-white font-display font-black text-xs sm:text-sm rounded-2xl border-2 border-slate-950 flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="w-4 h-4 fill-white" />
                          <span>{enrollingAi ? "Forging..." : "Forge into Quest Log"}</span>
                        </TactileButton>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* 7. CELEBRATORY LEVEL UP MODAL                                */}
      {/* ============================================================ */}
      <AnimatePresence>
        {levelUpInfo.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={SPRING_CONFIGS.tabletopDrop}
              className="bg-white border-4 border-slate-950 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-[10px_10px_0px_0px_#020617] text-center relative overflow-hidden"
            >
              {/* Chubby Badge Stamp Slamming Down */}
              <motion.div
                initial={{ scale: 2.4, opacity: 0, rotate: -15 }}
                animate={{
                  scale: [2.4, 0.88, 1.08, 1],
                  opacity: 1,
                  rotate: [-15, 5, -2, 0],
                }}
                transition={{
                  duration: 0.75,
                  times: [0, 0.5, 0.75, 1],
                  ease: "easeOut",
                  delay: 0.1,
                }}
                className="w-22 h-22 mx-auto rounded-3xl bg-[#FFD166] border-4 border-slate-950 flex items-center justify-center text-5xl shadow-[5px_5px_0px_0px_#020617] mb-4 select-none"
              >
                👑
              </motion.div>

              {/* Rubber-band "LEVEL UP!" banner */}
              <motion.h2
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{
                  scale: [0.5, 1.25, 0.9, 1.06, 1],
                  opacity: 1,
                }}
                transition={{
                  duration: 0.7,
                  times: [0, 0.35, 0.6, 0.8, 1],
                  delay: 0.25,
                }}
                className="font-display font-black text-3xl sm:text-4xl text-slate-950 tracking-tight"
              >
                LEVEL UP!
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="inline-block bg-[#FFEAEF] text-[#FF6B8B] font-display font-black text-sm px-3.5 py-1 rounded-full border-2 border-[#FF6B8B] my-2 shadow-[1.5px_1.5px_0px_0px_#FF6B8B]"
              >
                Level {levelUpInfo.level} Reached
              </motion.div>

              <p className="text-xs font-bold text-slate-600 mt-2">
                Your discipline and perseverance have unlocked new heights! Bonus Gold has been
                added to your pouch.
              </p>

              <TactileButton
                onClick={() => setLevelUpInfo({ open: false, level: 1 })}
                shadowSize="lg"
                className="mt-6 w-full py-3 bg-[#FF6B8B] hover:bg-[#ff5779] text-white font-display font-black text-sm rounded-2xl border-3 border-slate-950"
              >
                Claim Glory &amp; Continue
              </TactileButton>
            </motion.div>
          </div>
        )}

        {/* Streak Details & Rules Modal */}
        {streakModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border-4 border-slate-950 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-[10px_10px_0px_0px_#020617] relative"
            >
              <button
                type="button"
                onClick={() => setStreakModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-slate-100 border-2 border-slate-950 shadow-[1px_1px_0px_0px_#020617] transition-all text-slate-500 hover:text-slate-950"
                aria-label="Close Streak Modal"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div
                  className={`w-12 h-12 rounded-2xl border-2 border-slate-950 flex items-center justify-center shadow-[2px_2px_0px_0px_#020617] shrink-0 ${
                    profile.streak_days > 0 ? "bg-[#FFF0E6] text-[#FF5722]" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <Flame className={`w-7 h-7 ${profile.streak_days > 0 ? "fill-[#FF5722]" : ""}`} />
                </div>
                <div>
                  <h3 className="font-display font-black text-xl text-slate-950">
                    {profile.streak_days} Day Streak
                  </h3>
                  <p className="text-xs font-bold text-slate-500">
                    {profile.streak_days > 0
                      ? "🔥 Streak active! Keep the fire burning."
                      : "💤 Unlit streak. Complete 1 quest to ignite!"}
                  </p>
                </div>
              </div>

              <div className="space-y-3 bg-[#FDF8EE] border-2 border-slate-950 rounded-2xl p-4 text-xs font-bold text-slate-700 mb-5">
                <div className="flex items-start gap-2.5">
                  <span className="text-base">🎯</span>
                  <div>
                    <span className="font-black text-slate-950 block">Complete 1 Quest Daily</span>
                    When you log in and complete at least one task for the day, your streak increases by +1 day.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-base">⏰</span>
                  <div>
                    <span className="font-black text-slate-950 block">Midnight Reset (00:00)</span>
                    Daily streaks reset back to 0 at 00:00 midnight if no quest was completed that day.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-base">🛡️</span>
                  <div>
                    <span className="font-black text-slate-950 block">Zero Placeholders</span>
                    Streaks strictly reflect verified quest completions. No fake or hardcoded numbers.
                  </div>
                </div>
              </div>

              <TactileButton
                type="button"
                onClick={() => setStreakModalOpen(false)}
                className="w-full py-3 bg-[#FFD166] text-slate-950 font-display font-black text-sm rounded-2xl border-3 border-slate-950 hover:bg-amber-300"
              >
                Got It, Let&apos;s Quest!
              </TactileButton>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Floating Bottom Dock (sm:hidden) */}
      <motion.nav
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...SPRING_CONFIGS.tabletopDrop, delay: 0.15 }}
        className="fixed bottom-3 left-3 right-3 z-40 sm:hidden pointer-events-none"
        aria-label="Mobile Navigation Dock"
      >
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md border-3 border-slate-950 rounded-2xl px-2 py-1.5 shadow-[4px_4px_0px_0px_#020617] flex items-center justify-around gap-1 hardware-accelerated">
          {/* Quests Tab */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("quests");
              window.scrollTo({ top: 380, behavior: "smooth" });
            }}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "quests"
                ? "bg-[#FFEAEF] text-[#FF6B8B] font-black border-2 border-slate-950 shadow-[1px_1px_0px_0px_#020617]"
                : "text-slate-500 hover:text-slate-800 font-bold border-2 border-transparent"
            }`}
          >
            <Sword className="w-4 h-4" />
            <span className="text-[10px] font-display mt-0.5">Quests</span>
          </button>

          {/* Armory Tab */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("shop");
              window.scrollTo({ top: 380, behavior: "smooth" });
            }}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "shop"
                ? "bg-[#FFF9DB] text-[#B45309] font-black border-2 border-slate-950 shadow-[1px_1px_0px_0px_#020617]"
                : "text-slate-500 hover:text-slate-800 font-bold border-2 border-transparent"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="text-[10px] font-display mt-0.5">Armory</span>
          </button>

          {/* Quick New Quest Button (Center Prominent) */}
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setModalOpen(true);
            }}
            className="flex items-center justify-center w-11 h-11 -mt-4 bg-[#FFD166] text-slate-950 rounded-2xl border-3 border-slate-950 shadow-[2.5px_2.5px_0px_0px_#020617] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#020617] transition-transform cursor-pointer"
            title="Create New Quest"
            aria-label="Create New Quest"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>

          {/* Guild / Community */}
          <Link
            href="/community"
            className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-500 hover:text-slate-800 font-bold border-2 border-transparent hover:bg-[#E8FAF5] transition-all"
          >
            <Users className="w-4 h-4" />
            <span className="text-[10px] font-display mt-0.5">Guild</span>
          </Link>

          {/* Profile */}
          <Link
            href="/profile"
            className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-500 hover:text-slate-800 font-bold border-2 border-transparent hover:bg-[#FDF8EE] transition-all"
          >
            <User className="w-4 h-4" />
            <span className="text-[10px] font-display mt-0.5">Profile</span>
          </Link>
        </div>
      </motion.nav>
    </div>
  );
}
