"use client";

// Relay brand logo — mark R singola o lockup (mark + scritta).
// Decisione placement (davinci review 2026-08-05):
//   mark  = icona: auth card, legal/settings back bar, lobby header, not-found
//   lockup = brand completo: landing hero (unico posto con spazio)
//
// mark: SVG inline, fill currentColor → colorabile via text-primary/text-foreground
// lockup: <img> dell'asset statico (font Anta è inline nel file, non duplicabile)

interface RelayLogoProps {
  variant?: "mark" | "lockup";
  className?: string;
  ariaLabel?: string;
}

const MARK_PATH =
  "M8 6h48v16H8zM8 22h14v36H8zM44 22h12v22H44zM22 50l22-6 14 14H22z";

export function RelayMark({
  className = "size-6",
  ariaLabel = "Relay",
}: Pick<RelayLogoProps, "className" | "ariaLabel">) {
  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      className={className}
      viewBox="0 0 64 64"
      fill="currentColor"
    >
      <path d={MARK_PATH} />
    </svg>
  );
}

export function RelayLogo({
  variant = "mark",
  className = "size-6",
  ariaLabel = "Relay",
}: RelayLogoProps) {
  if (variant === "lockup") {
    return (
      // Asset statico con font Anta inline; alt = accessibilità (niente aria-label doppio)
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/logo/relay-lockup.svg"
        alt={ariaLabel}
        className={className}
      />
    );
  }
  return <RelayMark className={className} ariaLabel={ariaLabel} />;
}

export default RelayLogo;
