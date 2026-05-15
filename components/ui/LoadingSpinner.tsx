import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

const sizeMap = {
  sm: "size-6 border-2",
  md: "size-8 border-2",
  lg: "size-12 border-[3px]",
};

const labelMap = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export function LoadingSpinner({
  size = "md",
  className,
  label,
}: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={cn(
          "rounded-full border-neutral-700 border-t-current animate-spin",
          sizeMap[size],
          className
        )}
      />
      {label && (
        <p className={cn("text-neutral-500", labelMap[size])}>{label}</p>
      )}
    </div>
  );
}

/** Full-screen loading overlay */
export function LoadingScreen({
  label = "Loading…",
}: {
  label?: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-neutral-950 text-neutral-50">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-neutral-500 animate-pulse">{label}</p>
    </div>
  );
}