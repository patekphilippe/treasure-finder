import { legacySightings, type KnownMap } from '@/shared/lib/history';
import type { ContextFeature, Sighting } from '@/shared/types/domain';

/**
 * The maps an object was seen on; an object from before `seen` existed has them read from its
 * description. Own maps are this device's: an object of another community member never matches
 * them, even when its map had the same name.
 */
export function sightingsOf(f: ContextFeature, known: readonly KnownMap[]): Sighting[] {
  if (f.seen) return f.seen;
  const others = f.community && !f.community.mineAuthor;
  return legacySightings(f.source, others ? known.filter((k) => k.ref.kind !== 'own') : known);
}
