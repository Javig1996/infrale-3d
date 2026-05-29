import { Skeleton, TableRowSkeleton } from "@/components/ui/skeleton";

export default function ProyectoDetailLoading() {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-48 rounded" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-80 rounded" />
        </div>
        <Skeleton className="h-8 w-32 rounded-lg" />
      </div>

      {/* Módulos */}
      <div className="grid sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card p-5 space-y-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-3 w-36 rounded" />
          </div>
        ))}
      </div>

      {/* Modelos IFC */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-surface-border">
          <Skeleton className="h-4 w-28 rounded" />
        </div>
        <div className="divide-y divide-surface-border">
          {Array.from({ length: 3 }).map((_, i) => <TableRowSkeleton key={i} cols={4} />)}
        </div>
      </div>
    </div>
  );
}
