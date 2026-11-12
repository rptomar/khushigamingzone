"use client";

import React, { useEffect, useState } from "react";
import { formatPaise } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  formatAsPaise?: boolean;
  className?: string;
  duration?: number;
}

export function AnimatedNumber({
  value,
  formatAsPaise = false,
  className,
  duration = 500,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const diff = value - startValue;

    if (diff === 0) return;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const current = Math.floor(startValue + diff * progress);
      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [value, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span className={className}>
      {formatAsPaise ? formatPaise(displayValue) : displayValue.toLocaleString("en-IN")}
    </span>
  );
}
