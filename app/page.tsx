"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sword,
  Shield,
  Sparkles,
  Trophy,
  Zap,
  Brain,
  Dumbbell,
  Coins,
  CheckCircle2,
  Flame,
  ArrowRight,
  Play,
  Star,
  Coffee,
  Gamepad2,
  ChevronDown,
  Menu,
  X,
  Heart,
  Crown,
  ScrollText,
  Gift,
  Check,
  Smartphone,
  Laptop,
  Lock,
  Users,
  BarChart3,
  Layers,
  ArrowUpRight,
  HelpCircle,
} from "lucide-react";

// Feature habit demo categories for interactive marketing preview
const SYSTEM_CATEGORIES = [
  {
    id: "fitness",
    name: "Health & Fitness",
    icon: "🥊",
    attribute: "BRAWN",
    color: "bg-[#FFEAEF] text-[#FF6B8B] border-[#FF6B8B]",
    badgeBg: "bg-[#FF6B8B] text-white",
    baseXP: 30,
    statGain: "+3 STR",
    coinYield: "25 Coins",
    description: "Converts gym sessions, hydration, sleep, and nutrition into strength attributes.",
    sampleTasks: ["30-min Weight Training", "Drink 2.5L Water Daily", "Hit 10,000 Steps"],
  },
  {
    id: "knowledge",
    name: "Focus & Intellect",
    icon: "🧠",
    attribute: "INTELLECT",
    color: "bg-[#F0EBFF] text-[#8B5CF6] border-[#8B5CF6]",
    badgeBg: "bg-[#8B5CF6] text-white",
    baseXP: 35,
    statGain: "+4 INT",
    coinYield: "30 Coins",
    description: "Transforms reading, deep work sprints, coding, and homework into mana and mental agility.",
    sampleTasks: ["45-min Deep Work Sprint", "Read 20 Book Pages", "Complete Coding Practice"],
  },
  {
    id: "habits",
    name: "Daily Execution",
    icon: "⚡",
    attribute: "SWIFTNESS",
    color: "bg-[#E8FAF5] text-[#06D6A0] border-[#06D6A0]",
    badgeBg: "bg-[#06D6A0] text-slate-950",
    baseXP: 25,
    statGain: "+3 AGI",
    coinYield: "20 Coins",
    description: "Eliminates backlog chores, emails, tidying, and maintenance tasks with momentum bonuses.",
    sampleTasks: ["Inbox Zero Protocol", "Desk & Room Reset", "Process Unopened Mail"],
  },
  {
    id: "wellness",
    name: "Mind & Recovery",
    icon: "🌿",
    attribute: "VITALITY",
    color: "bg-[#FFF8E7] text-[#D97706] border-[#D97706]",
    badgeBg: "bg-[#FFD166] text-slate-950",
    baseXP: 20,
    statGain: "+2 VIT",
    coinYield: "15 Coins",
    description: "Restores character HP through meditation, screen-free evenings, and mindfulness habits.",
    sampleTasks: ["10-min Mindful Meditation", "No Screens After 10 PM", "Sunlight Morning Walk"],
  },
];

