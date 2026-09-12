"use client";

import React, { useEffect, useState } from "react";
import { motion, useReducedMotion, useSpring, useTransform, AnimatePresence } from "framer-motion";

// High-stiffness, snappy damping spring physics configurations
export const SPRING_CONFIGS = {
  // Mechanical switch press & tab interactions
  tactile: {
    type: "spring" as const,
    stiffness: 400,
    damping: 20,
    mass: 0.8,
  },
  // Tabletop card drop entrance
  tabletopDrop: {
    type: "spring" as const,
    stiffness: 350,
    damping: 24,
    mass: 1,
  },
  // Liquid fluid fill for XP
  liquidProgress: {
    type: "spring" as const,
    stiffness: 140,
    damping: 18,
    bounce: 0.25,
  },
  // Skillset playful overshoot bounce
  overshootBounce: {
    type: "spring" as const,
    stiffness: 300,
    damping: 15,
  },
  // Heavy stamp slam for Level Up badge
  stampSlam: {
    type: "spring" as const,
    stiffness: 320,
    damping: 16,
    mass: 1.2,
  },
};

/**
 * TactileButton: Neo-brutalist mechanical switch button with 3D press feel
 */
interface TactileButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  shadowSize?: "sm" | "md" | "lg";
}

export function TactileButton({
  children,
  className = "",
  shadowSize = "md",
  disabled,
  onClick,
  ...props
}: TactileButtonProps) {
  const shouldReduceMotion = useReducedMotion();

  const normalShadow =
    shadowSize === "sm"
      ? "2px 2px 0px 0px #020617"
      : shadowSize === "lg"
      ? "5px 5px 0px 0px #020617"
      : "4px 4px 0px 0px #020617";

  const hoverShadow =
    shadowSize === "sm"
      ? "4px 4px 0px 0px #020617"
      : shadowSize === "lg"
      ? "7px 7px 0px 0px #020617"
      : "6px 6px 0px 0px #020617";

  const tapShadow = "1px 1px 0px 0px #020617";

  if (disabled) {
    return (
      <button
        disabled
        className={`${className} cursor-not-allowed opacity-60`}
        {...props}
      >
        {children}
      </button>
    );
  }

  return (
    <motion.button
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              y: -2,
              boxShadow: hoverShadow,
              transition: SPRING_CONFIGS.tactile,
            }
      }
      whileTap={
        shouldReduceMotion
          ? undefined
          : {
              x: 3,
              y: 3,
              boxShadow: tapShadow,
              transition: { duration: 0.05 },
            }
      }
      onClick={onClick}
      style={{
        boxShadow: normalShadow,
        transform: "translate3d(0, 0, 0)",
        WebkitBackfaceVisibility: "hidden",
        backfaceVisibility: "hidden",
        willChange: "transform",
      }}
      className={`select-none cursor-pointer transition-colors ${className}`}
      type={props.type}
      id={props.id}
      title={props.title}
      aria-label={props["aria-label"]}
    >
      {children}
    </motion.button>
  );
}

/**
 * TactileTab: Pill button for filters and navigation tabs
 */
interface TactileTabProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
}

export function TactileTab({
  active,
  onClick,
  children,
  className = "",
  activeClassName = "bg-[#FF6B8B] text-white border-slate-950",
  inactiveClassName = "text-slate-600 hover:text-slate-950 border-transparent hover:border-slate-300",
}: TactileTabProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              y: -2,
              boxShadow: "4px 4px 0px 0px #020617",
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
      style={{
        boxShadow: active ? "2px 2px 0px 0px #020617" : "none",
        transform: "translate3d(0, 0, 0)",
        WebkitBackfaceVisibility: "hidden",
        backfaceVisibility: "hidden",
        willChange: "transform",
      }}
      className={`px-3 py-1.5 rounded-xl font-display font-black text-xs border-2 select-none cursor-pointer transition-all ${
        active ? activeClassName : inactiveClassName
      } ${className}`}
    >
      {children}
    </motion.button>
  );
}

/**
 * AnimatedRollingCounter: Smoothly transitions numbers using Framer Motion physics
 */
export function AnimatedRollingCounter({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const spring = useSpring(value, { stiffness: 100, damping: 20 });
  const display = useTransform(spring, (latest) => Math.round(latest).toLocaleString());
  const [displayText, setDisplayText] = useState(value.toLocaleString());

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    return display.on("change", (latest) => {
      setDisplayText(latest);
    });
  }, [display]);

  return <span className={`tabular-nums ${className}`}>{displayText}</span>;
}

/**
 * DopamineBurst: Spawns upward floating +XP and +Gold badges near the completed checkbox
 */
