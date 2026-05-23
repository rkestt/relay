import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrategyCard } from "@/components/tasks/StrategyCard";

const baseAssignment = {
  id: "assign-1",
  lobby_id: "lobby-1",
  user_id: "user-1",
  round_id: "round-1",
  strategy_id: "strat-1",
  assigned_at: "2024-01-01T00:00:00Z",
  upvotes: 10,
  downvotes: 3,
  user_vote: null as "up" | "down" | null,
  strategy: {
    id: "strat-1",
    map_id: "map-1",
    site_id: null,
    operator_id: null,
    title: "Test Strategy",
    description: "A test strategy description",
    image_url: "https://example.com/thumb.png",
    images: [
      {
        id: "img-1",
        strategy_id: "strat-1",
        image_url: "https://example.com/thumb.png",
        sort_order: 1,
        caption: null,
        created_at: "2024-01-01T00:00:00Z",
      },
    ],
    status: "approved" as const,
    created_by: "user-1",
    created_at: "2024-01-01T00:00:00Z",
  },
};

describe("StrategyCard", () => {
  it("renders strategy title and description", () => {
    render(
      <StrategyCard
        assignment={baseAssignment}
        hotspots={[]}
        onVote={vi.fn()}
        onClick={vi.fn()}
      />
    );

    expect(screen.getByText("Test Strategy")).toBeInTheDocument();
    expect(
      screen.getByText("A test strategy description")
    ).toBeInTheDocument();
  });

  it("renders the username", () => {
    render(
      <StrategyCard
        assignment={baseAssignment}
        hotspots={[]}
        username="PlayerOne"
        onVote={vi.fn()}
        onClick={vi.fn()}
      />
    );

    expect(screen.getByText("PlayerOne")).toBeInTheDocument();
  });

  it('renders "Unknown" when no username', () => {
    render(
      <StrategyCard
        assignment={baseAssignment}
        hotspots={[]}
        onVote={vi.fn()}
        onClick={vi.fn()}
      />
    );

    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });

  it("shows image count when > 1", () => {
    const assignmentWithMultipleImages = {
      ...baseAssignment,
      strategy: {
        ...baseAssignment.strategy!,
        images: [
          ...baseAssignment.strategy!.images,
          {
            id: "img-2",
            strategy_id: "strat-1",
            image_url: "https://example.com/thumb2.png",
            sort_order: 2,
            caption: null,
            created_at: "2024-01-01T00:00:00Z",
          },
        ],
      },
    };

    render(
      <StrategyCard
        assignment={assignmentWithMultipleImages}
        hotspots={[]}
        onVote={vi.fn()}
        onClick={vi.fn()}
      />
    );

    expect(screen.getByText("2 images")).toBeInTheDocument();
  });

  it("calls onClick when card is clicked", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(
      <StrategyCard
        assignment={baseAssignment}
        hotspots={[]}
        onVote={vi.fn()}
        onClick={onClick}
      />
    );

    // Click the card container (the outer div with cursor-pointer)
    const card = screen.getByText("Test Strategy").closest('[class*="cursor-pointer"]');
    if (card) {
      await user.click(card);
      expect(onClick).toHaveBeenCalledTimes(1);
    }
  });

  it('renders "Strategy removed" when strategy is null', () => {
    const removedAssignment = {
      ...baseAssignment,
      strategy: null,
    };

    render(
      <StrategyCard
        assignment={removedAssignment}
        hotspots={[]}
        onVote={vi.fn()}
        onClick={vi.fn()}
      />
    );

    expect(screen.getByText("Strategy removed")).toBeInTheDocument();
    expect(
      screen.getByText("This strategy is no longer available.")
    ).toBeInTheDocument();
  });

  it("renders thumbnail image", () => {
    render(
      <StrategyCard
        assignment={baseAssignment}
        hotspots={[]}
        onVote={vi.fn()}
        onClick={vi.fn()}
      />
    );

    const img = screen.getByRole("img", { name: /test strategy/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/thumb.png");
  });

  it("renders placeholder when no thumbnail", () => {
    const noImageAssignment = {
      ...baseAssignment,
      strategy: {
        ...baseAssignment.strategy!,
        image_url: "",
        images: [],
      },
    };

    render(
      <StrategyCard
        assignment={noImageAssignment}
        hotspots={[]}
        onVote={vi.fn()}
        onClick={vi.fn()}
      />
    );

    // Placeholder icon should be an SVG
    const placeholderSvg = document.querySelector(
      '[class*="rounded-lg"] svg'
    );
    expect(placeholderSvg).toBeInTheDocument();
  });
});
