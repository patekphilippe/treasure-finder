import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type AppMode = 'field' | 'analysis';
export type SheetId =
  | 'tracks'
  | 'points'
  | 'addPoint'
  | 'pointDetails'
  | 'layers'
  | 'data'
  | 'zones'
  | 'zoneDetails'
  | 'area'
  | 'history'
  | 'contextDetails'
  | 'sources';

/** where something is shown in full: a mode and, in Teren, a sheet */
export interface UiTarget {
  mode: AppMode;
  sheet?: SheetId;
}

interface UiState {
  mode: AppMode;
  activeSheet: SheetId | null;
  /** point shown in the details sheet / being edited */
  selectedPointId: string | null;
  selectedZoneId: string | null;
  selectedAreaId: string | null;
  selectedContextId: string | null;
  setMode: (mode: AppMode) => void;
  /** Dock behaviour: tapping the open sheet's button closes it. */
  toggleSheet: (sheet: SheetId) => void;
  showSheet: (sheet: SheetId) => void;
  showPoint: (id: string) => void;
  showZone: (id: string) => void;
  showArea: (id: string) => void;
  showContext: (id: string) => void;
  closeSheet: () => void;
  /** switches the mode (which closes sheets) and then opens the target's sheet */
  goTo: (target: UiTarget) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      mode: 'field',
      activeSheet: null,
      selectedPointId: null,
      selectedZoneId: null,
      selectedAreaId: null,
      selectedContextId: null,
      setMode: (mode) => set({ mode, activeSheet: null }),
      toggleSheet: (sheet) => set((s) => ({ activeSheet: s.activeSheet === sheet ? null : sheet })),
      showSheet: (sheet) => set({ activeSheet: sheet }),
      showPoint: (id) => set({ activeSheet: 'pointDetails', selectedPointId: id }),
      showZone: (id) => set({ activeSheet: 'zoneDetails', selectedZoneId: id }),
      showArea: (id) => set({ activeSheet: 'area', selectedAreaId: id }),
      showContext: (id) => set({ activeSheet: 'contextDetails', selectedContextId: id }),
      closeSheet: () => set({ activeSheet: null }),
      goTo: (target) => set({ mode: target.mode, activeSheet: target.sheet ?? null }),
    }),
    {
      // remember Teren / Kandydaci between visits (laptop reopens in Kandydaci)
      name: 'mapa.ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ mode: s.mode }),
    },
  ),
);
