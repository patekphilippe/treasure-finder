import { create } from 'zustand';

/** a button on the toast, e.g. "Popraw narożniki" after a map was placed by itself */
export interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastState {
  message: string | null;
  action: ToastAction | null;
  /** bumps on every show() so the same message can be shown twice */
  key: number;
  show: (message: string, action?: ToastAction) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  action: null,
  key: 0,
  show: (message, action) => set((s) => ({ message, action: action ?? null, key: s.key + 1 })),
  hide: () => set({ message: null, action: null }),
}));
