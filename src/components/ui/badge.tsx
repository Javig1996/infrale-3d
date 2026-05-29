import { cva, type VariantProps } from "class-variance-authority";
import { cn }                      from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full text-xs font-medium border",
  {
    variants: {
      variant: {
        default:   "bg-slate-500/15 text-slate-300 border-slate-500/20 px-2 py-0.5",
        primary:   "bg-brand-300/15 text-brand-100 border-brand-300/20 px-2 py-0.5",
        success:   "bg-green-500/15 text-green-300 border-green-500/20 px-2 py-0.5",
        warning:   "bg-yellow-500/15 text-yellow-300 border-yellow-500/20 px-2 py-0.5",
        danger:    "bg-red-500/15 text-red-400 border-red-500/20 px-2 py-0.5",
        info:      "bg-cyan-400/10 text-cyan-300 border-cyan-400/20 px-2 py-0.5",
        purple:    "bg-purple-500/15 text-purple-300 border-purple-500/20 px-2 py-0.5",
        // Tipos de proyecto
        electrico: "bg-yellow-500/15 text-yellow-300 border-yellow-500/20 px-2 py-0.5",
        civil:     "bg-green-500/15 text-green-300 border-green-500/20 px-2 py-0.5",
        mecanico:  "bg-orange-500/15 text-orange-300 border-orange-500/20 px-2 py-0.5",
      },
      size: {
        sm: "text-[10px] px-1.5 py-0",
        md: "text-xs px-2 py-0.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size:    "md",
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  dotColor?: string;
}

export function Badge({ className, variant, size, dot, dotColor, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn("status-dot", dotColor ?? "bg-current")}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

export { badgeVariants };
