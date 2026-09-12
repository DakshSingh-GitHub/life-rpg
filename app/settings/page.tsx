"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Settings,
  ArrowLeft,
  Sparkles,
  Shield,
  Volume2,
  Bell,
  Moon,
  Flame,
  Coins,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=/settings");
    }
  }, [user, loading, router]);

  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen bg-[#FDF8EE] flex flex-col items-center justify-center p-4">
        <div className="p-8 bg-white border-3 border-slate-950 rounded-3xl shadow-[5px_5px_0px_0px_#020617] flex flex-col items-center gap-3 text-center max-w-sm">
          <div className="w-10 h-10 rounded-2xl bg-[#FFEAEF] border-2 border-slate-950 flex items-center justify-center shadow-[2px_2px_0px_0px_#020617]">
            <Shield className="w-5 h-5 text-[#FF6B8B]" />
          </div>
          <p className="font-display font-black text-sm text-slate-950">
            Accessing Sanctuary Configuration...
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

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-12 flex flex-col items-center justify-center">
        <div className="bg-white border-3 border-slate-950 rounded-3xl p-8 sm:p-12 shadow-[8px_8px_0px_0px_#020617] max-w-2xl w-full text-center relative overflow-hidden">
          {/* Top Banner Tag */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F0EBFF] text-[#8B5CF6] rounded-full border-2 border-slate-950 text-xs font-display font-black shadow-[2px_2px_0px_0px_#020617] mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Preferences &amp; Calibration</span>
          </div>

          {/* Epic Center Icon */}
          <div className="w-24 h-24 mx-auto rounded-3xl bg-[#FEF3C7] border-3 border-slate-950 flex items-center justify-center text-5xl shadow-[4px_4px_0px_0px_#020617] mb-6">
            ⚙️
          </div>

          <h1 className="font-display font-black text-3xl sm:text-4xl text-slate-950 tracking-tight">
            General Settings
          </h1>

          <div className="mt-3 inline-block px-4 py-1.5 bg-[#FFD166] text-slate-950 font-display font-black text-sm rounded-2xl border-2 border-slate-950 shadow-[2px_2px_0px_0px_#020617]">
            Coming Soon
          </div>

          <p className="text-sm font-bold text-slate-600 mt-4 max-w-md mx-auto leading-relaxed">
            Configure sound effects, daily quest push alerts, theme accents, and data export. These features will be available in the upcoming version.
          </p>

          {/* Feature Sneak Peek Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8 text-left">
            <div className="p-3.5 rounded-2xl border-2 border-slate-950 bg-[#FDF8EE] shadow-[2px_2px_0px_0px_#020617]">
              <div className="text-xl mb-1">🔊</div>
              <div className="font-display font-black text-xs text-slate-900">Audio FX</div>
              <div className="text-[11px] font-bold text-slate-500 mt-0.5">
                Toggle retro 8-bit sounds and celebration fanfares.
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border-2 border-slate-950 bg-[#FDF8EE] shadow-[2px_2px_0px_0px_#020617]">
              <div className="text-xl mb-1">🔔</div>
              <div className="font-display font-black text-xs text-slate-900">Quest Reminders</div>
              <div className="text-[11px] font-bold text-slate-500 mt-0.5">
                Custom morning &amp; evening notification schedules.
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border-2 border-slate-950 bg-[#FDF8EE] shadow-[2px_2px_0px_0px_#020617]">
              <div className="text-xl mb-1">🌙</div>
              <div className="font-display font-black text-xs text-slate-900">Themes &amp; UI</div>
              <div className="text-[11px] font-bold text-slate-500 mt-0.5">
                Dark dungeon mode, high contrast &amp; color accents.
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B8B] hover:bg-[#ff5277] text-white font-display font-black text-sm rounded-2xl border-2 border-slate-950 shadow-[3px_3px_0px_0px_#020617] active:translate-x-[1px] active:translate-y-[1px] transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
