"use client";

import { useEffect } from "react";
import { useThemeStore, initializeTheme } from "@/stores/themeStore";
import { cn } from "@/lib/utils";
import { Sun, Moon, Monitor } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const iconSize = {
  sm: 16,
  md: 20,
  lg: 24,
};

const themeIcons = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const themeLabels = {
  light: "Light theme",
  dark: "Dark theme",
  system: "System theme",
};

export function ThemeToggle({ className, size = "md" }: ThemeToggleProps) {
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    initializeTheme();
  }, []);

  const CurrentIcon = themeIcons[theme];
  const label = themeLabels[theme];

  const handleClick = () => {
    // Toggle: light → dark → system → light
    const order: Array<"light" | "dark" | "system"> = ["light", "dark", "system"];
    const currentIndex = order.indexOf(theme);
    const nextTheme = order[(currentIndex + 1) % order.length];
    setTheme(nextTheme);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Theme: ${label}. Click to switch.`}
      aria-pressed="false"
      title={label}
      className={cn(
        "inline-flex items-center justify-center rounded-full",
        "relative overflow-hidden",
        "bg-surface-container hover:bg-surface-container-high",
        "text-on-surface",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "transition-colors duration-fast ease-default",
        size === "sm" && "h-8 w-8",
        size === "md" && "h-10 w-10",
        size === "lg" && "h-12 w-12",
        className
      )}
    >
      <CurrentIcon
        size={iconSize[size]}
        className="transition-transform duration-fast ease-default"
      />
    </button>
  );
}

export default ThemeToggle;
