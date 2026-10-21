import type { SharedMap } from '@/shared/types/community';
import type { OwnMap } from '@/shared/types/domain';
import { sharedOf } from './sharedOf';

export interface MapSyncPlan {
  /** on the server, not here: download the scan */
  download: SharedMap[];
  /** changed on the server since (another device, the author): new placement, year, reading */
  update: { id: string; patch: Partial<OwnMap> }[];
  /** shared once, gone from the server: removed by its author */
  remove: string[];
  /** here only (added before maps were shared, or the upload failed): send to the community */
  upload: string[];
}

/** What to do with the own maps here after listing the community's maps. */
export function planMapSync(local: readonly OwnMap[], remote: readonly SharedMap[]): MapSyncPlan {
  const here = new Map(local.map((m) => [m.id, m]));
  const there = new Set(remote.map((r) => r.id));
  const plan: MapSyncPlan = { download: [], update: [], remove: [], upload: [] };
  for (const r of remote) {
    const m = here.get(r.id);
    if (!m) plan.download.push(r);
    else if (!m.shared || r.updatedAt > m.shared.updatedAt)
      plan.update.push({
        id: r.id,
        patch: {
          name: r.name,
          pixelToSource: r.pixelToSource,
          epsg: r.epsg,
          method: r.method,
          ...(r.year !== null && { year: r.year }),
          ...(r.readAt !== null && { readAt: r.readAt }),
          shared: sharedOf(r),
        },
      });
  }
  for (const m of local) if (!there.has(m.id)) (m.shared ? plan.remove : plan.upload).push(m.id);
  return plan;
}
