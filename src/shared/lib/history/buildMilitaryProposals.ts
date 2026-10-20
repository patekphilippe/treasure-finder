import type { ContextKind } from '@/shared/types/domain';
import type { SiteProposal } from './buildProposals';
import type { ImageGrid, MapObject, ReadKind } from './types';

const MILITARY: Partial<Record<ReadKind, { kind: ContextKind; label: string }>> = {
  linia_frontu: { kind: 'wojsko', label: 'Linia frontu' },
  okopy: { kind: 'wojsko', label: 'Okopy' },
  stanowisko: { kind: 'wojsko', label: 'Stanowisko ogniowe' },
  dowodzenie: { kind: 'wojsko', label: 'Punkt dowodzenia' },
  przeprawa: { kind: 'wojsko', label: 'Przeprawa' },
  pole_minowe: { kind: 'wojsko', label: 'Pole minowe lub zapora' },
  mogila: { kind: 'grob_wojenny', label: 'Mogiła wojenna' },
  inne: { kind: 'wojsko', label: 'Obiekt wojskowy' },
};

/**
 * Objects read from a military map → proposals: positions, trenches and lines become `wojsko`
 * (UXO warning near them), graves `grob_wojenny` (protection next to them). No comparison
 * with today's buildings: what matters is where the fighting was, not what stands there now.
 */
export function buildMilitaryProposals(
  objects: readonly MapObject<ReadKind>[],
  g: ImageGrid,
  minConfidence: number,
): SiteProposal[] {
  const at = (x: number, y: number): [number, number] => [
    g.originE + x * g.res,
    g.originN - y * g.res,
  ];
  return (
    objects
      .filter((o) => o.confidence >= minConfidence && MILITARY[o.kind])
      .map((o) => {
        const m = MILITARY[o.kind]!;
        const [e, n] = at(o.x, o.y);
        return {
          kind: m.kind,
          title: `${m.label}${o.label ? `: ${o.label}` : ''}`,
          e,
          n,
          buildings: 0,
          lost: false,
          ...(o.line ? { line: o.line.map((p) => at(p.x, p.y)) } : {}),
        };
      })
      // graves first: they are what must not be disturbed
      .sort((a, b) => Number(b.kind === 'grob_wojenny') - Number(a.kind === 'grob_wojenny'))
  );
}
