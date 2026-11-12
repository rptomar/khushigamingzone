"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type ResourceStatus =
  | "available"
  | "running"
  | "stopping"
  | "awaiting_payment"
  | "maintenance";

interface StatusPillProps {
  status: ResourceStatus;
  className?: string;
  showDot?: boolean;
}

export function StatusPill({
  status,
  className,
  showDot = true,
}: StatusPillProps) {
  const configs: Record<
    ResourceStatus,
    { label: string; badge: string; dot: string; ping: string }
  > = {
    available: {
      label: "Available",
      badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      dot: "bg-emerald-400",
      ping: "bg-emerald-400/50",
    },
    running: {
      label: "In Session",
      badge: "bg-violet-500/10 text-violet-300 border-violet-500/30",
      dot: "bg-violet-400",
      ping: "bg-violet-400/60",
    },
    stopping: {
      label: "Stop Requested",
      badge: "bg-amber-500/10 text-amber-300 border-amber-500/30",
      dot: "bg-amber-400",
      ping: "bg-amber-400/60",
    },
    awaiting_payment: {
      label: "Awaiting Pay",
      badge: "bg-yellow-500/10 text-yellow-300 border-yellow-500/30",
      dot: "bg-yellow-400",
      ping: "bg-yellow-400/60",
    },
    maintenance: {
      label: "Maintenance",
      badge: "bg-slate-500/10 text-slate-400 border-slate-500/30",
      dot: "bg-slate-400",
      ping: "bg-slate-400/30",
    },
  };

  const current = configs[status] || configs.available;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border tracking-wide uppercase font-[family-name:var(--font-mono)] select-none",
        current.badge,
        className
      )}
    >
      {showDot && (
        <span className="relative flex h-2 w-2">
          {status === "running" || status === "stopping" ? (
            <span
              className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                current.ping
              )}
            />
          ) : null}
          <span
            className={cn("relative inline-flex rounded-full h-2 w-2", current.dot)}
          />
        </span>
      )}
      <span>{current.label}</span>
    </span>
  );
}
