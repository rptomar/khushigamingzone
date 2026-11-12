"use client";

import React from "react";
import { cn, formatDuration, formatPaise } from "@/lib/utils";

interface LiveTimerRingProps {
  elapsedSeconds: number;
  runningAmountPaise: number;
  ratePerHourPaise?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  isPaused?: boolean;
}

export function LiveTimerRing({
  elapsedSeconds,
  runningAmountPaise,
  ratePerHourPaise,
  size = 320,
  strokeWidth = 12,
  className,
  isPaused = false,
}: LiveTimerRingProps) {
  const center = size / 2;
  const radius = center - strokeWidth * 2;
  const circumference = 2 * Math.PI * radius;

  // 1-hour cycle progress for visual indicator
  const cycleSeconds = 3600;
  const cycleProgress = (elapsedSeconds % cycleSeconds) / cycleSeconds;
  const strokeDashoffset = circumference - cycleProgress * circumference;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center select-none",
        className
      )}
      style={{ width: size, height: size }}
    >
      {/* Outer ambient glow */}
      <div
        className={cn(
          "absolute inset-4 rounded-full blur-2xl transition-opacity duration-700 pointer-events-none",
          isPaused
            ? "bg-amber-500/10"
            : "bg-gradient-to-tr from-violet-600/20 via-indigo-600/20 to-cyan-500/20"
        )}
      />

      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
          <linearGradient id="pausedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>

        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth={strokeWidth}
        />

        {/* Animated Progress Ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={isPaused ? "url(#pausedGrad)" : "url(#timerGrad)"}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-linear"
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
        <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">
          {isPaused ? "Session Paused" : "Live Session Time"}
        </span>

        {/* Stopwatch display */}
        <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white font-[family-name:var(--font-mono)] drop-shadow-[0_0_20px_rgba(139,92,246,0.3)]">
          {formatDuration(elapsedSeconds)}
        </div>

        {/* Running Amount */}
        <div className="mt-3 flex flex-col items-center">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider">
            Current Bill
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 font-[family-name:var(--font-mono)]">
            {formatPaise(runningAmountPaise)}
          </span>
        </div>

        {ratePerHourPaise && (
          <span className="mt-2 text-xs text-slate-500 font-[family-name:var(--font-mono)]">
            Rate: {formatPaise(ratePerHourPaise)}/hr
          </span>
        )}
      </div>
    </div>
  );
}
