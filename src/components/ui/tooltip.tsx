"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn }                 from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

interface TooltipProps {
  children:  React.ReactNode;
  content:   React.ReactNode;
  side?:     "top" | "right" | "bottom" | "left";
  align?:    "start" | "center" | "end";
  delayMs?:  number;
  className?: string;
}

export function Tooltip({
  children, content, side = "top", align = "center", delayMs = 400, className,
}: TooltipProps) {
  return (
    <TooltipPrimitive.Root delayDuration={delayMs}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          align={align}
          sideOffset={6}
          className={cn(
            "z-50 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-100",
            "bg-brand-800 border border-surface-border shadow-xl",
            "animate-scale-in",
            className
          )}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-brand-800" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

export { TooltipProvider };
