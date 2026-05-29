import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "block" | "circle" | "inline";
}

export function Skeleton({ className, variant = "block", ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "skeleton",
        variant === "text"   && "h-3 w-full",
        variant === "circle" && "rounded-full",
        variant === "inline" && "inline-block",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

/* Skeleton de stat card */
export function StatCardSkeleton() {
  return (
    <div className="glass-card p-4 flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-6 w-16 rounded" />
        <Skeleton className="h-2.5 w-20 rounded" />
      </div>
    </div>
  );
}

/* Skeleton de fila de tabla */
export function TableRowSkeleton({ cols = 3 }: { cols?: number }) {
  return (
    <div className="table-row">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className={`h-3 rounded ${i === 0 ? "w-24" : i === 1 ? "flex-1" : "w-16"}`} />
      ))}
    </div>
  );
}

/* Skeleton de project card */
export function ProjectCardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-2/3 rounded" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-surface-border">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-3 w-24 rounded" />
      </div>
    </div>
  );
}

/* Skeleton de dashboard completo */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div className="space-y-2">
        <Skeleton className="h-7 w-36 rounded" />
        <Skeleton className="h-4 w-64 rounded" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="glass-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-surface-border">
              <Skeleton className="h-4 w-40 rounded" />
            </div>
            <div className="divide-y divide-surface-border">
              {Array.from({ length: 4 }).map((_, j) => (
                <TableRowSkeleton key={j} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