const FAQS = [
  {
    q: "How does LifeRPG differ from standard to-do list applications?",
    a: "Traditional to-do apps rely on guilt and negative reinforcement when tasks roll over. LifeRPG employs scientifically proven behavioral gamification: every completed action awards attribute XP, virtual currency, and streak multipliers. By turning mundane chores into a tangible RPG progression loop, friction and avoidance are replaced by motivation.",
  },
  {
    q: "Is LifeRPG really 100% free of cost?",
    a: "Yes, completely! LifeRPG is 100% free of cost for everyone. There are no paid plans, no premium tiers, no hidden subscriptions, no in-app purchases, and no advertisements. Every feature—including unlimited bounties, multiplayer party quests, custom loot rewards, stat progression, and cross-platform cloud sync—is completely unlocked for all adventurers.",
  },
  {
    q: "Can I customize my own rewards and task values?",
    a: "Absolutely. The Custom Loot Shop allows you to define your own real-world self-rewards (such as a favorite coffee, an hour of gaming, or a movie night) and set the exact gold cost required to unlock them guilt-free.",
  },
  {
    q: "Does LifeRPG support team or family accountability?",
    a: "Yes. Our Party & Guild feature enables you to embark on co-op quests with friends, family, or colleagues. Party members hold each other accountable, battle communal procrastination bosses, and celebrate milestone achievements together.",
  },
  {
    q: "What platforms is LifeRPG available on?",
    a: "LifeRPG is accessible across modern web browsers, iOS, Android, and desktop devices with real-time cloud synchronization. Your character progression, bounties, and streak status stay seamlessly updated across all devices.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const activeCategory = SYSTEM_CATEGORIES[activeCategoryIndex];

  const handleOpenAuth = (mode: "login" | "signup") => {
    router.push(`/login?mode=${mode}`);
  };

  return (
    <div className="min-h-screen bg-[#FDF8EE] text-slate-900 selection:bg-[#FFD166] selection:text-slate-950 relative overflow-x-hidden font-sans">
      {/* Skip to Main Content for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#FFD166] focus:text-slate-950 focus:font-black focus:rounded-xl focus:border-3 focus:border-slate-950 focus:shadow-[3px_3px_0px_0px_#020617] focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Subtle Comic Dot Texture */}
      <div className="pointer-events-none fixed inset-0 comic-dots z-0" aria-hidden="true" />

      {/* ============================================================ */}
      {/* 1. PLAYFUL COMIC NAVBAR WITH LOGIN / SIGNUP BUTTONS          */}
      {/* ============================================================ */}
      <header className="sticky top-3 sm:top-4 z-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pointer-events-none">
        <div className="relative pointer-events-auto">
          {/* Glassmorphism precursor: starts 20px (-bottom-5 = 20px) before body content scrolls behind the navbar */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-2 -top-2 -bottom-5 rounded-full backdrop-blur-[6px] [mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)] -z-10"
          />

          <nav
            aria-label="Main Navigation"
            className="bg-white/70 backdrop-blur-xl border-3 border-slate-950 rounded-full px-3 sm:px-6 py-2 sm:py-3 shadow-[3px_3px_0px_0px_#020617] sm:shadow-[4px_4px_0px_0px_#020617] ring-1 ring-white/80 flex items-center justify-between transition-all"
          >
          {/* Brand Logo */}
          <Link
            href="/"
            aria-label="LifeRPG Home"
            className="flex items-center gap-2 group focus:outline-none focus:ring-2 focus:ring-[#FF6B8B] rounded-full p-0.5 sm:p-1"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FF6B8B] border-2 sm:border-3 border-slate-950 flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_#020617] sm:shadow-[2px_2px_0px_0px_#020617] group-hover:rotate-6 transition-transform shrink-0">
              <Sword className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.5]" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-display font-black text-lg sm:text-2xl tracking-tight text-slate-950">
                  Life<span className="text-[#FF6B8B]">RPG</span>
                </span>
                <span className="bg-[#FFD166] text-slate-950 text-[9px] sm:text-[10px] font-black uppercase px-1.5 sm:px-2 py-0.5 rounded-full border-2 border-slate-950 shadow-[1px_1px_0px_0px_#020617]">
                  Official
                </span>
              </div>
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider hidden sm:block">
                Gamified Habit &amp; Goal Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {[
              { label: "Features", href: "#features" },
              { label: "Architecture", href: "#architecture" },
              { label: "100% Free", href: "#free-forever" },
              { label: "FAQ", href: "#faq" },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-3.5 py-1.5 font-display font-bold text-sm text-slate-700 hover:text-slate-950 hover:bg-[#FDF8EE] rounded-full border-2 border-transparent hover:border-slate-950 transition-all hover:shadow-[2px_2px_0px_0px_#020617]"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Dedicated Login and Signup Buttons or Dashboard if logged in */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {user ? (
              <Link
                href="/dashboard"
                className="relative inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-1.5 sm:py-2 bg-[#06D6A0] hover:bg-[#05b88a] text-slate-950 font-display font-black text-xs sm:text-sm rounded-full border-2 sm:border-3 border-slate-950 shadow-[2px_2px_0px_0px_#020617] sm:shadow-[3px_3px_0px_0px_#020617] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#020617] transition-all cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                <span className="hidden sm:inline">My Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
              </Link>
            ) : (
              <>
                {/* Log In Button - Visible on Tablet/Desktop, accessible via Mobile Menu on small phones */}
                <Link
                  href="/login?mode=login"
                  className="hidden sm:inline-flex px-4 py-2 bg-white hover:bg-[#FFFDF7] text-slate-900 font-display font-bold text-xs sm:text-sm rounded-full border-2 border-slate-950 shadow-[2px_2px_0px_0px_#020617] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
                >
                  Log In
                </Link>

                {/* Sign Up Button */}
                <Link
                  href="/login?mode=signup"
                  className="relative inline-flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-5 py-1.5 sm:py-2 bg-[#FF6B8B] hover:bg-[#ff5779] text-white font-display font-black text-xs sm:text-sm rounded-full border-2 border-slate-950 shadow-[2px_2px_0px_0px_#020617] sm:shadow-[3px_3px_0px_0px_#020617] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-white shrink-0" aria-hidden="true" />
                  <span>Sign Up<span className="hidden sm:inline"> Free</span></span>
                </Link>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 sm:p-2 rounded-full bg-[#FEF3C7] border-2 border-slate-950 shadow-[1.5px_1.5px_0px_0px_#020617] sm:shadow-[2px_2px_0px_0px_#020617] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer shrink-0"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />}
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              id="mobile-navigation-menu"
              role="region"
              aria-label="Mobile Navigation Menu"
              initial={{ opacity: 0, y: -15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.98 }}
              className="md:hidden mt-3 bg-white border-3 border-slate-950 rounded-3xl p-5 shadow-[6px_6px_0px_0px_#020617] flex flex-col gap-3"
            >
              {[
                { label: "Features", href: "#features" },
                { label: "Architecture", href: "#architecture" },
                { label: "100% Free", href: "#free-forever" },
                { label: "FAQ", href: "#faq" },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 font-display font-bold text-slate-800 hover:bg-[#FDF8EE] rounded-2xl border-2 border-slate-950/20 active:border-slate-950 transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3 border-t-2 border-slate-200">
                {user ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 bg-[#06D6A0] text-slate-950 font-display font-black text-sm border-2 border-slate-950 rounded-2xl shadow-[2px_2px_0px_0px_#020617] flex items-center justify-center gap-2"
                  >
                    <Shield className="w-4 h-4" aria-hidden="true" />
                    <span>My Dashboard</span>
                  </Link>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="/login?mode=login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-2.5 bg-white font-display font-bold text-sm text-slate-950 border-2 border-slate-950 rounded-2xl shadow-[2px_2px_0px_0px_#020617] text-center"
                    >
                      Log In
                    </Link>
                    <Link
                      href="/login?mode=signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-2.5 bg-[#FF6B8B] text-white font-display font-bold text-sm border-2 border-slate-950 rounded-2xl shadow-[2px_2px_0px_0px_#020617] text-center"
                    >
                      Sign Up Free
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </header>

      {/* Main Semantic Landmark for Accessibility */}
      <main id="main-content" tabIndex={-1} className="focus:outline-none">

      {/* ============================================================ */}
      {/* 2. HERO SECTION — ADVERTISING VALUE PROPOSITION             */}
      {/* ============================================================ */}
      <section className="relative z-10 pt-12 sm:pt-16 pb-16 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Left Column: Core Value Advertisement */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              {/* Marketing Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#FFD166] text-slate-950 font-display font-black text-xs sm:text-sm rounded-full border-3 border-slate-950 shadow-[3px_3px_0px_0px_#020617] mb-6">
                {/* <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" /> */}
                <span>THE SCIENCE-BACKED GAMIFIED PRODUCTIVITY PLATFORM</span>
              </div>

              {/* Headline */}
              <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl xl:text-7xl text-slate-950 leading-[1.08] tracking-tight mb-6">
                Turn Daily Habits Into An{" "}
                <span className="relative inline-block mt-1 sm:mt-0">
                  <span className="relative z-10 bg-[#FF6B8B] text-white px-3 py-1 rounded-2xl border-3 border-slate-950 shadow-[4px_4px_0px_0px_#020617] inline-block -rotate-1">
                    Epic RPG
                  </span>
                </span>{" "}
                Adventure.
              </h1>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl md:text-2xl text-slate-700 font-bold max-w-2xl leading-relaxed mb-8">
                The all-in-one productivity engine that converts real-world workouts, study hours,
                and daily chores into measurable character progression, streak multipliers, and
                tangible rewards.
              </p>

              {/* Call to Actions */}
              <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-8">
                <button
                  onClick={() => handleOpenAuth("signup")}
                  className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#FF6B8B] hover:bg-[#ff5779] text-white font-display font-black text-lg rounded-3xl border-4 border-slate-950 shadow-[6px_6px_0px_0px_#020617] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#020617] transition-all text-center"
                >
                  <span>Create Free Account</span>
                  <ArrowRight className="w-5 h-5 stroke-[3] group-hover:translate-x-1 transition-transform" />
                </button>

                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-3 px-6 py-4 bg-white hover:bg-[#FFF8E7] text-slate-900 font-display font-bold text-base sm:text-lg rounded-3xl border-3 border-slate-950 shadow-[5px_5px_0px_0px_#020617] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#020617] transition-all"
                >
                  <span>Explore Features</span>
                  <ChevronDown className="w-4 h-4" />
                </a>
              </div>

              {/* Trust Features Checklist */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs sm:text-sm font-extrabold text-slate-700 pt-2">
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#06D6A0] stroke-[3]" />
                  <span>Free Forever Core</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#06D6A0] stroke-[3]" />
                  <span>Cross-Platform Sync</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#06D6A0] stroke-[3]" />
                  <span>Zero Ads or Trackers</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive System Architecture Engine Preview */}
            <div className="lg:col-span-5 relative">
              {/* Floating Decorative Badges */}
              <div className="absolute -top-5 -right-3 z-20 bg-[#FFD166] text-slate-950 font-display font-black px-4 py-2 rounded-2xl border-3 border-slate-950 shadow-[4px_4px_0px_0px_#020617] text-xs sm:text-sm flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-600 fill-orange-500" />
                <span>Streak Multipliers: Up to 3.5x</span>
              </div>

              {/* Main System Showcase Card */}
              <div className="relative bg-white border-4 border-slate-950 rounded-3xl p-6 sm:p-7 shadow-[8px_8px_0px_0px_#020617]">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b-3 border-slate-950 mb-5">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                      Productivity Engine Demonstration
                    </span>
                    <h3 className="font-display font-black text-xl text-slate-950">
                      Real-World Habit Conversion
                    </h3>
                  </div>
                  <span className="bg-[#06D6A0] text-slate-950 text-xs font-display font-black px-2.5 py-1 rounded-full border-2 border-slate-950 shadow-[1px_1px_0px_0px_#020617]">
                    Live Architecture
                  </span>
                </div>

                {/* Category Selector Tabs */}
                <div className="text-xs font-display font-black text-slate-500 mb-2">
                  SELECT HABIT DOMAIN TO PREVIEW SPEC:
                </div>
                <div
                  role="tablist"
                  aria-label="Habit domain categories"
                  className="grid grid-cols-2 gap-2 mb-5"
                >
                  {SYSTEM_CATEGORIES.map((category, index) => (
                    <button
                      key={category.id}
                      role="tab"
                      id={`tab-${category.id}`}
                      aria-selected={activeCategoryIndex === index}
                      aria-controls="category-spec-panel"
                      tabIndex={activeCategoryIndex === index ? 0 : -1}
                      onClick={() => setActiveCategoryIndex(index)}
                      className={`p-2.5 rounded-2xl border-2 border-slate-950 font-display font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                        activeCategoryIndex === index
                          ? `${category.badgeBg} shadow-[3px_3px_0px_0px_#020617] -translate-y-0.5`
                          : "bg-white hover:bg-[#FDF8EE] text-slate-700 shadow-[1px_1px_0px_0px_#020617]"
                      }`}
                    >
                      <span className="text-base" aria-hidden="true">{category.icon}</span>
                      <span className="truncate">{category.name}</span>
                    </button>
                  ))}
                </div>

                {/* Selected Category Conversion Specs */}
                <div
                  id="category-spec-panel"
                  role="tabpanel"
                  aria-labelledby={`tab-${activeCategory.id}`}
                  className="bg-[#FDF8EE] rounded-2xl border-3 border-slate-950 p-4 mb-4 shadow-[3px_3px_0px_0px_#020617]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-500 uppercase">
                      Target Attribute Allocation
                    </span>
                    <span className="font-display font-black text-xs px-2 py-0.5 bg-white border border-slate-950 rounded-md">
                      {activeCategory.attribute}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-700 mb-3">
                    {activeCategory.description}
                  </p>

                  <div className="grid grid-cols-3 gap-2 bg-white rounded-xl border-2 border-slate-950 p-2.5 text-center">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 block">BASE XP</span>
                      <span className="font-display font-black text-sm text-[#FF6B8B]">
                        +{activeCategory.baseXP} XP
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 block">STAT BOOST</span>
                      <span className="font-display font-black text-sm text-[#8B5CF6]">
                        {activeCategory.statGain}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 block">LOOT CURRENCY</span>
                      <span className="font-display font-black text-sm text-[#D97706]">
                        {activeCategory.coinYield}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Built-in Task Templates Preview */}
                <div>
                  <span className="text-xs font-display font-black text-slate-500 block mb-2">
                    DEFAULT TEMPLATE BOUNTIES:
                  </span>
                  <div className="space-y-2">
                    {activeCategory.sampleTasks.map((task, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-xl border-2 border-slate-950 p-2.5 flex items-center justify-between text-xs font-bold shadow-[2px_2px_0px_0px_#020617]"
                      >
                        <span className="text-slate-800">{task}</span>
                        <span className="bg-[#06D6A0] text-slate-950 text-[10px] font-black px-2 py-0.5 rounded border border-slate-950">
                          Verified Quest
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Callout */}
                <div className="mt-4 pt-3 border-t-2 border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>Full customization unlocked on sign up</span>
                  <button
                    onClick={() => handleOpenAuth("signup")}
                    className="text-[#FF6B8B] font-black underline underline-offset-2 hover:text-[#ff5779]"
                  >
                    Try Engine Free →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. CORE VALUE PILLARS & BEHAVIORAL SCIENCE ADVERTISEMENT    */}
      {/* ============================================================ */}
      <section className="relative z-10 py-16 bg-[#FFFDF7] border-y-4 border-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#D8B4FE] text-slate-950 font-display font-black text-xs sm:text-sm rounded-full border-3 border-slate-950 shadow-[3px_3px_0px_0px_#020617] mb-4">
              <Brain className="w-4 h-4 text-slate-950" />
              <span>THE PSYCHOLOGY OF ENGAGEMENT</span>
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-slate-950 tracking-tight mb-4">
              Why Traditional To-Do Lists Fail
            </h2>
            <p className="text-base sm:text-lg text-slate-700 font-bold">
              Standard productivity apps create burnout through unrewarded checklists. LifeRPG replaces
              executive fatigue with intrinsic motivation and positive feedback loops.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#F0EBFF] rounded-3xl border-3 border-slate-950 p-7 shadow-[6px_6px_0px_0px_#020617] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-950 flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_#020617] mb-5">
                  ⚡
                </div>
                <h3 className="font-display font-black text-2xl text-slate-950 mb-3">
                  Immediate Feedback Loops
                </h3>
                <p className="text-sm font-bold text-slate-700 leading-relaxed mb-4">
                  The human brain struggles with delayed outcomes (such as waiting months for fitness
                  or career gains). LifeRPG bridges this gap with instant visual XP and tangible coin
                  drops for every micro-action.
                </p>
              </div>
              <div className="bg-white/80 rounded-xl border-2 border-slate-950 p-3 text-xs font-black text-slate-800">
                ✓ Overcomes Present Bias in behavioral economics
              </div>
            </div>

            <div className="bg-[#FFEAEF] rounded-3xl border-3 border-slate-950 p-7 shadow-[6px_6px_0px_0px_#020617] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-950 flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_#020617] mb-5">
                  ⚖️
                </div>
                <h3 className="font-display font-black text-2xl text-slate-950 mb-3">
                  Holistic Life Balance
                </h3>
                <p className="text-sm font-bold text-slate-700 leading-relaxed mb-4">
                  Never optimize work at the expense of your health. Our multi-attribute system tracks
                  Vitality, Brawn, Intellect, and Swiftness simultaneously, highlighting areas of neglect
                  before burnout happens.
                </p>
              </div>
              <div className="bg-white/80 rounded-xl border-2 border-slate-950 p-3 text-xs font-black text-slate-800">
                ✓ Multi-dimensional progress metrics
              </div>
            </div>

            <div className="bg-[#E8FAF5] rounded-3xl border-3 border-slate-950 p-7 shadow-[6px_6px_0px_0px_#020617] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-950 flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_#020617] mb-5">
                  🪙
                </div>
                <h3 className="font-display font-black text-2xl text-slate-950 mb-3">
                  Guilt-Free Rewards
                </h3>
                <p className="text-sm font-bold text-slate-700 leading-relaxed mb-4">
                  Eliminate procrastination guilt. By setting custom coin costs on real-world leisure
                  activities (gaming, dining out, entertainment), your relaxation is earned through
                  honest effort.
                </p>
              </div>
              <div className="bg-white/80 rounded-xl border-2 border-slate-950 p-3 text-xs font-black text-slate-800">
                ✓ Positive reinforcement habit conditioning
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. PLATFORM ARCHITECTURE & COMPREHENSIVE FEATURES           */}
      {/* ============================================================ */}
      <section id="features" className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#38BDF8] text-slate-950 font-display font-black text-xs sm:text-sm rounded-full border-3 border-slate-950 shadow-[3px_3px_0px_0px_#020617] mb-4">
              <Layers className="w-4 h-4 text-slate-950" />
              <span>ENTERPRISE-GRADE CAPABILITIES</span>
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-slate-950 tracking-tight mb-4">
              Engineered For Lifelong Consistency
            </h2>
            <p className="text-base sm:text-lg text-slate-700 font-bold">
              Built on modern cloud architecture with instant device sync, powerful task scheduling,
              and comprehensive privacy protections.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-3xl border-3 border-slate-950 p-6 shadow-[6px_6px_0px_0px_#020617] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#FFEAEF] border-2 border-slate-950 flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_#020617] mb-4">
                  📜
                </div>
                <h3 className="font-display font-black text-xl text-slate-950 mb-2">
                  Flexible Bounty Scheduling
                </h3>
                <p className="text-sm font-bold text-slate-700 leading-relaxed mb-4">
                  Set daily habits, weekly routines, recurring chore intervals, or one-off high-impact
                  Boss Quests with automated difficulty scaling.
                </p>
              </div>
              <div className="text-xs font-black text-[#FF6B8B] uppercase tracking-wider">
                Daily, Weekly &amp; Recurring Logic
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-3xl border-3 border-slate-950 p-6 shadow-[6px_6px_0px_0px_#020617] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#E8FAF5] border-2 border-slate-950 flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_#020617] mb-4">
                  👥
                </div>
                <h3 className="font-display font-black text-xl text-slate-950 mb-2">
                  Guilds &amp; Party Battles
                </h3>
                <p className="text-sm font-bold text-slate-700 leading-relaxed mb-4">
                  Join forces with friends or colleagues in cooperative parties. Every completed member
                  quest contributes damage to communal procrastination bosses.
                </p>
              </div>
              <div className="text-xs font-black text-[#06D6A0] uppercase tracking-wider">
                Shared Accountability System
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-3xl border-3 border-slate-950 p-6 shadow-[6px_6px_0px_0px_#020617] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#FFF8E7] border-2 border-slate-950 flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_#020617] mb-4">
                  🛍️
                </div>
                <h3 className="font-display font-black text-xl text-slate-950 mb-2">
                  Custom Loot Marketplace
                </h3>
                <p className="text-sm font-bold text-slate-700 leading-relaxed mb-4">
                  Build a personalized reward catalog tailored to what excites you. Trade earned gold
                  for self-care vouchers, treats, or cosmetic character gear.
                </p>
              </div>
              <div className="text-xs font-black text-[#D97706] uppercase tracking-wider">
                Full Customization Control
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-3xl border-3 border-slate-950 p-6 shadow-[6px_6px_0px_0px_#020617] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#F0EBFF] border-2 border-slate-950 flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_#020617] mb-4">
                  📊
                </div>
                <h3 className="font-display font-black text-xl text-slate-950 mb-2">
                  Advanced Analytics &amp; Radar
                </h3>
                <p className="text-sm font-bold text-slate-700 leading-relaxed mb-4">
                  Inspect comprehensive stat graphs, completion trends, peak productivity hours, and
                  unbroken streak records over days, months, and years.
                </p>
              </div>
              <div className="text-xs font-black text-[#8B5CF6] uppercase tracking-wider">
                Actionable Habit Insights
              </div>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-3xl border-3 border-slate-950 p-6 shadow-[6px_6px_0px_0px_#020617] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] border-2 border-slate-950 flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_#020617] mb-4">
                  📱
                </div>
                <h3 className="font-display font-black text-xl text-slate-950 mb-2">
                  Cross-Platform Real-Time Sync
                </h3>
                <p className="text-sm font-bold text-slate-700 leading-relaxed mb-4">
                  Whether using desktop at work, tablet at home, or mobile on the go, your character
                  level, active bounties, and streak status stay synchronized instantaneously.
                </p>
              </div>
              <div className="text-xs font-black text-[#B45309] uppercase tracking-wider">
                iOS, Android, Web &amp; Desktop
              </div>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-3xl border-3 border-slate-950 p-6 shadow-[6px_6px_0px_0px_#020617] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#E0F2FE] border-2 border-slate-950 flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_#020617] mb-4">
                  🔒
                </div>
                <h3 className="font-display font-black text-xl text-slate-950 mb-2">
                  Private &amp; Secure Cloud
                </h3>
                <p className="text-sm font-bold text-slate-700 leading-relaxed mb-4">
                  Your daily routines and personal tasks belong exclusively to you. All data is
                  encrypted at rest and in transit. We never sell personal information to third parties.
                </p>
              </div>
              <div className="text-xs font-black text-[#0284C7] uppercase tracking-wider">
                Zero Data Monetization
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. 100% FREE OF COST (ZERO PAYWALL PROMISE)                 */}
      {/* ============================================================ */}
      <section id="free-forever" className="relative z-10 py-20 bg-white/70 border-t-4 border-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#06D6A0] text-slate-950 font-display font-black text-xs sm:text-sm rounded-full border-3 border-slate-950 shadow-[3px_3px_0px_0px_#020617] mb-4">
              <Gift className="w-4 h-4 text-slate-950" />
              <span>100% FREE OF COST • NO PAYWALLS</span>
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-slate-950 tracking-tight mb-4">
              Every Quest. Every Stat. Completely Free.
            </h2>
            <p className="text-base sm:text-lg text-slate-700 font-bold">
              We believe personal growth and healthy habits shouldn&apos;t be gated behind costly
              subscriptions. LifeRPG is 100% free of charge for every adventurer on the planet.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto">
            {/* Card 1: All Features Unlocked at $0 */}
            <div className="lg:col-span-7 bg-white rounded-3xl sm:rounded-[36px] border-4 border-slate-950 p-7 sm:p-10 shadow-[8px_8px_0px_0px_#020617] flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                  <span className="inline-block px-3.5 py-1.5 bg-[#06D6A0] text-slate-950 text-xs font-display font-black rounded-full border-2 border-slate-950 shadow-[2px_2px_0px_0px_#020617]">
                    FULL ACCESS UNLOCKED
                  </span>
                  <span className="font-display font-black text-xs text-slate-500 uppercase tracking-wider">
                    Lifetime Free Access
                  </span>
                </div>

                <div className="flex items-baseline gap-3 mb-6 pb-6 border-b-3 border-slate-100">
                  <span className="font-display font-black text-5xl sm:text-6xl text-slate-950">
                    $0
                  </span>
                  <div>
                    <span className="font-display font-black text-lg text-[#FF6B8B] block">
                      Free Forever
                    </span>
                    <span className="font-bold text-xs text-slate-500">
                      No credit card • No trial expiration • No hidden fees
                    </span>
                  </div>
                </div>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-8 text-xs sm:text-sm font-bold text-slate-700">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#06D6A0] stroke-[3] shrink-0" />
                    <span>Unlimited daily habit tracking</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#06D6A0] stroke-[3] shrink-0" />
                    <span>Full 4-stat RPG progression tree</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#06D6A0] stroke-[3] shrink-0" />
                    <span>Multiplayer Party Quests &amp; Guilds</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#06D6A0] stroke-[3] shrink-0" />
                    <span>Custom Loot Reward Marketplace</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#06D6A0] stroke-[3] shrink-0" />
                    <span>Streak multipliers &amp; freeze tokens</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#06D6A0] stroke-[3] shrink-0" />
                    <span>Cross-platform sync (iOS, Android, Web)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#06D6A0] stroke-[3] shrink-0" />
                    <span>Comprehensive analytics &amp; charts</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#06D6A0] stroke-[3] shrink-0" />
                    <span>Zero advertisements &amp; zero tracking</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleOpenAuth("signup")}
                className="w-full py-4 bg-[#FF6B8B] hover:bg-[#ff5779] text-white font-display font-black text-lg rounded-2xl border-3 border-slate-950 shadow-[5px_5px_0px_0px_#020617] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#020617] transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5 fill-white" />
                <span>Create Free Adventurer Account</span>
              </button>
            </div>

            {/* Card 2: The Zero-Cost Community Promise */}
            <div className="lg:col-span-5 bg-[#FFF8E7] rounded-3xl sm:rounded-[36px] border-4 border-slate-950 p-7 sm:p-10 shadow-[8px_8px_0px_0px_#020617] flex flex-col justify-between">
              <div>
                <div className="inline-block px-3.5 py-1.5 bg-[#FFD166] text-slate-950 text-xs font-display font-black rounded-full border-2 border-slate-950 mb-4 shadow-[2px_2px_0px_0px_#020617]">
                  OUR CORE PLEDGE
                </div>
                <h3 className="font-display font-black text-2xl sm:text-3xl text-slate-950 mb-3">
                  Why We Made LifeRPG Free
                </h3>
                <p className="text-sm font-bold text-slate-700 leading-relaxed mb-6">
                  Too many productivity tools exploit dopamine and then charge $80/year just to view
                  your own streak. We built LifeRPG with ethical software standards:
                </p>

                <div className="space-y-3 mb-6">
                  <div className="bg-white rounded-2xl border-2 border-slate-950 p-3.5 shadow-[2px_2px_0px_0px_#020617]">
                    <div className="flex items-center gap-2 font-display font-black text-sm text-slate-950 mb-1">
                      <span>🚫 Zero Pay-To-Win</span>
                    </div>
                    <p className="text-xs font-bold text-slate-600">
                      You can never buy XP, stats, or streak restores with real money. Pure, honest
                      effort is the only currency that matters here.
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border-2 border-slate-950 p-3.5 shadow-[2px_2px_0px_0px_#020617]">
                    <div className="flex items-center gap-2 font-display font-black text-sm text-slate-950 mb-1">
                      <span>🛡️ Zero Intrusive Ads</span>
                    </div>
                    <p className="text-xs font-bold text-slate-600">
                      No video banners or popups distracting you when you&apos;re trying to study or focus.
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border-2 border-slate-950 p-3.5 shadow-[2px_2px_0px_0px_#020617]">
                    <div className="flex items-center gap-2 font-display font-black text-sm text-slate-950 mb-1">
                      <span>🔒 Zero Data Selling</span>
                    </div>
                    <p className="text-xs font-bold text-slate-600">
                      Your daily routine and personal habits belong strictly to you. Encrypted and
                      private.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 rounded-2xl border-2 border-slate-950 p-4 text-center">
                <span className="font-display font-black text-xs text-slate-900 block">
                  Built For The Productivity Community Worldwide
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  Open, accessible, and free forever.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. FREQUENTLY ASKED QUESTIONS (ADVERTISEMENT & DETAILS)      */}
      {/* ============================================================ */}
      <section id="faq" className="relative z-10 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#D8B4FE] text-slate-950 font-display font-black text-xs sm:text-sm rounded-full border-3 border-slate-950 shadow-[3px_3px_0px_0px_#020617] mb-4">
              <HelpCircle className="w-4 h-4 text-slate-950" />
              <span>FREQUENTLY ASKED QUESTIONS</span>
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-slate-950 tracking-tight mb-4">
              Got Questions? We&apos;ve Got Answers.
            </h2>
            <p className="text-base sm:text-lg text-slate-700 font-bold">
              Everything you need to know about the platform, safety, and gamification mechanics.
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              const buttonId = `faq-trigger-${index}`;
              const panelId = `faq-panel-${index}`;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl border-3 border-slate-950 overflow-hidden shadow-[4px_4px_0px_0px_#020617] transition-all"
                >
                  <button
                    id={buttonId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full text-left p-5 flex items-center justify-between gap-4 font-display font-black text-base sm:text-lg text-slate-950 hover:bg-[#FDF8EE] transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <div
                      aria-hidden="true"
                      className={`w-8 h-8 rounded-xl border-2 border-slate-950 flex items-center justify-center transition-transform ${
                        isOpen ? "bg-[#FFD166] rotate-180" : "bg-[#FDF8EE]"
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        id={panelId}
                        role="region"
                        aria-labelledby={buttonId}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-5 pb-5 pt-1 text-sm sm:text-base font-bold text-slate-700 leading-relaxed border-t-2 border-slate-100"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. BOTTOM CTA CARD                                           */}
      {/* ============================================================ */}
      <section className="relative z-10 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-[#FF6B8B] rounded-3xl sm:rounded-[40px] border-4 border-slate-950 p-8 sm:p-14 shadow-[10px_10px_0px_0px_#020617] text-center overflow-hidden">
            <div className="absolute inset-0 comic-hatch pointer-events-none opacity-40" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#FFD166] text-slate-950 font-display font-black text-xs sm:text-sm rounded-full border-3 border-slate-950 shadow-[3px_3px_0px_0px_#020617] mb-6">
                <span>🏰 FREE ONBOARDING</span>
              </div>

              <h2 className="font-display font-black text-4xl sm:text-5xl md:text-6xl text-white tracking-tight mb-6 leading-tight">
                Begin Your First Quest Today.
              </h2>

              <p className="text-white/95 font-bold text-lg sm:text-xl mb-8 leading-relaxed">
                Join thousands of individuals turning procrastination into mastery. Set your first
                bounty, claim your starter coin pouch, and level up your life.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
                <button
                  onClick={() => handleOpenAuth("signup")}
                  className="w-full sm:w-auto px-10 py-5 bg-[#FFD166] hover:bg-[#ffc633] text-slate-950 font-display font-black text-xl rounded-3xl border-4 border-slate-950 shadow-[6px_6px_0px_0px_#020617] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#020617] transition-all flex items-center justify-center gap-3 cursor-pointer"
                >
                  <Sparkles className="w-6 h-6 fill-slate-950" aria-hidden="true" />
                  <span>Create Free Account</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm font-extrabold text-white">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" /> No Credit Card Required
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" /> Setup Takes Under 60 Seconds
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" /> Cancel Anytime
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      </main>

      {/* ============================================================ */}
      {/* 8. FOOTER                                                    */}
      {/* ============================================================ */}
      <footer className="relative z-10 border-t-4 border-slate-950 bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FF6B8B] border-3 border-slate-950 flex items-center justify-center shadow-[3px_3px_0px_0px_#020617]">
                <Sword className="w-5 h-5 text-white stroke-[2.5]" />
              </div>
              <span className="font-display font-black text-2xl text-slate-950">
                Life<span className="text-[#FF6B8B]">RPG</span>
              </span>
            </div>

            {/* Navigation links */}
            <div className="flex flex-wrap items-center gap-6 text-sm font-display font-bold text-slate-700">
              <a href="#features" className="hover:text-[#FF6B8B] transition-colors">
                Features
              </a>
              <a href="#free-forever" className="hover:text-[#FF6B8B] transition-colors">
                100% Free
              </a>
              <a href="#faq" className="hover:text-[#FF6B8B] transition-colors">
                FAQ
              </a>
              <button
                onClick={() => handleOpenAuth("login")}
                className="hover:text-[#FF6B8B] transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => handleOpenAuth("signup")}
                className="hover:text-[#FF6B8B] transition-colors text-[#FF6B8B]"
              >
                Sign Up
              </button>
            </div>
          </div>

          <div className="pt-8 border-t-2 border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-500 text-center sm:text-left">
            <div>
              &copy; {new Date().getFullYear()} LifeRPG Inc. All rights reserved. Habit gamification
              engine.
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#06D6A0]"></span>
              <span>All Systems Operational</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
