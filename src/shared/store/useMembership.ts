import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface MembershipState {
  /** address of the signed-in member (Auth0); kept only in this browser, never exported */
  email: string | null;
  name: string | null;
  /** an admin: the account sheet links to the owner's panel */
  owner: boolean;
  join: (email: string, name: string, owner: boolean) => void;
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
      owner: false,
      join: (email, name, owner) => set({ email, name, owner }),
      leave: () => set({ email: null, name: null, owner: false }),
    }),
    {
      name: 'mapa.member',
      storage: createJSONStorage(() => localStorage),
      // version 0 kept an invitation code, which the backend no longer accepts: sign in again
      version: 1,
      migrate: () => ({ email: null, name: null, owner: false }),
    },
  ),
);
