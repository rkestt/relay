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
        "flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary focus-visible:scale-[1.01]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        "transition-all duration-150 ease-out",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };