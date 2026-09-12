"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sword,
  Shield,
  Sparkles,
  Zap,
  Lock,
  Mail,
  User,
  ArrowLeft,
  ArrowRight,
  Flame,
  CheckCircle2,
  AlertCircle,
  Gamepad2,
  Brain,
  Dumbbell,
  Heart,
  Calendar,
  Globe,
  Check,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const AVATAR_CLASSES = [
  {
    id: "warrior",
    name: "Warrior",
    attribute: "BRAWN",
    icon: "🥊",
    perk: "+10% Brawn XP",
    badgeColor: "bg-[#FFEAEF] text-[#FF6B8B] border-[#FF6B8B]",
  },
  {
    id: "mage",
    name: "Scholar",
    attribute: "INTELLECT",
    icon: "🧠",
    perk: "+10% Intellect XP",
    badgeColor: "bg-[#F0EBFF] text-[#8B5CF6] border-[#8B5CF6]",
  },
  {
    id: "rogue",
    name: "Rogue",
    attribute: "SWIFTNESS",
    icon: "⚡",
    perk: "+10% Swiftness XP",
    badgeColor: "bg-[#E8FAF5] text-[#06D6A0] border-[#06D6A0]",
  },
  {
    id: "druid",
    name: "Monk",
    attribute: "VITALITY",
    icon: "🌿",
    perk: "+10% Vitality XP",
    badgeColor: "bg-[#FFF8E7] text-[#D97706] border-[#D97706]",
  },
];

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "India",
  "Germany",
  "France",
  "Japan",
  "Brazil",
  "Singapore",
  "Netherlands",
  "Spain",
  "Italy",
  "India",
  "Sweden",
  "Switzerland",
  "New Zealand",
  "Mexico",
  "South Korea",
  "Ireland",
  "Norway",
  "United Arab Emirates",
  "South Africa",
  "Other / Global Realm",
];

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";

  const { user, signInWithEmail, signUpWithEmail, signInAsGuest, isConfigured } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  
  // Login & Shared State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Signup-specific State: Full Name, DOB, Username, Country, Confirmatory Password, Archetype
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("United States");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedClass, setSelectedClass] = useState("warrior");
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // If already authenticated, redirect to /dashboard
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      if (mode === "login") {
        const result = await signInWithEmail(email, password);
        if (result.error) {
          setErrorMessage(result.error);
        } else {
          setSuccessMessage("Welcome back, Adventurer! Entering your sanctum...");
          setTimeout(() => router.push("/dashboard"), 500);
        }
      } else {
        // Detailed Signup Validations
        if (!fullName.trim()) {
          setErrorMessage("Please provide your full name.");
          setSubmitting(false);
          return;
        }

        if (!dateOfBirth) {
          setErrorMessage("Please enter your date of birth (DOB).");
          setSubmitting(false);
          return;
        }

        const dob = new Date(dateOfBirth);
        const today = new Date();
        if (dob >= today) {
          setErrorMessage("Date of birth must be a past date.");
          setSubmitting(false);
          return;
        }

        if (!username.trim()) {
          setErrorMessage("Please choose your Adventurer Username.");
          setSubmitting(false);
          return;
        }

        if (!country.trim()) {
          setErrorMessage("Please choose or enter your Country of origin.");
          setSubmitting(false);
          return;
        }

        if (!email.trim()) {
          setErrorMessage("Please enter a valid email address.");
          setSubmitting(false);
          return;
        }

        if (password.length < 6) {
          setErrorMessage("Passcode must be at least 6 characters long.");
          setSubmitting(false);
          return;
        }

        if (password !== confirmPassword) {
          setErrorMessage("Passcodes do not match! Please check your confirmatory password.");
          setSubmitting(false);
          return;
        }

        if (!agreeTerms) {
          setErrorMessage("Please accept the Guild Protocol to proceed.");
          setSubmitting(false);
          return;
        }

        const result = await signUpWithEmail({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          dateOfBirth,
          username: username.trim(),
          country: country.trim(),
          avatarClass: selectedClass,
        });

        if (result.error) {
          setErrorMessage(result.error);
        } else if (result.requiresEmailConfirmation) {
          setSuccessMessage(
            "Account created! Please check your email inbox to confirm your registration, then log in."
          );
        } else {
          setSuccessMessage("Hero character awakened! Redirecting to your dashboard...");
          setTimeout(() => router.push("/dashboard"), 600);
        }
      }
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuestLogin = () => {
    signInAsGuest();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#FDF8EE] text-slate-900 selection:bg-[#FFD166] selection:text-slate-950 relative flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      {/* Background Comic Texture */}
      <div className="pointer-events-none fixed inset-0 comic-dots z-0" />

      {/* Top Bar Navigation */}
      <div className="relative z-10 max-w-5xl mx-auto w-full flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border-2 border-slate-950 font-display font-bold text-xs sm:text-sm text-slate-800 hover:bg-[#FEF3C7] shadow-[2px_2px_0px_0px_#020617] active:translate-x-[1px] active:translate-y-[1px] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#FF6B8B] border-2 border-slate-950 flex items-center justify-center shadow-[2px_2px_0px_0px_#020617]">
            <Sword className="w-5 h-5 text-white transform rotate-45" />
          </div>
          <span className="font-display font-black text-xl tracking-tight text-slate-950">
            Life<span className="text-[#FF6B8B]">RPG</span>
          </span>
        </Link>
      </div>

      {/* Main Login / Signup Card */}
      <div
        className={`relative z-10 mx-auto w-full my-6 transition-all duration-300 ${
          mode === "signup" ? "max-w-xl" : "max-w-md"
        }`}
      >
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white border-3 border-slate-950 rounded-3xl p-6 sm:p-8 shadow-[6px_6px_0px_0px_#020617] relative overflow-hidden"
        >
          {/* Header Accent Bar */}
          <div className="flex items-center justify-between pb-5 border-b-2 border-slate-100 mb-5">
            <div>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-950">
                {mode === "login" ? "Welcome Back!" : "Forge Your Hero"}
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
                {mode === "login"
                  ? "Resume your quests and claim daily gold."
                  : "Register your adventurer credentials to begin your journey."}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#FFD166] border-2 border-slate-950 flex items-center justify-center shadow-[2px_2px_0px_0px_#020617]">
              {mode === "login" ? (
                <Shield className="w-6 h-6 text-slate-950" />
              ) : (
                <Sparkles className="w-6 h-6 text-slate-950" />
              )}
            </div>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="grid grid-cols-2 gap-2 bg-[#FDF8EE] p-1.5 rounded-2xl border-2 border-slate-950 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2.5 font-display font-black text-sm rounded-xl transition-all ${
                mode === "login"
                  ? "bg-[#FF6B8B] text-white border-2 border-slate-950 shadow-[2px_2px_0px_0px_#020617]"
                  : "text-slate-600 hover:text-slate-950 border-2 border-transparent"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2.5 font-display font-black text-sm rounded-xl transition-all ${
                mode === "signup"
                  ? "bg-[#FF6B8B] text-white border-2 border-slate-950 shadow-[2px_2px_0px_0px_#020617]"
                  : "text-slate-600 hover:text-slate-950 border-2 border-transparent"
              }`}
            >
              New Character
            </button>
          </div>

          {/* Error Alert */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-[#FFEAEF] border-2 border-[#FF6B8B] rounded-2xl flex items-start gap-2.5 text-xs sm:text-sm font-bold text-[#b82143]"
              >
                <AlertCircle className="w-5 h-5 shrink-0 text-[#FF6B8B]" />
                <div>{errorMessage}</div>
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-[#E8FAF5] border-2 border-[#06D6A0] rounded-2xl flex items-start gap-2.5 text-xs sm:text-sm font-bold text-[#065f46]"
              >
                <CheckCircle2 className="w-5 h-5 shrink-0 text-[#06D6A0]" />
                <div>{successMessage}</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" ? (
              <>
                {/* 1. Full Name & Username (2 columns on sm) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-display font-black text-slate-800 uppercase tracking-wider mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Arthur Pendragon"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#FDF8EE] border-2 border-slate-950 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B8B] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-display font-black text-slate-800 uppercase tracking-wider mb-1.5">
                      Adventurer Username
                    </label>
                    <div className="relative">
                      <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. PhoenixKnight"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#FDF8EE] border-2 border-slate-950 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B8B] transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Date of Birth & Country (2 columns on sm) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-display font-black text-slate-800 uppercase tracking-wider mb-1.5">
                      Date of Birth (DOB)
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="date"
                        required
                        max={new Date().toISOString().split("T")[0]}
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-[#FDF8EE] border-2 border-slate-950 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B8B] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-display font-black text-slate-800 uppercase tracking-wider mb-1.5">
                      Country
                    </label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#FDF8EE] border-2 border-slate-950 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B8B] transition-all appearance-none cursor-pointer"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Guild Email */}
                <div>
                  <label className="block text-xs font-display font-black text-slate-800 uppercase tracking-wider mb-1.5">
                    Guild Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="hero@guild.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#FDF8EE] border-2 border-slate-950 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B8B] transition-all"
                    />
                  </div>
                </div>

                {/* 4. Password & Confirmatory Password (2 columns on sm) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-display font-black text-slate-800 uppercase tracking-wider mb-1.5">
                      Secret Passcode
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#FDF8EE] border-2 border-slate-950 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B8B] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-display font-black text-slate-800 uppercase tracking-wider mb-1.5">
                      Confirm Passcode
                    </label>
                    <div className="relative">
                      <Check className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#FDF8EE] border-2 border-slate-950 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B8B] transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. RPG Character Class Selection */}
                <div>
                  <label className="block text-xs font-display font-black text-slate-800 uppercase tracking-wider mb-1.5">
                    Choose Character Archetype
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {AVATAR_CLASSES.map((cls) => {
                      const isSelected = selectedClass === cls.id;
                      return (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => setSelectedClass(cls.id)}
                          className={`p-2.5 rounded-2xl border-2 text-left transition-all ${
                            isSelected
                              ? "bg-[#FEF3C7] border-slate-950 shadow-[3px_3px_0px_0px_#020617] translate-x-[1px] translate-y-[1px]"
                              : "bg-white border-slate-200 hover:border-slate-400"
                          }`}
                        >
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-xl">{cls.icon}</span>
                            <div>
                              <div className="font-display font-black text-xs text-slate-950">
                                {cls.name}
                              </div>
                              <div className="text-[9px] font-bold text-slate-500">
                                {cls.perk}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Terms Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 rounded border-2 border-slate-950 text-[#FF6B8B] focus:ring-[#FF6B8B] cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-xs font-bold text-slate-600 cursor-pointer">
                    I vow to conquer procrastination &amp; honor the guild rules.
                  </label>
                </div>
              </>
            ) : (
              /* Log In Mode */
              <>
                {/* Email Address */}
                <div>
                  <label className="block text-xs font-display font-black text-slate-800 uppercase tracking-wider mb-1.5">
                    Guild Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="hero@guild.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#FDF8EE] border-2 border-slate-950 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B8B] transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-display font-black text-slate-800 uppercase tracking-wider">
                      Secret Passcode
                    </label>
                    <span className="text-[11px] font-bold text-slate-400">
                      Min 6 characters
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#FDF8EE] border-2 border-slate-950 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B8B] transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-[#FF6B8B] hover:bg-[#ff5779] text-white font-display font-black text-base rounded-2xl border-3 border-slate-950 shadow-[4px_4px_0px_0px_#020617] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#020617] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {submitting ? (
                <>
                  <Sword className="w-5 h-5 animate-spin" />
                  <span>Connecting to Realm...</span>
                </>
              ) : mode === "login" ? (
                <>
                  <span>Enter Sanctum</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Begin Legendary Journey</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-slate-100" />
            </div>
            <span className="relative bg-white px-3 font-display font-black text-[11px] uppercase tracking-wider text-slate-400">
              Or Jump In Instantly
            </span>
          </div>

          {/* Zero-friction Guest Mode */}
          <button
            type="button"
            onClick={handleGuestLogin}
            className="w-full py-2.5 px-4 bg-[#FFD166] hover:bg-[#fcc849] text-slate-950 font-display font-bold text-xs sm:text-sm rounded-2xl border-2 border-slate-950 shadow-[3px_3px_0px_0px_#020617] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#020617] transition-all flex items-center justify-center gap-2"
          >
            <Gamepad2 className="w-4 h-4" />
            <span>⚡ Instant Demo Play (No Account Required)</span>
          </button>

          {/* Supabase Status Footer Note */}
          <div className="mt-5 pt-3 border-t-2 border-slate-100 flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-400">
            <span
              className={`w-2 h-2 rounded-full ${
                isConfigured ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
              }`}
            />
            <span>
              {isConfigured
                ? "Supabase Cloud Database Online"
                : "Local Adventure Mode (Ready for Supabase Keys)"}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Bottom Footer Note */}
      <div className="relative z-10 text-center text-xs font-bold text-slate-400">
        Life RPG &copy; {new Date().getFullYear()} — Transform chores into character stats.
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDF8EE] flex items-center justify-center">
          <div className="p-6 bg-white border-3 border-slate-950 rounded-3xl shadow-[4px_4px_0px_0px_#020617] font-display font-black flex items-center gap-3">
            <Sword className="w-6 h-6 animate-spin text-[#FF6B8B]" />
            <span>Summoning Life RPG...</span>
          </div>
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
