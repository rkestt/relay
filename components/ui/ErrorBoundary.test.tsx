import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

import { Component, type ReactNode } from "react";

// Suppress console.error from React error logging in test output
beforeAll(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  vi.restoreAllMocks();
});

class ThrowsOnRender extends Component<{ message: string }> {
  render(): ReactNode {
    throw new Error(this.props.message);
  }
}

describe("ErrorBoundary", () => {
  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <p>All good</p>
      </ErrorBoundary>
    );

    expect(screen.getByText("All good")).toBeInTheDocument();
  });

  it("catches error and shows default fallback", () => {
    render(
      <ErrorBoundary>
        <ThrowsOnRender message="Test error" />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Test error")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /retry/i })
    ).toBeInTheDocument();
  });

  it("shows custom fallback when provided", () => {
    render(
      <ErrorBoundary fallback={<p>Custom error UI</p>}>
        <ThrowsOnRender message="Test error" />
      </ErrorBoundary>
    );

    expect(screen.getByText("Custom error UI")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  it('calls onRetry and resets error when retry button is clicked', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();

    const { rerender } = render(
      <ErrorBoundary onRetry={onRetry}>
        <ThrowsOnRender message="Test error" />
      </ErrorBoundary>
    );

    // Error shown
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // Click retry
    await user.click(screen.getByRole("button", { name: /retry/i }));

    expect(onRetry).toHaveBeenCalledTimes(1);

    // After retry, the boundary resets and re-renders children.
    // Since ThrowsOnRender still throws, it will show the error again,
    // but onRetry should have been called once.
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });
});
