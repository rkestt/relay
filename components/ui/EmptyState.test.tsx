import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";

describe("EmptyState", () => {
  it("renders title", () => {
    render(<EmptyState title="No results" />);
    expect(screen.getByText("No results")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <EmptyState title="No results" description="Try a different search" />
    );
    expect(screen.getByText("Try a different search")).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    render(<EmptyState title="No results" />);
    expect(
      screen.queryByText(/try a different/i)
    ).not.toBeInTheDocument();
  });

  it("renders action when provided", () => {
    render(
      <EmptyState
        title="No results"
        action={<Button>Add item</Button>}
      />
    );
    expect(
      screen.getByRole("button", { name: /add item/i })
    ).toBeInTheDocument();
  });

  it("renders default icon when no icon provided", () => {
    render(<EmptyState title="No results" />);
    // The default icon is an SVG with a circle inside
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("renders custom icon when provided", () => {
    render(
      <EmptyState
        title="No results"
        icon={<span data-testid="custom-icon">🔍</span>}
      />
    );
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });
});
