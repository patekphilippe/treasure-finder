import type { Bounds } from '@/shared/store/useMapViewStore';
import { useMembership } from '@/shared/store/useMembership';
import { useContextStore } from '../store/useContextStore';
import { mergeCommunity } from '../utils/mergeCommunity';
import { communityApi } from './communityApi';

/** the backend answers for at most 1° × 1°; a wider view is cut to its middle */
const MAX_DEG = 1;

const clip = (b: Bounds): Bounds => {
  const cy = (b.north + b.south) / 2;
  const cx = (b.east + b.west) / 2;
  const hy = Math.min(MAX_DEG, b.north - b.south) / 2 - 1e-6;
  const hx = Math.min(MAX_DEG, b.east - b.west) / 2 - 1e-6;
  return { south: cy - hy, north: cy + hy, west: cx - hx, east: cx + hx };
};

/** Brings the shared base of the view into the local context objects; returns how many are in it. */
export async function syncCommunity(view: Bounds): Promise<number> {
  if (!useMembership.getState().email) return 0;
  const area = clip(view);
  const remote = await communityApi.objects(area);
  const store = useContextStore.getState();
  const { put, remove } = mergeCommunity(store.features, remote, area);
  if (put.length) await store.add(put);
  for (const id of remove) await store.remove(id);
  return remote.length;
}
