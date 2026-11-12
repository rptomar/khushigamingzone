"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Delete } from "lucide-react";

interface KeypadInputProps {
  onDigit: (digit: string) => void;
  onDelete: () => void;
  onClear?: () => void;
  className?: string;
}

export function KeypadInput({
  onDigit,
  onDelete,
  onClear,
  className,
}: KeypadInputProps) {
  const keys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["C", "0", "DEL"],
  ];

  return (
    <div className={cn("grid grid-cols-3 gap-3 w-full max-w-sm select-none", className)}>
      {keys.flat().map((k) => {
        if (k === "DEL") {
          return (
            <button
              key="del"
              type="button"
              onClick={onDelete}
              className="h-16 rounded-2xl bg-white/[0.04] hover:bg-white/[0.1] active:bg-white/[0.15] border border-white/[0.08] text-slate-200 flex items-center justify-center transition-all duration-150 active:scale-95 shadow-sm"
              aria-label="Delete"
            >
              <Delete className="w-6 h-6 text-slate-300" />
            </button>
          );
        }

        if (k === "C") {
          return (
            <button
              key="clear"
              type="button"
              onClick={onClear || onDelete}
              className="h-16 rounded-2xl bg-white/[0.04] hover:bg-white/[0.1] active:bg-white/[0.15] border border-white/[0.08] text-slate-400 font-bold text-lg flex items-center justify-center transition-all duration-150 active:scale-95 shadow-sm"
            >
              C
            </button>
          );
        }

        return (
          <button
            key={k}
            type="button"
            onClick={() => onDigit(k)}
            className="h-16 rounded-2xl bg-white/[0.06] hover:bg-violet-600/20 active:bg-violet-600/40 border border-white/[0.08] hover:border-violet-500/40 text-white font-bold text-2xl flex items-center justify-center transition-all duration-150 active:scale-95 shadow-md font-[family-name:var(--font-mono)]"
          >
            {k}
          </button>
        );
      })}
    </div>
  );
}
