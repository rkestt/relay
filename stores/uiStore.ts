import { create } from "zustand";

interface UIState {
  rightPanelOpen: boolean;
  toggleRightPanel: () => void;
  setRightPanelOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  rightPanelOpen: true,
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
}));
