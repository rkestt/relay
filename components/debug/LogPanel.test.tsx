import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LogPanel } from "@/components/debug/LogPanel";
import { logger } from "@/lib/logger";

// jsdom does not implement scrollIntoView
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const mockLogs = [
  {
    id: "1",
    timestamp: Date.now(),
    level: "info" as const,
    tag: "test",
    message: "Test info message",
    data: { key: "value" },
  },
  {
    id: "2",
    timestamp: Date.now(),
    level: "warn" as const,
    tag: "auth",
    message: "Test warning",
  },
  {
    id: "3",
    timestamp: Date.now(),
    level: "error" as const,
    tag: "db",
    message: "Test error",
    error: {
      message: "DB connection failed",
      name: "DatabaseError",
    },
  },
];

beforeEach(() => {
  vi.mocked(logger.getLogs).mockReturnValue(mockLogs);
});

describe("LogPanel", () => {
  it("renders LOG button when closed", () => {
    render(<LogPanel />);
    expect(screen.getByRole("button", { name: /log/i })).toBeInTheDocument();
  });

  it("opens panel when LOG button is clicked", async () => {
    const user = userEvent.setup();
    render(<LogPanel />);

    await user.click(screen.getByRole("button", { name: /log/i }));

    // Panel shows log entries
    expect(screen.getByText("DEBUG LOGS")).toBeInTheDocument();
    expect(screen.getByText("Test info message")).toBeInTheDocument();
    expect(screen.getByText("Test warning")).toBeInTheDocument();
    expect(screen.getByText("Test error")).toBeInTheDocument();
  });

  it("opens panel and shows log count", async () => {
    const user = userEvent.setup();
    render(<LogPanel />);

    await user.click(screen.getByRole("button", { name: /log/i }));

    // Shows filtered/total count
    expect(screen.getByText("3/3")).toBeInTheDocument();
  });

  it("filters logs by level", async () => {
    const user = userEvent.setup();
    render(<LogPanel />);

    await user.click(screen.getByRole("button", { name: /log/i }));

    // Change filter to "error"
    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "error");

    // Only error log visible
    expect(screen.getByText("Test error")).toBeInTheDocument();
    expect(screen.queryByText("Test info message")).not.toBeInTheDocument();
    expect(screen.queryByText("Test warning")).not.toBeInTheDocument();
  });

  it("filters logs by search text", async () => {
    const user = userEvent.setup();
    render(<LogPanel />);

    await user.click(screen.getByRole("button", { name: /log/i }));

    const searchInput = screen.getByPlaceholderText("cerca...");
    await user.type(searchInput, "warning");

    expect(screen.getByText("Test warning")).toBeInTheDocument();
    expect(screen.queryByText("Test info message")).not.toBeInTheDocument();
    expect(screen.queryByText("Test error")).not.toBeInTheDocument();
  });

  it("shows empty state when no logs match filter", async () => {
    const user = userEvent.setup();
    render(<LogPanel />);

    await user.click(screen.getByRole("button", { name: /log/i }));

    const searchInput = screen.getByPlaceholderText("cerca...");
    await user.type(searchInput, "nonexistent");

    expect(screen.getByText("Nessun log")).toBeInTheDocument();
  });

  it("closes panel when X button is clicked", async () => {
    const user = userEvent.setup();
    render(<LogPanel />);

    await user.click(screen.getByRole("button", { name: /log/i }));
    expect(screen.getByText("DEBUG LOGS")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "X" }));
    expect(screen.queryByText("DEBUG LOGS")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log/i })).toBeInTheDocument();
  });

  it("calls logger.clear when CLR button is clicked", async () => {
    const user = userEvent.setup();
    render(<LogPanel />);

    await user.click(screen.getByRole("button", { name: /log/i }));

    await user.click(screen.getByRole("button", { name: /clr/i }));
    expect(logger.clear).toHaveBeenCalledTimes(1);
  });
});
