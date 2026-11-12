"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AuroraBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  intensity?: "subtle" | "medium" | "vibrant";
}

export function AuroraBackground({
  children,
  className,
  intensity = "subtle",
}: AuroraBackgroundProps) {
  const intensityStyles = {
    subtle: "opacity-25",
    medium: "opacity-40",
    vibrant: "opacity-60",
  };

  return (
    <div className={cn("relative w-full min-h-screen overflow-hidden bg-[#07070B]", className)}>
      {/* Dynamic Aurora Ambient Blobs */}
      <div
        className={cn(
          "absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-violet-600/30 to-purple-800/10 blur-[130px] pointer-events-none transition-all duration-1000",
          intensityStyles[intensity]
        )}
      />
      <div
        className={cn(
          "absolute top-[30%] -right-[15%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/10 blur-[120px] pointer-events-none transition-all duration-1000",
          intensityStyles[intensity]
        )}
      />
      <div
        className={cn(
          "absolute -bottom-[20%] left-[20%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-tr from-indigo-700/20 via-violet-900/10 to-transparent blur-[140px] pointer-events-none transition-all duration-1000",
          intensityStyles[intensity]
        )}
      />

      {/* Subtle fine grid texture for tech/gaming look */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"
      />

      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
}
