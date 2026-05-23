import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OfflineBanner } from "@/components/ui/OfflineBanner";

describe("OfflineBanner", () => {
  it("renders nothing when status is connected", () => {
    render(<OfflineBanner status="connected" />);
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
    // The banner renders as a sticky div, not role="banner"
    // Just verify no text is shown
    expect(screen.queryByText(/live updates/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/server/i)).not.toBeInTheDocument();
  });

  it("renders disconnected message", () => {
    render(<OfflineBanner status="disconnected" />);
    expect(
      screen.getByText(/live updates paused/i)
    ).toBeInTheDocument();
  });

  it("renders custom disconnected message", () => {
    render(
      <OfflineBanner status="disconnected" message="Custom message" />
    );
    expect(screen.getByText("Custom message")).toBeInTheDocument();
  });

  it("renders error status message", () => {
    render(<OfflineBanner status="error" />);
    expect(screen.getByText(/server unavailable/i)).toBeInTheDocument();
  });

  it("renders custom error message", () => {
    render(<OfflineBanner status="error" message="Connection lost" />);
    expect(screen.getByText("Connection lost")).toBeInTheDocument();
  });

  it("renders dismiss button when onDismiss is provided", () => {
    render(
      <OfflineBanner status="disconnected" onDismiss={vi.fn()} />
    );
    expect(screen.getByLabelText("Dismiss")).toBeInTheDocument();
  });

  it("does not render dismiss button when onDismiss is not provided", () => {
    render(<OfflineBanner status="disconnected" />);
    expect(screen.queryByLabelText("Dismiss")).not.toBeInTheDocument();
  });

  it("dismisses the banner and calls onDismiss", async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();

    render(
      <OfflineBanner status="disconnected" onDismiss={onDismiss} />
    );

    await user.click(screen.getByLabelText("Dismiss"));

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByText(/live updates paused/i)
    ).not.toBeInTheDocument();
  });
});
