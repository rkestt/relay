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
        "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground",
        "placeholder:text-muted-foreground",
        "focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        "transition-all",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };