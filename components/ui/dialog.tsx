import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

import { cn } from "@/lib/utils";
import { XIcon } from "@/components/icons";

// ──────────────────────────────────────────────────────
// MD3 Dialog — built on @base-ui/react/dialog
// Provides focus trap, scroll lock, escape handling, and
// aria-modal out of the box.
// ──────────────────────────────────────────────────────

interface DialogProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function Dialog({ children, open, defaultOpen, onOpenChange }: DialogProps) {
  const handleOpenChange = (isOpen: boolean, event: Event, reason: string) => {
    onOpenChange?.(isOpen);
  };

  return (
    <DialogPrimitive.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={handleOpenChange}
      modal
    >
      {children}
    </DialogPrimitive.Root>
  );
}

function DialogTrigger({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
}) {
  return (
    <DialogPrimitive.Trigger
      className={cn("inline-flex", className)}
      {...props}
    >
      {children}
    </DialogPrimitive.Trigger>
  );
}

interface DialogContentProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  children: React.ReactNode;
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className={cn(
            "fixed inset-0 z-50 bg-scrim backdrop-blur-sm",
            "data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
            "transition-opacity duration-fast"
          )}
        />
        <DialogPrimitive.Popup
          ref={ref}
          className={cn(
            "fixed z-50 w-full max-w-lg",
            // Mobile bottom sheet; centered on desktop
            "bottom-0 left-0 right-0 rounded-t-2xl sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl",
            "bg-surface-container p-6 shadow-5 outline-none",
            "border border-outline/50",
            "data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[starting-style]:scale-95",
            "transition-all duration-medium ease-enter",
            className
          )}
          role="dialog"
          aria-modal="true"
          {...props}
        >
          {children}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    );
  }
);
DialogContent.displayName = "DialogContent";

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-h3 font-semibold text-on-surface",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-on-surface-variant", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

function DialogClose({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <DialogPrimitive.Close
      className={cn(
        "absolute top-4 right-4 inline-flex size-8 items-center justify-center rounded-lg",
        "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:opacity-50",
        "transition-colors duration-fast",
        className
      )}
      aria-label="Close"
      {...props}
    >
      {children ?? <XIcon className="size-4" />}
    </DialogPrimitive.Close>
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
};
