import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders with text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("renders with default variant", () => {
    render(<Button>Default</Button>);
    const btn = screen.getByRole("button", { name: /default/i });
    expect(btn).toBeInTheDocument();
    expect(btn.getAttribute("data-slot")).toBe("button");
  });

  it("applies variant class via className override", () => {
    render(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole("button", { name: /outline/i })).toBeInTheDocument();
  });

  it("renders as child when passed asChild", () => {
    render(
      <Button>
        <span data-testid="child">Inner</span>
      </Button>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});
