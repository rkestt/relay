import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingSpinner, LoadingScreen } from "@/components/ui/LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders without crashing", () => {
    render(<LoadingSpinner />);
    // The spinner is a div, not a role-based element
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders with label", () => {
    render(<LoadingSpinner label="Loading..." />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders with different sizes", () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();

    rerender(<LoadingSpinner size="lg" />);
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("does not render label when not provided", () => {
    render(<LoadingSpinner />);
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
});

describe("LoadingScreen", () => {
  it("renders with default label", () => {
    render(<LoadingScreen />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("renders with custom label", () => {
    render(<LoadingScreen label="Please wait..." />);
    expect(screen.getByText("Please wait...")).toBeInTheDocument();
  });
});
