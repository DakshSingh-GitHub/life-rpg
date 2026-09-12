"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sword,
  Shield,
  ArrowLeft,
  User,
  Calendar,
  Globe,
  AtSign,
  Sparkles,
  Check,
  Flame,
  Coins,
  AlertCircle,
  Save,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const ARCHETYPES = [
  {
    id: "warrior",
    name: "Warrior",
    icon: "🥊",
    desc: "Masters of physical discipline, high stamina, and unstoppable drive.",
    color: "border-[#FF6B8B] bg-[#FFEAEF] text-[#FF6B8B]",
  },
  {
    id: "mage",
    name: "Mage",
    icon: "🧠",
    desc: "Scholars of focus, deep work, creative intellect, and mental clarity.",
    color: "border-[#8B5CF6] bg-[#F0EBFF] text-[#8B5CF6]",
  },
  {
    id: "rogue",
    name: "Rogue",
    icon: "⚡",
    desc: "Speedsters of quick execution, swift habits, and ruthless efficiency.",
    color: "border-[#06D6A0] bg-[#E8FAF5] text-[#059669]",
  },
  {
    id: "druid",
    name: "Druid",
    icon: "🌿",
    desc: "Guardians of vitality, sleep harmony, hydration, and mindful balance.",
    color: "border-[#D97706] bg-[#FFF8E7] text-[#D97706]",
  },
];

