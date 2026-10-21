import type { Position } from 'geojson';
import { useMembership } from '@/shared/store/useMembership';
import type { OwnMap } from '@/shared/types/domain';
import { useToastStore } from '@/shared/ui';
import { useContextStore } from '../store/useContextStore';
import { mapPointMover } from '../utils/mapPointMover';
import { movedWithMap } from '../utils/movedWithMap';
import { communityApi } from './communityApi';

/** the server takes this many moves at once */
const MOVES_PER_CALL = 1000;

/**
 * A map read before was placed anew: the objects seen only on it move with it, here and, for the
 * member's own shared objects, in the shared base (else the next sync would put them back).
 * Returns how many moved.
 */
export async function moveObjectsWithMap(before: OwnMap, after: OwnMap): Promise<number> {
  const move = mapPointMover(before, after);
  if (!move) return 0;
  const moved = movedWithMap(useContextStore.getState().features, after.id, move);
  if (!moved.length) return 0;
  await useContextStore.getState().add(moved);
  const shared = moved
    .filter((f) => f.community?.mineAuthor && f.geometry.type === 'Point')
    .map((f) => {
      const [lng, lat] = (f.geometry as { coordinates: Position }).coordinates;
      return { id: f.community!.id, lat: lat!, lng: lng! };
    });
  if (shared.length && useMembership.getState().email)
    try {
      for (let i = 0; i < shared.length; i += MOVES_PER_CALL)
        await communityApi.move(shared.slice(i, i + MOVES_PER_CALL));
    } catch (e) {
      useToastStore
        .getState()
        .show(
          `Wspólna baza nie przyjęła nowych położeń: ${e instanceof Error ? e.message : 'błąd'}`,
        );
    }
  return moved.length;
}
