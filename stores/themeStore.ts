import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";

type ResolvedTheme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  systemTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setSystemTheme: (theme: ResolvedTheme) => void;
}

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const resolveTheme = (theme: Theme, systemTheme: ResolvedTheme): ResolvedTheme => {
  if (theme === "system") return systemTheme;
  return theme;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      resolvedTheme: "dark",
      systemTheme: "dark",
      setTheme: (theme) => {
        const resolved = resolveTheme(theme, get().systemTheme);
        set({ theme, resolvedTheme: resolved });
        applyTheme(resolved);
      },
      toggleTheme: () => {
        const themes: Theme[] = ["light", "dark", "system"];
        const currentIndex = themes.indexOf(get().theme);
        const nextTheme = themes[(currentIndex + 1) % themes.length];
        const resolved = resolveTheme(nextTheme, get().systemTheme);
        set({ theme: nextTheme, resolvedTheme: resolved });
        applyTheme(resolved);
      },
      setSystemTheme: (systemTheme) => {
        const resolved = resolveTheme(get().theme, systemTheme);
        set({ systemTheme, resolvedTheme: resolved });
        if (get().theme === "system") {
          applyTheme(resolved);
        }
      },
    }),
    {
      name: "relay_theme",
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const systemTheme = getSystemTheme();
          const resolved = resolveTheme(state.theme, systemTheme);
          state.systemTheme = systemTheme;
          state.resolvedTheme = resolved;
          applyTheme(resolved);
        }
      },
    }
  )
);

export const applyTheme = (theme: ResolvedTheme) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.classList.remove("light", "dark");
  root.classList.add(theme);
};

export const initializeTheme = () => {
  if (typeof window === "undefined") return;
  const store = useThemeStore.getState();
  const systemTheme = getSystemTheme();
  const resolved = resolveTheme(store.theme, systemTheme);
  store.setSystemTheme(systemTheme);
  applyTheme(resolved);

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = (e: MediaQueryListEvent) => {
    const newSystemTheme: ResolvedTheme = e.matches ? "dark" : "light";
    store.setSystemTheme(newSystemTheme);
  };

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", handleChange);
  } else {
    mediaQuery.addListener(handleChange);
  }
};
