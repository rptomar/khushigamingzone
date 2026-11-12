"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { GlowCard } from "./GlowCard";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  delta?: {
    value: string;
    isPositive: boolean;
  };
  subtitle?: string;
  icon?: React.ReactNode;
  glowColor?: "violet" | "cyan" | "emerald" | "amber" | "gold";
  className?: string;
}

export function StatCard({
  title,
  value,
  delta,
  subtitle,
  icon,
  glowColor = "violet",
  className,
}: StatCardProps) {
  return (
    <GlowCard glowColor={glowColor} className={cn("flex flex-col justify-between", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        {icon && (
          <div className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-300">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-[family-name:var(--font-mono)]">
          {value}
        </div>

        {(delta || subtitle) && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            {delta && (
              <span
                className={cn(
                  "inline-flex items-center font-medium",
                  delta.isPositive ? "text-emerald-400" : "text-rose-400"
                )}
              >
                {delta.isPositive ? (
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                )}
                {delta.value}
              </span>
            )}
            {subtitle && <span className="text-slate-400">{subtitle}</span>}
          </div>
        )}
      </div>
    </GlowCard>
  );
}

