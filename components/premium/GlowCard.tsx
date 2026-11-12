"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glowColor?: "violet" | "cyan" | "emerald" | "amber" | "rose" | "gold";
  hoverEffect?: boolean;
}

export function GlowCard({
  children,
  className,
  glowColor = "violet",
  hoverEffect = true,
  ...props
}: GlowCardProps) {
  const glowStyles = {
    violet: "hover:border-violet-500/40 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]",
    cyan: "hover:border-cyan-500/40 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]",
    emerald: "hover:border-emerald-500/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]",
    amber: "hover:border-amber-500/40 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]",
    rose: "hover:border-rose-500/40 hover:shadow-[0_0_30px_rgba(244,63,94,0.15)]",
    gold: "hover:border-amber-400/40 hover:shadow-[0_0_30px_rgba(251,191,36,0.18)]",
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl bg-[#0E0E18]/80 backdrop-blur-xl border border-white/[0.08] p-5 transition-all duration-300 text-slate-100",
        hoverEffect && [
          "hover:-translate-y-0.5",
          glowStyles[glowColor],
        ],
        className
      )}
      {...props}
    >
      {/* Subtle top specular highlight */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
      {children}
    </div>
  );
}
