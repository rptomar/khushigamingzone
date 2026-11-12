import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-violet-600/20 text-violet-300 border-violet-500/30",
        secondary:
          "border-transparent bg-white/[0.08] text-slate-300 border-white/10",
        destructive:
          "border-transparent bg-rose-500/20 text-rose-300 border-rose-500/30",
        success:
          "border-transparent bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        warning:
          "border-transparent bg-amber-500/20 text-amber-300 border-amber-500/30",
        gold:
          "border-transparent bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
        outline: "text-slate-300 border-white/15",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

