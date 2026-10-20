import { create } from 'zustand';
import type { UiTarget } from './useUiStore';

/** Something the app is doing that takes a while: analysing a sheet, reading a map, importing. */
export interface Activity {
  id: string;
  /** full name in the list, e.g. "Arkusz NMT 6.123.asc" */
  label: string;
  /** name on the chip when it is the only task, e.g. "Arkusz NMT" */
  short: string;
  /** 0–1, null when it cannot be measured */
  share: number | null;
  /** what it is doing now */
  step: string | null;
  cancel: (() => void) | null;
  /** where it is shown in full */
  open: UiTarget | null;
  startedAt: number;
}

export type ActivitySpec = Pick<Activity, 'id' | 'label' | 'short'> &
  Partial<Pick<Activity, 'share' | 'step' | 'cancel' | 'open'>>;

interface ActivityState {
  tasks: Activity[];
  /** starts a task, or changes the fields of the one with this id */
  upsert: (spec: ActivitySpec, now?: number) => void;
  update: (id: string, patch: Partial<Omit<Activity, 'id' | 'startedAt'>>) => void;
  end: (id: string) => void;
}

/** Long tasks of the whole app, shown by the chip in the top bar (features write, app reads). */
export const useActivityStore = create<ActivityState>()((set) => ({
  tasks: [],
  upsert: (spec, now = Date.now()) =>
    set((s) => {
      const old = s.tasks.find((t) => t.id === spec.id);
      if (old) return { tasks: s.tasks.map((t) => (t.id === spec.id ? { ...t, ...spec } : t)) };
      const task: Activity = {
        share: null,
        step: null,
        cancel: null,
        open: null,
        ...spec,
        startedAt: now,
      };
      return { tasks: [...s.tasks, task] };
    }),
  update: (id, patch) =>
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
  end: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
}));
