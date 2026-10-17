import { create } from 'zustand';

interface ToastState {
  message: string | null;
  /** bumps on every show() so the same message can be shown twice */
  key: number;
  show: (message: string) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  key: 0,
  show: (message) => set((s) => ({ message, key: s.key + 1 })),
  hide: () => set({ message: null }),
}));
