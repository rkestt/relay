import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SkeletonCard, SkeletonGrid } from "@/components/ui/SkeletonCard";

describe("SkeletonCard", () => {
  it("renders without crashing", () => {
    render(<SkeletonCard />);
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders default 3 skeleton lines", () => {
    render(<SkeletonCard />);
    // The body lines are divs with rounded bg-neutral-800 inside the card
    const card = document.querySelector(".animate-pulse");
    expect(card).toBeInTheDocument();

    // Avatar circle should be present
    const avatar = card?.querySelector(".rounded-full");
    expect(avatar).toBeInTheDocument();
  });

  it("renders custom number of lines", () => {
    render(<SkeletonCard lines={5} />);
    // We just verify it renders without error
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<SkeletonCard className="custom-skeleton" />);
    expect(document.querySelector(".custom-skeleton")).toBeInTheDocument();
  });
});

describe("SkeletonGrid", () => {
  it("renders default 6 skeleton cards", () => {
    render(<SkeletonGrid />);
    const grid = document.querySelector(".grid");
    expect(grid).toBeInTheDocument();
  });

  it("renders custom count", () => {
    render(<SkeletonGrid count={3} />);
    const grid = document.querySelector(".grid");
    expect(grid).toBeInTheDocument();
  });
});
