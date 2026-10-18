import { create } from 'zustand';
import { mapsRepo } from '@/shared/db';
import { fitHomography, type Homography } from '@/shared/lib/georef';
import type { XY } from '@/shared/lib/tiles';
import type { OwnMap } from '@/shared/types/domain';
import { mapCorners2180 } from '../services/importOwnMap';

interface Fitting {
  id: string;
  /** the map as it was, for "Anuluj" */
  before: OwnMap;
}

interface OwnMapsState {
  maps: OwnMap[];
  fitting: Fitting | null;
  load: () => Promise<void>;
  add: (map: OwnMap) => Promise<void>;
  update: (id: string, patch: Partial<OwnMap>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  /** drag the four corners on the map (any map: it is converted to PUWG 1992 corners) */
  startFit: (id: string) => void;
  /** live while dragging, saved on finishFit */
  moveCorner: (index: number, at: XY) => void;
  finishFit: () => Promise<void>;
  cancelFit: () => void;
}

const imageCorners = (m: OwnMap) => [
  { x: 0, y: 0 },
  { x: m.width, y: 0 },
  { x: m.width, y: m.height },
  { x: 0, y: m.height },
];

export const useOwnMapsStore = create<OwnMapsState>()((set, get) => ({
  maps: [],
  fitting: null,
  load: async () => set({ maps: await mapsRepo.getAll() }),
  add: async (map) => {
    await mapsRepo.put(map);
    set({ maps: [...get().maps.filter((m) => m.id !== map.id), map] });
  },
  update: async (id, patch) => {
    const map = get().maps.find((m) => m.id === id);
    if (!map) return;
    await get().add({ ...map, ...patch });
  },
  remove: async (id) => {
    await mapsRepo.remove(id);
    set({ maps: get().maps.filter((m) => m.id !== id), fitting: null });
  },
  startFit: (id) => {
    const map = get().maps.find((m) => m.id === id);
    if (!map) return;
    const at = mapCorners2180(map);
    const fitted: OwnMap = {
      ...map,
      visible: true,
      epsg: 2180,
      method: 'corners',
      pixelToSource: [...fitHomography(imageCorners(map), at)],
    };
    set({ fitting: { id, before: map }, maps: get().maps.map((m) => (m.id === id ? fitted : m)) });
  },
  moveCorner: (index, at) => {
    const { fitting, maps } = get();
    const map = fitting && maps.find((m) => m.id === fitting.id);
    if (!map) return;
    const dst = mapCorners2180(map);
    dst[index] = at;
    let h: Homography;
    try {
      h = fitHomography(imageCorners(map), dst);
    } catch {
      return; // three corners in a line: keep the last good fit
    }
    set({ maps: maps.map((m) => (m.id === map.id ? { ...m, pixelToSource: [...h] } : m)) });
  },
  finishFit: async () => {
    const { fitting, maps } = get();
    const map = fitting && maps.find((m) => m.id === fitting.id);
    set({ fitting: null });
    if (map) await mapsRepo.put(map);
  },
  cancelFit: () => {
    const { fitting, maps } = get();
    if (!fitting) return;
    set({ fitting: null, maps: maps.map((m) => (m.id === fitting.id ? fitting.before : m)) });
  },
}));
