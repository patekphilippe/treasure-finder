import type { ContextKind } from '@/shared/types/domain';
import { pluralPl } from '../format';
import { clusterPoints } from './clusterPoints';
import { existsToday } from './existsToday';
import type { ImageGrid, MapObject, ReadKind } from './types';

export interface SiteProposal {
  kind: ContextKind;
  /** e.g. "Zaginiona wieś (7 budynków)", "Młyn: Wassermühle" */
  title: string;
  /** EPSG:2180 metres */
  e: number;
  n: number;
  buildings: number;
  /** nothing in today's BDOT10k there */
  lost: boolean;
  /** a line object (front line, trench): its points, EPSG:2180 metres */
  line?: [number, number][];
}

export interface ProposalOptions {
  /** reading position error absorbed when looking for today's building */
  bufferM: number;
  /** lost buildings closer than this form one site */
  linkM: number;
  /** below this a reading is ignored */
  minConfidence: number;
}

const POI: Partial<Record<ReadKind, { kind: ContextKind; label: string }>> = {
  mlyn: { kind: 'mlyn', label: 'Młyn' },
  karczma: { kind: 'karczma', label: 'Karczma' },
  folwark: { kind: 'osada', label: 'Folwark' },
  brod: { kind: 'brod', label: 'Bród' },
  lesniczowka: { kind: 'inne', label: 'Leśniczówka' },
  cegielnia: { kind: 'inne', label: 'Cegielnia' },
  kuznia: { kind: 'inne', label: 'Kuźnia' },
  kosciol: { kind: 'inne', label: 'Kościół lub kaplica' },
  huta: { kind: 'inne', label: 'Huta' },
  smolarnia: { kind: 'inne', label: 'Smolarnia' },
  inne: { kind: 'inne', label: 'Obiekt' },
};

/**
 * Objects read from a historical map → proposals for archival context. Buildings count only when
 * today's BDOT10k has nothing there; they are grouped into a farmstead, hamlet or village.
 * Named places (mill, inn, manor farm, ford…) are proposed each on their own, gone or not.
 */
export function buildProposals(
  objects: readonly MapObject<ReadKind>[],
  mask: Uint8Array,
  g: ImageGrid,
  o: ProposalOptions,
): SiteProposal[] {
  const ok = objects.filter((x) => x.confidence >= o.minConfidence);
  const at = (x: number, y: number) => ({ e: g.originE + x * g.res, n: g.originN - y * g.res });
  const lostBuildings = ok.filter(
    (x) => x.kind === 'budynek' && !existsToday(mask, g, x.x, x.y, o.bufferM),
  );
  const sites: SiteProposal[] = clusterPoints(lostBuildings, o.linkM / g.res).map((idx) => {
    const pts = idx.map((i) => lostBuildings[i]!);
    const x = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const y = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    const n = pts.length;
    const what = n >= 6 ? 'Zaginiona wieś' : n >= 3 ? 'Zaginiony przysiółek' : 'Zaginiona zagroda';
    return {
      kind: n >= 3 ? 'osada' : 'inne',
      title: `${what} (${pluralPl(n, 'budynek', 'budynki', 'budynków')})`,
      ...at(x, y),
      buildings: n,
      lost: true,
    };
  });
  const places: SiteProposal[] = ok
    .filter((x) => x.kind !== 'budynek' && POI[x.kind])
    .map((x) => {
      const p = POI[x.kind]!;
      const lost = !existsToday(mask, g, x.x, x.y, o.bufferM);
      return {
        kind: p.kind,
        title: `${p.label}${x.label ? `: ${x.label}` : ''}${lost ? ', dziś bez zabudowy' : ''}`,
        ...at(x.x, x.y),
        buildings: 0,
        lost,
      };
    });
  return [...places, ...sites.sort((a, b) => b.buildings - a.buildings)];
}
