import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding",
    "text-sm font-medium whitespace-nowrap outline-none select-none",
    "relative overflow-hidden",
    "transition-all duration-fast ease-default",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring",
    "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    // MD3 state layer overlay
    "before:absolute before:inset-0 before:bg-current before:opacity-0 before:transition-opacity before:duration-fast",
    "hover:before:opacity-[--md-sys-state-hover-opacity]",
    "active:before:opacity-[--md-sys-state-pressed-opacity]",
  ],
  {
    variants: {
      variant: {
        filled:
          "bg-primary text-primary-foreground shadow-1 hover:shadow-2 active:shadow-1",
        "filled-tonal":
          "bg-secondary text-secondary-foreground shadow-1 hover:shadow-2 active:shadow-1",
        outlined:
          "border-outline bg-transparent text-on-surface hover:bg-surface-container-high active:bg-surface-container",
        text:
          "bg-transparent text-primary hover:bg-primary-muted active:bg-primary-muted",
        elevated:
          "bg-surface-container text-primary shadow-2 hover:shadow-3 active:shadow-2",
        destructive:
          "bg-destructive text-destructive-foreground shadow-1 hover:shadow-2 active:shadow-1",
        // Legacy aliases preserved for compatibility during migration
        default: "bg-primary text-primary-foreground shadow-1 hover:shadow-2 active:shadow-1",
        secondary: "bg-secondary text-secondary-foreground shadow-1 hover:shadow-2 active:shadow-1",
        ghost: "bg-transparent text-on-surface hover:bg-surface-container-high active:bg-surface-container",
        link: "bg-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        md: "h-8 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        lg: "h-9 gap-1.5 px-4 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xl: "h-11 gap-2 px-5 text-base has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-8",
        "icon-xs": "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "filled",
      size: "md",
    },
  }
);

interface ButtonProps
  extends ButtonPrimitive.Props,
    VariantProps<typeof buttonVariants> {}

function Button({
  className,
  variant = "filled",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      nativeButton={false}
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
export type { ButtonProps };
