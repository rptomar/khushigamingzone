"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface KhushiLogoProps {
  className?: string;
  showTagline?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  href?: string;
}

export function KhushiLogo({
  className,
  showTagline = false,
  size = "md",
  href = "/",
}: KhushiLogoProps) {
  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
    xl: "w-14 h-14",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
    xl: "text-2xl",
  };

  const content = (
    <div className={cn("flex items-center gap-3 select-none group", className)}>
      {/* Stylized Logo Emblem: Gaming Controller + Snooker Cue Ball */}
      <div
        className={cn(
          "relative flex items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 p-[2px] shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-shadow duration-300",
          iconSizes[size]
        )}
      >
        <div className="w-full h-full bg-[#0E0E18] rounded-[10px] flex items-center justify-center overflow-hidden relative">
          {/* Subtle inner radial glow */}
          <div className="absolute inset-0 bg-radial from-violet-500/30 to-transparent pointer-events-none" />
          
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-4/5 h-4/5"
          >
            {/* Cue stick slash line */}
            <line
              x1="5"
              y1="27"
              x2="27"
              y2="5"
              stroke="url(#cueGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Cue ball (snooker ball) */}
            <circle
              cx="21"
              cy="11"
              r="4.5"
              fill="#F8FAFC"
              filter="drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))"
            />
            {/* Controller D-Pad cross */}
            <path
              d="M9 14h6M12 11v6"
              stroke="#38BDF8"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Controller Action buttons */}
            <circle cx="21" cy="20" r="1.5" fill="#A855F7" />
            <circle cx="24" cy="17" r="1.5" fill="#F59E0B" />

            <defs>
              <linearGradient
                id="cueGrad"
                x1="5"
                y1="27"
                x2="27"
                y2="5"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#6366F1" />
                <stop offset="0.5" stopColor="#06B6D4" />
                <stop offset="1" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={cn(
              "font-bold tracking-tight text-white font-[family-name:var(--font-display)]",
              textSizes[size]
            )}
          >
            Khushi
          </span>
          <span
            className={cn(
              "font-bold tracking-tight bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent font-[family-name:var(--font-display)]",
              textSizes[size]
            )}
          >
            Gaming Zone
          </span>
        </div>
        {showTagline && (
          <span className="text-[11px] tracking-wider text-slate-400 font-medium uppercase mt-1">
            Every second. Every rupee. Accounted.
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

