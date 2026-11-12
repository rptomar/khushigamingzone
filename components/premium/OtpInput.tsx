"use client";

import React, { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (code: string) => void;
  className?: string;
  autoFocus?: boolean;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  className,
  autoFocus = true,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (index: number, char: string) => {
    const digit = char.replace(/[^0-9]/g, "");
    if (!digit) return;

    const chars = value.split("");
    chars[index] = digit[digit.length - 1]; // take last entered digit
    const nextVal = chars.slice(0, length).join("");
    onChange(nextVal);

    if (nextVal.length === length && onComplete) {
      onComplete(nextVal);
    }

    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const chars = value.split("");
      if (chars[index]) {
        chars[index] = "";
        onChange(chars.join(""));
      } else if (index > 0) {
        chars[index - 1] = "";
        onChange(chars.join(""));
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData
      .getData("text")
      .replace(/[^0-9]/g, "")
      .slice(0, length);
    if (!pasteData) return;

    onChange(pasteData);
    if (pasteData.length === length && onComplete) {
      onComplete(pasteData);
    }
    const focusTarget = Math.min(pasteData.length, length - 1);
    inputRefs.current[focusTarget]?.focus();
  };

  return (
    <div className={cn("flex items-center gap-2.5 sm:gap-3 justify-center select-none", className)}>
      {Array.from({ length }).map((_, i) => {
        const char = value[i] || "";
        const isFocused = focusedIndex === i;

        return (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={char}
            onFocus={() => setFocusedIndex(i)}
            onBlur={() => setFocusedIndex(-1)}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className={cn(
              "w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl sm:text-3xl font-extrabold rounded-2xl bg-white/[0.05] border transition-all duration-200 text-white font-[family-name:var(--font-mono)] outline-none shadow-sm",
              isFocused
                ? "border-violet-500 ring-2 ring-violet-500/30 bg-violet-500/10 scale-105"
                : char
                ? "border-white/20 bg-white/[0.08]"
                : "border-white/[0.08]"
            )}
          />
        );
      })}
    </div>
  );
}

