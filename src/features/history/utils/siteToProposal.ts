import { createId } from '@/shared/lib/createId';
import { fromEpsg2180 } from '@/shared/lib/geo';
import type { SiteProposal } from '@/shared/lib/history';
import type { Proposal } from '../services/findLostBuildings';

/** A proposal in EPSG:2180 as the app shows it; `origin` opens its source, e.g. "auto (AI): Mapa". */
export function siteToProposal(p: SiteProposal, origin: string): Proposal {
  const [lat, lng] = fromEpsg2180(p.e, p.n);
  return {
    id: createId(),
    kind: p.kind,
    title: p.title,
    lat,
    lng,
    buildings: p.buildings,
    lost: p.lost,
    ...(p.line ? { line: p.line.map(([e, n]) => fromEpsg2180(e, n)) } : {}),
    source: `${origin}, ${p.title.charAt(0).toLowerCase()}${p.title.slice(1)}`,
  };
}
