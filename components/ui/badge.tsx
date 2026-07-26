import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, X } from "lucide-react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring/50",
  {
    variants: {
      variant: {
        // Legacy chip variants
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "border-outline bg-surface text-on-surface",
        success: "border-transparent bg-success text-success-foreground",
        warning: "border-transparent bg-warning text-warning-foreground",
        // MD3 chip variants
        assist: "border-outline bg-surface-container text-on-surface",
        filter: "border-outline bg-surface-container text-on-surface",
        suggestion: "border-outline bg-surface text-on-surface-variant",
        input: "border-outline bg-surface-container text-on-surface",
      },
      size: {
        sm: "h-6 gap-1 px-2 text-xs",
        md: "h-8 gap-1.5 px-3 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
  onClose?: () => void;
  active?: boolean;
}

function Badge({
  className,
  variant,
  size,
  icon,
  onClose,
  active,
  children,
  ...props
}: BadgeProps) {
  const isFilter = variant === "filter";
  const isInput = variant === "input";
  const isAssist = variant === "assist";

  const iconNode = isFilter ? (
    <Check
      className={cn(
        "size-3.5 shrink-0 transition-opacity",
        active ? "opacity-100" : "opacity-50"
      )}
      aria-hidden="true"
    />
  ) : isAssist && icon ? (
    <span className="[&_svg]:size-3.5 [&_svg]:shrink-0" aria-hidden="true">
      {icon}
    </span>
  ) : isInput ? (
    <span className="[&_svg]:size-3.5 [&_svg]:shrink-0" aria-hidden="true">
      {icon}
    </span>
  ) : null;

  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      role={isFilter ? "checkbox" : undefined}
      aria-checked={isFilter ? active : undefined}
      {...props}
    >
      {iconNode}
      <span className="truncate">{children}</span>
      {isInput && onClose && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className={cn(
            "inline-flex items-center justify-center rounded-full",
            size === "sm" ? "size-4" : "size-5",
            "hover:bg-current/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
          )}
          aria-label={`Remove ${children}`}
        >
          <X className={cn("size-3", size === "md" && "size-3.5")} />
        </button>
      )}
    </div>
  );
}

export { Badge, badgeVariants };
