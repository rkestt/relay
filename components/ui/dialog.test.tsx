import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

describe("Dialog", () => {
  it("does not render content when closed (defaultOpen false)", () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    expect(screen.queryByText("Title")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open/i })).toBeInTheDocument();
  });

  it("renders content when open (controlled)", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Visible</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText("Visible")).toBeInTheDocument();
  });

  it("opens on trigger click when uncontrolled", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Content</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    await user.click(screen.getByRole("button", { name: /open/i }));
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("calls onOpenChange when backdrop is clicked", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle>Content</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    // Click the backdrop (outer div)
    const backdrop = screen.getByText("Content").parentElement?.parentElement;
    if (backdrop) {
      await user.click(backdrop);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    }
  });

  it("closes on Escape keypress", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle>Content</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("DialogClose button closes the dialog", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle>Content</DialogTitle>
          <DialogClose>Close</DialogClose>
        </DialogContent>
      </Dialog>
    );

    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("renders DialogDescription", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogDescription>Description text</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText("Description text")).toBeInTheDocument();
  });

  it("defaults DialogClose text to 'Close'", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogClose />
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
  });
});