export interface FloatingBadgeItem {
  id: string;
  xp: number;
  gold: number;
}

export function DopamineBurstOverlay({
  items,
  onComplete,
}: {
  items: FloatingBadgeItem[];
  onComplete: (id: string) => void;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="absolute -top-3 left-3 pointer-events-none z-30 flex items-center gap-1.5">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{
              opacity: 0,
              y: 6,
              scale: 0.6,
              rotate: -8,
            }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: shouldReduceMotion ? 0 : -34,
              scale: [0.6, 1.15, 1, 0.9],
              rotate: [-8, 6, -4, 4],
            }}
            transition={{
              duration: 0.85,
              ease: [0.22, 1, 0.36, 1],
              times: [0, 0.15, 0.7, 1],
            }}
            onAnimationComplete={() => onComplete(item.id)}
            style={{
              transform: "translate3d(0, 0, 0)",
              WebkitBackfaceVisibility: "hidden",
              backfaceVisibility: "hidden",
              willChange: "transform, opacity",
            }}
            className="flex items-center gap-1.5 shadow-sm"
          >
            {item.xp > 0 && (
              <span className="bg-[#10B981] text-white text-[11px] font-display font-black px-2 py-0.5 rounded-full border-2 border-slate-950 shadow-[2px_2px_0px_0px_#020617] flex items-center gap-0.5">
                <span>✨</span>
                <span>+{item.xp} XP</span>
              </span>
            )}
            {item.gold > 0 && (
              <span className="bg-[#FFD166] text-slate-950 text-[11px] font-display font-black px-2 py-0.5 rounded-full border-2 border-slate-950 shadow-[2px_2px_0px_0px_#020617] flex items-center gap-0.5">
                <span>🪙</span>
                <span>+{item.gold}</span>
              </span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * TactileCheckbox: Tactile round circular button with snap-in and pathLength checkmark
 */
export function TactileCheckbox({
  completed,
  onClick,
  size = "md",
}: {
  completed: boolean;
  onClick: () => void;
  size?: "sm" | "md";
}) {
  const shouldReduceMotion = useReducedMotion();

  const dimension = size === "sm" ? "w-6 h-6" : "w-7 h-7 sm:w-8 sm:h-8";
  const iconSize = size === "sm" ? 14 : 16;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={shouldReduceMotion ? undefined : { scale: 1.08 }}
      whileTap={
        shouldReduceMotion
          ? undefined
          : {
              scale: 0.8,
              transition: { duration: 0.08 },
            }
      }
      style={{
        transform: "translate3d(0, 0, 0)",
        WebkitBackfaceVisibility: "hidden",
        backfaceVisibility: "hidden",
        willChange: "transform",
      }}
      className={`${dimension} rounded-full border-2 border-slate-950 flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-[1.5px_1.5px_0px_0px_#020617] relative ${
        completed
          ? "bg-[#06D6A0] text-slate-950"
          : "bg-[#FDF8EE] hover:bg-[#06D6A0]/30 text-slate-950"
      }`}
      title={completed ? "Click to reactivate quest" : "Complete quest"}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.path
          d="M20 6L9 17L4 12"
          initial={false}
          animate={{
            pathLength: completed ? 1 : 0,
            opacity: completed ? 1 : 0,
          }}
          transition={{
            pathLength: {
              type: "spring",
              stiffness: 400,
              damping: 25,
            },
            opacity: { duration: 0.15 },
          }}
        />
      </svg>
    </motion.button>
  );
}

/**
 * SpringProgressBar: Smooth spring animated progress bar with liquid or overshoot mode
 */
export function SpringProgressBar({
  percent,
  mode = "liquid",
  barColor = "#10B981",
  striped = false,
  className = "",
}: {
  percent: number;
  mode?: "liquid" | "overshoot";
  barColor?: string;
  striped?: boolean;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  const clampedPercent = Math.min(100, Math.max(0, percent));

  const springConfig =
    mode === "liquid" ? SPRING_CONFIGS.liquidProgress : SPRING_CONFIGS.overshootBounce;

  return (
    <div className={`w-full overflow-hidden relative ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clampedPercent}%` }}
        transition={shouldReduceMotion ? { duration: 0.2 } : springConfig}
        style={{
          backgroundColor: barColor,
          transform: "translate3d(0, 0, 0)",
          WebkitBackfaceVisibility: "hidden",
          backfaceVisibility: "hidden",
          willChange: "width",
        }}
        className={`h-full rounded-full ${
          striped ? "candy-stripes shadow-[0_0_8px_rgba(16,185,129,0.5)]" : ""
        }`}
      />
    </div>
  );
}
