import type { ContextKind } from '@/shared/types/domain';
import { clusterPoints } from './clusterPoints';
import { existsToday } from './existsToday';
import { siteTitle } from './siteTitle';
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
  /**
   * coarser than this (metres per pixel, e.g. a 1:100 000 sheet) a farmstead of one or two
   * houses is mostly a misread symbol: only hamlets and villages are kept
   */
  coarseResM: number;
  /** only what is gone today, even a mill or manor farm (1:100 000: nearly every village has a Gut) */
  onlyLost?: boolean;
}

/**
 * how far (image pixels) the model's position of a symbol may be off: today's building is looked
 * for at least this far, else a church amid today's village reads as gone (at 8 m a pixel the
 * 25 m buffer was less than the error)
 */
export const READ_ERROR_PX = 15;

/** sites of fewer houses are dropped on a coarse map */
const COARSE_MIN_BUILDINGS = 3;
/** places worth a look even with a building there today: their surroundings hold the finds */
const KEPT_STANDING: ReadonlySet<ReadKind> = new Set(['mlyn', 'karczma', 'folwark', 'brod']);

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
/** the read kinds that become places (not houses) */
export const POI_KINDS: ReadonlySet<ReadKind> = new Set(Object.keys(POI) as ReadKind[]);

/**
 * Objects read from a historical map → proposals for archival context. Buildings count only when
 * today's BDOT10k has nothing there; they are grouped into a farmstead, hamlet or village (on a
 * coarse map only hamlets and villages). A mill, inn, manor farm or ford is proposed gone or not;
 * the other places (church, forester's lodge, smithy…) only when gone: one still standing in
 * today's village is nothing to look for.
 */
export function buildProposals(
  objects: readonly MapObject<ReadKind>[],
  mask: Uint8Array,
  g: ImageGrid,
  o: ProposalOptions,
): SiteProposal[] {
  const ok = objects.filter((x) => x.confidence >= o.minConfidence);
  const buffer = Math.max(o.bufferM, g.res * READ_ERROR_PX);
  const at = (x: number, y: number) => ({ e: g.originE + x * g.res, n: g.originN - y * g.res });
  const lostBuildings = ok.filter(
    (x) => x.kind === 'budynek' && !existsToday(mask, g, x.x, x.y, buffer),
  );
  const minBuildings = g.res > o.coarseResM ? COARSE_MIN_BUILDINGS : 1;
  const groups = clusterPoints(lostBuildings, o.linkM / g.res).filter(
    (idx) => idx.length >= minBuildings,
  );
  const sites: SiteProposal[] = groups.map((idx) => {
    const pts = idx.map((i) => lostBuildings[i]!);
    const x = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const y = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    const n = pts.length;
    return {
      kind: n >= 3 ? 'osada' : 'inne',
      title: siteTitle(n),
      ...at(x, y),
      buildings: n,
      lost: true,
    };
  });
  const places: SiteProposal[] = ok
    .filter((x) => x.kind !== 'budynek' && POI[x.kind])
    .map((x) => ({ x, lost: !existsToday(mask, g, x.x, x.y, buffer) }))
    .filter(({ x, lost }) => lost || (!o.onlyLost && KEPT_STANDING.has(x.kind)))
    .map(({ x, lost }) => {
      const p = POI[x.kind]!;
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
