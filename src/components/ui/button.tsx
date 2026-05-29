import { cva, type VariantProps } from "class-variance-authority";
import { cn }                      from "@/lib/utils";
import { Loader2 }                 from "lucide-react";
import { forwardRef }              from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:   "bg-brand-300 hover:bg-brand-200 text-white shadow-glow-sm hover:shadow-glow-md disabled:shadow-none",
        secondary: "bg-surface-hover hover:bg-surface-active text-slate-200 border border-surface-border hover:border-brand-300/40",
        ghost:     "text-slate-400 hover:text-slate-100 hover:bg-surface-hover",
        danger:    "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40",
        outline:   "border border-surface-border hover:border-brand-300/40 text-slate-200 hover:bg-surface-hover",
        link:      "text-brand-200 hover:text-cyan-300 underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm:   "text-xs px-2.5 py-1.5 rounded-md",
        md:   "text-sm px-4 py-2 rounded-lg",
        lg:   "text-sm px-5 py-2.5 rounded-lg",
        icon: "w-8 h-8 rounded-lg",
        "icon-sm": "w-7 h-7 rounded-md",
      },
    },
    defaultVariants: {
      variant: "primary",
      size:    "md",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : leftIcon ? (
          <span className="shrink-0">{leftIcon}</span>
        ) : null}
        {children}
        {rightIcon && !loading && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
