import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RelayLogo, RelayMark } from "@/components/ui/RelayLogo";

// Nota: usa renderToStaticMarkup (server) invece di @testing-library/react
// perché RTL 16.3 + React 19.2.4 attuale rompe React.act in jsdom (pre-esistente).

describe("RelayLogo", () => {
  it("renders mark variant as inline SVG", () => {
    const html = renderToStaticMarkup(<RelayLogo variant="mark" />);
    expect(html).toContain("<svg");
    expect(html).toContain('viewBox="0 0 64 64"');
    expect(html).toContain('aria-label="Relay"');
    expect(html).toContain("M8 6h48v16H8z");
    expect(html).toContain("<path");
  });

  it("renders custom aria-label", () => {
    const html = renderToStaticMarkup(<RelayMark ariaLabel="Relay R" />);
    expect(html).toContain('aria-label="Relay R"');
  });

  it("applies className to mark svg", () => {
    const html = renderToStaticMarkup(
      <RelayLogo className="size-8 text-primary" />,
    );
    expect(html).toContain('class="size-8 text-primary"');
  });

  it("renders lockup variant as img pointing to static asset", () => {
    const html = renderToStaticMarkup(<RelayLogo variant="lockup" />);
    expect(html).toContain("<img");
    expect(html).toContain('src="/logo/relay-lockup.svg"');
    expect(html).toContain('alt="Relay"');
  });
});
