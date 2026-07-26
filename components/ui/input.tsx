import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<
  React.ComponentRef<typeof InputPrimitive>,
  React.ComponentProps<typeof InputPrimitive>
>(({ className, ...props }, ref) => {
  return (
    <InputPrimitive
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-outline bg-surface-container px-3 py-2 text-sm text-on-surface",
        "placeholder:text-on-surface-variant",
        "outline-none",
        "focus:border-primary focus:ring-2 focus:ring-primary/20",
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
        "hover:bg-surface-container-high",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-error aria-invalid:ring-2 aria-invalid:ring-error/20",
        "transition-colors duration-fast",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
