import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VoteButtons } from "@/components/tasks/VoteButtons";

describe("VoteButtons", () => {
  it("renders the score", () => {
    render(<VoteButtons score={42} onVote={vi.fn()} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders negative scores", () => {
    render(<VoteButtons score={-5} onVote={vi.fn()} />);
    expect(screen.getByText("-5")).toBeInTheDocument();
  });

  it("calls onVote with 'up' when upvote is clicked", async () => {
    const onVote = vi.fn();
    const user = userEvent.setup();

    render(<VoteButtons score={0} onVote={onVote} />);
    await user.click(screen.getByRole("button", { name: /upvote/i }));

    expect(onVote).toHaveBeenCalledWith("up");
  });

  it("calls onVote with 'down' when downvote is clicked", async () => {
    const onVote = vi.fn();
    const user = userEvent.setup();

    render(<VoteButtons score={0} onVote={onVote} />);
    await user.click(screen.getByRole("button", { name: /downvote/i }));

    expect(onVote).toHaveBeenCalledWith("down");
  });

  it("toggles off upvote when already upvoted", async () => {
    const onVote = vi.fn();
    const user = userEvent.setup();

    render(<VoteButtons score={0} userVote="up" onVote={onVote} />);
    await user.click(screen.getByRole("button", { name: /upvote/i }));

    expect(onVote).toHaveBeenCalledWith(null);
  });

  it("toggles off downvote when already downvoted", async () => {
    const onVote = vi.fn();
    const user = userEvent.setup();

    render(<VoteButtons score={0} userVote="down" onVote={onVote} />);
    await user.click(screen.getByRole("button", { name: /downvote/i }));

    expect(onVote).toHaveBeenCalledWith(null);
  });

  it("renders in horizontal orientation", () => {
    render(
      <VoteButtons score={0} onVote={vi.fn()} orientation="horizontal" />
    );
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("renders with md size", () => {
    render(<VoteButtons score={0} onVote={vi.fn()} size="md" />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
