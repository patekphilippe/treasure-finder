import type { CommunityKind, CommunityObject, NewCommunityObject } from '@/shared/types/community';

/** as the CHECK in migrations/0004_community_military_kinds.sql */
export const KINDS: readonly CommunityKind[] = [
  'osada',
  'droga',
  'mlyn',
  'karczma',
  'brod',
  'inne',
  'wojsko',
  'grob_wojenny',
];
/** largest bbox one request may ask for (about 110 × 70 km) */
export const MAX_BBOX_DEG = 1;
/** objects one member may add, remove or vote on a day */
export const MEMBER_DAILY_WRITES = 300;
export const MAX_OBJECTS_PER_ANSWER = 2000;

/** A new object from the app or the panel, checked; null when it is not usable. */
export function cleanObject(raw: unknown): NewCommunityObject | null {
  const o = raw as Record<string, unknown> | null;
  const lat = Number(o?.lat);
  const lng = Number(o?.lng);
  if (!KINDS.includes(String(o?.kind) as CommunityKind)) return null;
  if (!(lat > 48 && lat < 56 && lng > 13 && lng < 25)) return null;
  return {
    kind: o!.kind as CommunityKind,
    label: String(o!.label ?? '').slice(0, 160),
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
    radiusM: Math.round(Math.max(10, Math.min(5000, Number(o!.radiusM) || 200))),
    source: String(o!.source ?? '').slice(0, 160),
  };
}

/** most objects moved at once: a whole map read by AI (a 1:100 000 sheet gives ~200) */
export const MAX_MOVES = 1000;

/** New positions of objects (a map placed better after it was read), checked; null when unusable. */
export function cleanMoves(raw: unknown): { id: string; lat: number; lng: number }[] | null {
  const list = (raw as { moves?: unknown } | null)?.moves;
  if (!Array.isArray(list) || !list.length || list.length > MAX_MOVES) return null;
  const moves = list.map((m: unknown) => {
    const o = m as Record<string, unknown> | null;
    const lat = Number(o?.lat);
    const lng = Number(o?.lng);
    const id = String(o?.id ?? '');
    if (!/^[A-Za-z0-9_-]{1,40}$/.test(id) || !(lat > 48 && lat < 56 && lng > 13 && lng < 25))
      return null;
    return { id, lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
  });
  return moves.every((m) => m !== null) ? moves : null;
}

/** `{ ids: [...] }` of objects to remove at once (a map's reading thrown away), or null. */
export function cleanRemovals(raw: unknown): string[] | null {
  const list = (raw as { ids?: unknown } | null)?.ids;
  if (!Array.isArray(list) || !list.length || list.length > MAX_MOVES) return null;
  const ids = list.map((id) => String(id ?? ''));
  return ids.every((id) => /^[A-Za-z0-9_-]{1,40}$/.test(id)) ? ids : null;
}

/** `s,w,n,e` → bbox, or null when malformed or larger than MAX_BBOX_DEG. */
export function parseBbox(text: string | null) {
  const v = (text ?? '').split(',').map(Number);
  if (v.length !== 4 || v.some((x) => !Number.isFinite(x))) return null;
  const [south, west, north, east] = v as [number, number, number, number];
  if (north <= south || east <= west) return null;
  if (north - south > MAX_BBOX_DEG || east - west > MAX_BBOX_DEG) return null;
  return { south, west, north, east };
}

export interface ObjectRow {
  id: string;
  kind: CommunityKind;
  label: string;
  lat: number;
  lng: number;
  radius_m: number;
  source: string;
  author_id: string | null;
  author: string | null;
  created_at: number;
  up: number;
  down: number;
  mine: number | null;
}

/** SELECT shared by the members' and the owner's lists: author name and vote counts. */
export const OBJECT_SELECT = `SELECT o.id, o.kind, o.label, o.lat, o.lng, o.radius_m, o.source, o.author_id,
    m.name AS author, o.created_at, o.removed_at,
    (SELECT count(*) FROM object_votes v WHERE v.object_id = o.id AND v.vote = 1) AS up,
    (SELECT count(*) FROM object_votes v WHERE v.object_id = o.id AND v.vote = -1) AS down`;

export function toCommunityObject(r: ObjectRow, memberId: string): CommunityObject {
  return {
    id: r.id,
    kind: r.kind,
    label: r.label,
    lat: r.lat,
    lng: r.lng,
    radiusM: r.radius_m,
    source: r.source,
    author: r.author,
    mineAuthor: r.author_id === memberId,
    createdAt: r.created_at,
    up: r.up,
    down: r.down,
    mine: (r.mine ?? 0) as -1 | 0 | 1,
  };
}
