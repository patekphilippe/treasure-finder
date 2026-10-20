import type { NewCommunityObject } from '@/shared/types/community';
import type { ContextFeature } from '@/shared/types/domain';
import { CONTEXT_KINDS } from '../config/contextKinds';
import { representativePoint } from './representativePoint';

/** A local context object as a point for the shared base (lines and areas by their middle). */
export function toNewCommunityObject(f: ContextFeature): NewCommunityObject | null {
  const at = representativePoint(f.geometry);
  if (!at) return null;
  return {
    kind: f.kind,
    label: CONTEXT_KINDS[f.kind].label,
    lat: at.lat,
    lng: at.lng,
    source: f.source,
  };
}
