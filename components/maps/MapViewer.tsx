"use client";

import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

export interface Hotspot {
  x_percent: number;
  y_percent: number;
  label: string;
}

interface MapViewerProps {
  imageUrl: string;
  hotspots?: Hotspot[];
  editable?: boolean;
  onPlaceHotspot?: (x: number, y: number) => void;
}

export function MapViewer({
  imageUrl,
  hotspots = [],
  editable = false,
  onPlaceHotspot,
}: MapViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!editable || !onPlaceHotspot || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      // Clamp to [0, 100]
      onPlaceHotspot(
        Math.max(0, Math.min(100, x)),
        Math.max(0, Math.min(100, y))
      );
    },
    [editable, onPlaceHotspot]
  );

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className={cn(
        "relative w-full aspect-video overflow-hidden rounded-xl bg-neutral-800",
        editable && "cursor-crosshair"
      )}
    >
      {/* Map image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt="Map"
        className="w-full h-full object-contain select-none"
        draggable={false}
      />

      {/* SVG overlay for hotspots */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {hotspots.map((hotspot, i) => {
          const cx = hotspot.x_percent;
          const cy = hotspot.y_percent;
          return (
            <g key={i}>
              {/* Outer ring */}
              <circle
                cx={cx}
                cy={cy}
                r={3}
                fill="none"
                stroke="var(--foreground)"
                strokeOpacity="0.35"
                strokeWidth={0.8}
              />
              {/* Inner dot */}
              <circle
                cx={cx}
                cy={cy}
                r={1.2}
                fill="var(--foreground)"
                fillOpacity="0.9"
              />
              {/* Label */}
              {hotspot.label && (
                <text
                  x={cx + 1.5}
                  y={cy + 0.5}
                  fill="var(--foreground)"
                  fillOpacity="0.9"
                  fontSize={2.5}
                  fontFamily="var(--font-sans)"
                  paintOrder="stroke"
                  stroke="var(--background)"
                  strokeOpacity="0.7"
                  strokeWidth={0.3}
                >
                  {hotspot.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Edit mode: ghost marker for pending placement */}
      {editable && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <span className="text-[10px] text-neutral-500 font-medium">
            Tap map to place hotspot
          </span>
        </div>
      )}
    </div>
  );
}