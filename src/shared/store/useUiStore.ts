import { create } from 'zustand';

export type AppMode = 'field' | 'analysis';
export type SheetId = 'tracks' | 'points' | 'addPoint' | 'pointDetails' | 'layers' | 'data';

interface UiState {
  mode: AppMode;
  activeSheet: SheetId | null;
  /** point shown in the details sheet / being edited */
  selectedPointId: string | null;
  setMode: (mode: AppMode) => void;
  /** Dock behaviour: tapping the open sheet's button closes it. */
  toggleSheet: (sheet: SheetId) => void;
  showSheet: (sheet: SheetId) => void;
  showPoint: (id: string) => void;
  closeSheet: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  mode: 'field',
  activeSheet: null,
  selectedPointId: null,
  setMode: (mode) => set({ mode, activeSheet: null }),
  toggleSheet: (sheet) => set((s) => ({ activeSheet: s.activeSheet === sheet ? null : sheet })),
  showSheet: (sheet) => set({ activeSheet: sheet }),
  showPoint: (id) => set({ activeSheet: 'pointDetails', selectedPointId: id }),
  closeSheet: () => set({ activeSheet: null }),
}));
