"use client";

import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Called when the user clicks the retry button */
  onRetry?: () => void;
  className?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-4 py-16 px-6 text-center",
            this.props.className
          )}
        >
          {/* Warning icon */}
          <div
            className={cn(
              "w-14 h-14 rounded-2xl border border-red-400/20 bg-red-400/10",
              "flex items-center justify-center",
              "shadow-[0_0_24px_-4px_rgba(239,68,68,0.15)]"
            )}
          >
            <svg
              className="size-6 text-red-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          {/* Text */}
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-neutral-200">
              Something went wrong
            </p>
            <p className="text-xs text-neutral-500 max-w-[280px]">
              {this.state.error?.message ?? "An unexpected error occurred."}
            </p>
          </div>

          {/* Retry button */}
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-10 min-w-[120px] rounded-xl",
              "border-neutral-700 text-neutral-200",
              "hover:bg-neutral-800 hover:text-neutral-50",
              "transition-all duration-200"
            )}
            onClick={this.handleRetry}
          >
            <svg
              className="size-4 mr-1.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}