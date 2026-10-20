import type { CommunityObject } from '@/shared/types/community';
import type { Bounds } from '@/shared/store/useMapViewStore';
import type { ContextFeature } from '@/shared/types/domain';

const inside = (f: ContextFeature, b: Bounds) => {
  if (f.geometry.type !== 'Point') return false;
  const [lng, lat] = f.geometry.coordinates as [number, number];
  return lat >= b.south && lat <= b.north && lng >= b.west && lng <= b.east;
};

/**
 * The shared base for one area merged into the local context objects:
 * - a known object (by community id) gets the current votes;
 * - an object new here becomes a local context object;
 * - an object gone from the base disappears, except the member's own one, which stays private.
 */
export function mergeCommunity(
  local: readonly ContextFeature[],
  remote: readonly CommunityObject[],
  area: Bounds,
): { put: ContextFeature[]; remove: string[] } {
  const byCommunity = new Map(local.filter((f) => f.community).map((f) => [f.community!.id, f]));
  const seen = new Set(remote.map((r) => r.id));
  const put: ContextFeature[] = [];
  for (const r of remote) {
    const link = {
      id: r.id,
      author: r.author,
      mineAuthor: r.mineAuthor,
      up: r.up,
      down: r.down,
      mine: r.mine,
    };
    const known = byCommunity.get(r.id);
    if (known) {
      const old = known.community!;
      if (old.up !== r.up || old.down !== r.down || old.mine !== r.mine || old.author !== r.author)
        put.push({ ...known, community: link });
      continue;
    }
    put.push({
      id: `wspolna-${r.id}`,
      kind: r.kind,
      geometry: { type: 'Point', coordinates: [r.lng, r.lat] },
      source: [`Społeczność: ${r.author ?? 'zatwierdzone źródło'}`, r.label, r.source]
        .filter(Boolean)
        .join(' · '),
      community: link,
    });
  }
  const remove: string[] = [];
  for (const f of local) {
    if (!f.community || seen.has(f.community.id) || !inside(f, area)) continue;
    if (f.community.mineAuthor) put.push({ ...f, community: undefined });
    else remove.push(f.id);
  }
  return { put, remove };
}
