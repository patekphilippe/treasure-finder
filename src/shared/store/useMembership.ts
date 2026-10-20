import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface MembershipState {
  /** address of the signed-in member (Auth0); kept only in this browser, never exported */
  email: string | null;
  name: string | null;
  join: (email: string, name: string) => void;
  leave: () => void;
}

/**
 * Membership of the trusted community (backend, docs/BACKEND.md "Społeczność"): who is signed in.
 * The tokens themselves are kept by the Auth0 client (`shared/auth`).
 */
export const useMembership = create<MembershipState>()(
  persist(
    (set) => ({
      email: null,
      name: null,
      join: (email, name) => set({ email, name }),
      leave: () => set({ email: null, name: null }),
    }),
    {
      name: 'mapa.member',
      storage: createJSONStorage(() => localStorage),
      // version 0 kept an invitation code, which the backend no longer accepts: sign in again
      version: 1,
      migrate: () => ({ email: null, name: null }),
    },
  ),
);
