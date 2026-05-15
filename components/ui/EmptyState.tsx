import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /** Lucide-style icon SVG path data */
  icon?: React.ReactNode;
  /** Main message */
  title: string;
  /** Secondary hint */
  description?: string;
  /** Optional action button */
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 px-6 text-center",
        className
      )}
    >
      {/* Icon container */}
      <div
        className={cn(
          "w-14 h-14 rounded-2xl border border-neutral-800 bg-neutral-900",
          "flex items-center justify-center",
          "shadow-[0_0_24px_-4px_rgba(240,240,240,0.04)]"
        )}
      >
        {icon ?? (
          <svg
            className="size-6 text-neutral-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 15h8M9 9h.01M15 9h.01" />
          </svg>
        )}
      </div>

      {/* Text */}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-neutral-200">{title}</p>
        {description && (
          <p className="text-xs text-neutral-500 max-w-[260px]">{description}</p>
        )}
      </div>

      {/* Action */}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}