import { create } from 'zustand';

export type AppMode = 'field' | 'analysis';
export type SheetId = 'tracks' | 'points' | 'addPoint' | 'layers' | 'data';

interface UiState {
  mode: AppMode;
  activeSheet: SheetId | null;
  setMode: (mode: AppMode) => void;
  openSheet: (sheet: SheetId) => void;
  closeSheet: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  mode: 'field',
  activeSheet: null,
  setMode: (mode) => set({ mode, activeSheet: null }),
  openSheet: (sheet) => set((s) => ({ activeSheet: s.activeSheet === sheet ? null : sheet })),
  closeSheet: () => set({ activeSheet: null }),
}));
