import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MapViewer, type Hotspot } from "@/components/maps/MapViewer";

describe("MapViewer", () => {
  const imageUrl = "https://example.com/map.png";

  it("renders the map image", () => {
    render(<MapViewer imageUrl={imageUrl} />);
    const img = screen.getByAltText("Map");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", imageUrl);
  });

  it("renders hotspots", () => {
    const hotspots: Hotspot[] = [
      { x_percent: 50, y_percent: 50, label: "A" },
      { x_percent: 20, y_percent: 80, label: "B" },
    ];

    render(<MapViewer imageUrl={imageUrl} hotspots={hotspots} />);

    // Hotspot labels rendered as SVG text
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("shows edit mode hint when editable", () => {
    render(<MapViewer imageUrl={imageUrl} editable />);
    expect(
      screen.getByText("Tap map to place hotspot")
    ).toBeInTheDocument();
  });

  it("does not show edit hint when not editable", () => {
    render(<MapViewer imageUrl={imageUrl} />);
    expect(
      screen.queryByText("Tap map to place hotspot")
    ).not.toBeInTheDocument();
  });

  it("calls onPlaceHotspot when clicking in edit mode", () => {
    const onPlaceHotspot = vi.fn();

    render(
      <MapViewer
        imageUrl={imageUrl}
        editable
        onPlaceHotspot={onPlaceHotspot}
      />
    );

    const img = screen.getByAltText("Map");
    const container = img.parentElement!;

    // Mock getBoundingClientRect so the calculation produces known values
    Object.defineProperty(container, "getBoundingClientRect", {
      value: () => ({
        width: 800,
        height: 450,
        top: 0,
        left: 0,
        bottom: 450,
        right: 800,
        x: 0,
        y: 0,
        toJSON: () => null,
      }),
      configurable: true,
    });

    // Click at position (400, 225) relative to viewport = 50%, 50%
    fireEvent.click(container, { clientX: 400, clientY: 225 });

    expect(onPlaceHotspot).toHaveBeenCalledTimes(1);
    expect(onPlaceHotspot).toHaveBeenCalledWith(50, 50);
  });

  it("does not call onPlaceHotspot when not editable", () => {
    const onPlaceHotspot = vi.fn();

    render(
      <MapViewer
        imageUrl={imageUrl}
        onPlaceHotspot={onPlaceHotspot}
      />
    );

    const img = screen.getByAltText("Map");
    const container = img.parentElement!;

    fireEvent.click(container);
    expect(onPlaceHotspot).not.toHaveBeenCalled();
  });
});
