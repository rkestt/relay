import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
  /** Number of skeleton lines inside the card body */
  lines?: number;
}

export function SkeletonCard({ className, lines = 3 }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-neutral-800 bg-neutral-900 p-5",
        "animate-pulse",
        className
      )}
    >
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-neutral-800" />
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="h-3 w-24 rounded bg-neutral-800" />
          <div className="h-2.5 w-16 rounded bg-neutral-800/60" />
        </div>
      </div>

      {/* Body lines */}
      <div className="flex flex-col gap-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-2.5 rounded bg-neutral-800"
            style={{ width: `${Math.random() * 40 + 60}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/** Grid of skeleton cards for loading states */
export function SkeletonGrid({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3", className)}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden animate-pulse"
        >
          {/* Image area */}
          <div className="aspect-video bg-neutral-800" />

          {/* Text area */}
          <div className="p-3 flex flex-col gap-2">
            <div className="h-3 w-20 rounded bg-neutral-800" />
            <div className="h-2 w-14 rounded bg-neutral-800/60" />
          </div>
        </div>
      ))}
    </div>
  );
}