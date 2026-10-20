import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface MembershipState {
  /** invitation code of the trusted community; kept only in this browser, never exported */
  code: string | null;
  name: string | null;
  join: (code: string, name: string) => void;
  leave: () => void;
}

/** Membership of the trusted community (backend, docs/BACKEND.md "Społeczność"). */
export const useMembership = create<MembershipState>()(
  persist(
    (set) => ({
      code: null,
      name: null,
      join: (code, name) => set({ code, name }),
      leave: () => set({ code: null, name: null }),
    }),
    { name: 'mapa.member', storage: createJSONStorage(() => localStorage) },
  ),
);
