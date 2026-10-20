import type { SourceObject } from './sources';

/** Kinds the shared base holds: the sources' kinds and the military ones from military maps. */
export type CommunityKind = SourceObject['kind'] | 'wojsko' | 'grob_wojenny';

/** One object of the members-only shared base (server/, docs/BACKEND.md, "Społeczność"). */
export interface CommunityObject {
  id: string;
  kind: CommunityKind;
  label: string;
  lat: number;
  lng: number;
  radiusM: number;
  source: string;
  /** member's name; null for approved submissions and objects from the old public packs */
  author: string | null;
  /** the asking member added it (may remove it) */
  mineAuthor: boolean;
  createdAt: number;
  /** confirmations and disputes */
  up: number;
  down: number;
  /** the asking member's vote */
  mine: -1 | 0 | 1;
}

export interface NewCommunityObject {
  kind: CommunityKind;
  label: string;
  lat: number;
  lng: number;
  radiusM?: number;
  source: string;
}

export interface Member {
  name: string;
  /** the address the member was invited with and signs in with */
  email: string | null;
  /** an admin (ADMIN_EMAILS): the owner's panel under #admin */
  owner: boolean;
}

/** Owner's panel: one member. */
export interface AdminMember {
  id: string;
  name: string;
  /** invitation address; null for members from the invitation-code days until the owner adds one */
  email: string | null;
  /** has signed in with the address at least once */
  linked: boolean;
  blocked: boolean;
  createdAt: number;
  lastSeenDay: string | null;
  objects: number;
  votes: number;
}

/** Owner's panel: one object with the notes of its disputes. */
export interface AdminCommunityObject extends Omit<CommunityObject, 'mine' | 'mineAuthor'> {
  removedAt: number | null;
  notes: string[];
}

/** Disputed objects do not count in the NMT candidates' score and are shown grey. */
export const isDisputed = (o: { up: number; down: number }) => o.down - o.up >= 2;