function calculateAge(dobString?: string): number | null {
  if (!dobString) return null;
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading, updateProfile } = useAuth();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [country, setCountry] = useState("");
  const [avatarClass, setAvatarClass] = useState("warrior");

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=/profile");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setUsername(profile.username || "");
      setDateOfBirth(profile.date_of_birth || "");
      setCountry(profile.country || "");
      setAvatarClass(profile.avatar_class || "warrior");
    }
  }, [profile]);

  const calculatedAge = calculateAge(dateOfBirth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg("Username cannot be empty.");
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await updateProfile({
      full_name: fullName.trim(),
      username: username.trim().toLowerCase(),
      date_of_birth: dateOfBirth || undefined,
      country: country.trim(),
      avatar_class: avatarClass,
    });

    setSaving(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setSuccessMsg("Hero profile successfully updated! 🛡️");
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen bg-[#FDF8EE] flex flex-col items-center justify-center p-4">
        <div className="p-8 bg-white border-3 border-slate-950 rounded-3xl shadow-[5px_5px_0px_0px_#020617] flex flex-col items-center gap-3 text-center max-w-sm">
          <div className="w-10 h-10 rounded-2xl bg-[#FFEAEF] border-2 border-slate-950 flex items-center justify-center shadow-[2px_2px_0px_0px_#020617]">
            <Shield className="w-5 h-5 text-[#FF6B8B]" />
          </div>
          <p className="font-display font-black text-sm text-slate-950">
            Loading Adventurer Profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF8EE] text-slate-900 flex flex-col">
      {/* Top Navbar: Floating Pill with Glassmorphism */}
      <header className="sticky top-3 sm:top-4 z-40 max-w-5xl mx-auto px-4 sm:px-6 w-full pointer-events-none">
        <div className="relative pointer-events-auto">
          {/* Glassmorphism precursor: starts 20px (-bottom-5 = 20px) before body content scrolls behind the navbar */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-2 -top-2 -bottom-5 rounded-full backdrop-blur-[6px] [mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)] -z-10"
          />

          <nav className="bg-white/70 backdrop-blur-xl border-3 border-slate-950 rounded-full px-4 sm:px-6 py-2.5 shadow-[4px_4px_0px_0px_#020617] ring-1 ring-white/80 flex items-center justify-between gap-3 transition-all">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-xs font-display font-black px-3.5 py-1.5 bg-[#FDF8EE] hover:bg-[#FFEAEF] border-2 border-slate-950 rounded-full shadow-[2px_2px_0px_0px_#020617] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Link>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full border-2 border-slate-950 text-xs font-display font-black shadow-[1px_1px_0px_0px_#020617] ${
                  profile.streak_days > 0 ? "bg-[#FFF0E6] text-[#FF5722]" : "bg-slate-100 text-slate-500"
                }`}
              >
                <Flame
                  className={`w-3.5 h-3.5 ${
                    profile.streak_days > 0 ? "fill-[#FF5722] text-[#FF5722]" : "text-slate-400"
                  }`}
                />
                <span>{profile.streak_days}d Streak</span>
              </div>
              <div className="flex items-center gap-1 px-3 py-1.5 bg-[#FFF9DB] text-[#B45309] rounded-full border-2 border-slate-950 text-xs font-display font-black shadow-[1px_1px_0px_0px_#020617]">
                <Coins className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>{profile.gold} Gold</span>
              </div>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="bg-white border-3 border-slate-950 rounded-3xl p-6 sm:p-8 shadow-[6px_6px_0px_0px_#020617]">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b-2 border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#FFEAEF] border-3 border-slate-950 flex items-center justify-center text-3xl shadow-[3px_3px_0px_0px_#020617]">
                {avatarClass === "warrior" && "🥊"}
                {avatarClass === "mage" && "🧠"}
                {avatarClass === "rogue" && "⚡"}
                {avatarClass === "druid" && "🌿"}
              </div>
              <div>
                <h1 className="font-display font-black text-2xl text-slate-950">
                  Hero Profile &amp; Identity
                </h1>
                <p className="text-xs font-bold text-slate-500 mt-0.5">
                  Customize your adventurer credentials, birthday, age, and class archetype.
                </p>
              </div>
            </div>

            <div className="bg-[#E8FAF5] border-2 border-slate-950 px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_0px_#020617] text-xs font-display font-black text-[#059669]">
              Level {profile.level} Adventurer
            </div>
          </div>

          {/* Feedback Alerts */}
          {successMsg && (
            <div className="mt-6 p-4 rounded-2xl bg-[#E8FAF5] border-2 border-[#06D6A0] text-[#059669] text-xs font-bold flex items-center gap-2 shadow-[2px_2px_0px_0px_#020617]">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mt-6 p-4 rounded-2xl bg-[#FFEAEF] border-2 border-[#FF6B8B] text-[#FF6B8B] text-xs font-bold flex items-center gap-2 shadow-[2px_2px_0px_0px_#020617]">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Profile Edit Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-display font-black text-slate-900 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Arthur Pendragon"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-950 bg-[#FDF8EE] text-slate-900 font-bold text-sm focus:outline-none focus:bg-white transition-all shadow-[2px_2px_0px_0px_#020617]"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-display font-black text-slate-900 mb-1.5 flex items-center gap-1.5">
                  <AtSign className="w-3.5 h-3.5 text-slate-500" />
                  <span>Username</span>
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="hero_valiant"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-950 bg-[#FDF8EE] text-slate-900 font-bold text-sm focus:outline-none focus:bg-white transition-all shadow-[2px_2px_0px_0px_#020617]"
                />
              </div>

              {/* Date of Birth & Age Display */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-display font-black text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Date of Birth</span>
                  </label>
                  {calculatedAge !== null && (
                    <span className="text-[11px] font-display font-black bg-[#FEF3C7] text-amber-900 px-2 py-0.5 rounded-lg border border-amber-400">
                      Age: {calculatedAge} yrs old
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-950 bg-[#FDF8EE] text-slate-900 font-bold text-sm focus:outline-none focus:bg-white transition-all shadow-[2px_2px_0px_0px_#020617]"
                />
              </div>

              {/* Country */}
              <div>
                <label className="block text-xs font-display font-black text-slate-900 mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  <span>Country</span>
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. United States, Canada, India"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-950 bg-[#FDF8EE] text-slate-900 font-bold text-sm focus:outline-none focus:bg-white transition-all shadow-[2px_2px_0px_0px_#020617]"
                />
              </div>
            </div>

            {/* Avatar Archetype Picker */}
            <div>
              <label className="block text-xs font-display font-black text-slate-900 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FF6B8B]" />
                <span>Choose Your Hero Class</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ARCHETYPES.map((arch) => (
                  <button
                    key={arch.id}
                    type="button"
                    onClick={() => setAvatarClass(arch.id)}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-start gap-3 ${
                      avatarClass === arch.id
                        ? `${arch.color} border-slate-950 shadow-[3px_3px_0px_0px_#020617] scale-[1.01]`
                        : "bg-white border-slate-300 hover:border-slate-800"
                    }`}
                  >
                    <span className="text-2xl shrink-0 p-1 bg-white rounded-xl border border-slate-950 shadow-[1px_1px_0px_0px_#020617]">
                      {arch.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="font-display font-black text-sm text-slate-950 flex items-center justify-between">
                        <span>{arch.name}</span>
                        {avatarClass === arch.id && (
                          <span className="text-[10px] uppercase font-bold bg-slate-950 text-white px-1.5 py-0.5 rounded">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-bold text-slate-500 mt-0.5 leading-snug">
                        {arch.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t-2 border-slate-100 flex items-center justify-end gap-3">
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-xl border-2 border-slate-300 text-slate-600 font-display font-bold text-sm hover:bg-slate-100 transition-all"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-[#06D6A0] hover:bg-[#05b88a] text-slate-950 font-display font-black text-sm rounded-2xl border-2 border-slate-950 shadow-[3px_3px_0px_0px_#020617] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#020617] transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving Changes..." : "Save Profile Changes"}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
