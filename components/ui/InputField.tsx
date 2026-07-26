import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "./input";

interface InputFieldProps
  extends Omit<React.ComponentProps<typeof Input>, "id" | "aria-describedby" | "aria-invalid" | "aria-required"> {
  label?: string;
  helperText?: string;
  error?: boolean;
  errorText?: string;
  required?: boolean;
  id?: string;
  className?: string;
  labelClassName?: string;
  helperTextClassName?: string;
  errorTextClassName?: string;
}

const InputField = React.forwardRef<
  React.ComponentRef<typeof Input>,
  InputFieldProps
>(
  (
    {
      label,
      helperText,
      error = false,
      errorText,
      required = false,
      id,
      className,
      labelClassName,
      helperTextClassName,
      errorTextClassName,
      ...inputProps
    },
    ref
  ) => {
    const inputId = React.useMemo(
      () => id ?? `input-field-${Math.random().toString(36).slice(2, 11)}`,
      [id]
    );

    const helperTextId = helperText ? `${inputId}-helper` : undefined;
    const errorId = error && errorText ? `${inputId}-error` : undefined;

    const describedBy = [helperTextId, errorId].filter(Boolean).join(" ") || undefined;

    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "text-sm font-medium text-on-surface",
              required && "after:content-['*'] after:ml-0.5 after:text-error",
              labelClassName
            )}
          >
            {label}
          </label>
        )}
        <Input
          ref={ref}
          id={inputId}
          aria-describedby={describedBy}
          aria-invalid={error ? "true" : "false"}
          aria-required={required}
          {...inputProps}
        />
        {helperText && !error && (
          <p
            id={helperTextId}
            className={cn(
              "text-xs text-on-surface-variant",
              helperTextClassName
            )}
          >
            {helperText}
          </p>
        )}
        {error && errorText && (
          <p
            id={errorId}
            className={cn(
              "text-xs text-error",
              errorTextClassName
            )}
            role="alert"
          >
            {errorText}
          </p>
        )}
      </div>
    );
  }
);

InputField.displayName = "InputField";

export { InputField };
export type { InputFieldProps };
