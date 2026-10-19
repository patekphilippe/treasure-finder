import { clusterPoints } from '@/shared/lib/history/clusterPoints';
import type { MapObjectKind } from '@/shared/lib/history/types';
import type { SourceObject } from '@/shared/types/sources';
import { localPlane, type LatLng, type Placement } from './georef';
import type { Place } from './gazetteer';
import type { MapReading, TextItem } from './readings';

/** Buildings closer than this belong to one site (hamlet, village). */
const SITE_LINK_M = 80;
/** From this many buildings a site is a settlement, below it a farmstead. */
const SETTLEMENT_MIN = 3;

const NAMED: Record<
  Exclude<MapObjectKind, 'budynek'>,
  { kind: SourceObject['kind']; name: string }
> = {
  mlyn: { kind: 'mlyn', name: 'Młyn' },
  karczma: { kind: 'karczma', name: 'Karczma' },
  folwark: { kind: 'osada', name: 'Folwark' },
  lesniczowka: { kind: 'inne', name: 'Leśniczówka' },
  cegielnia: { kind: 'inne', name: 'Cegielnia' },
  kuznia: { kind: 'inne', name: 'Kuźnia' },
  kosciol: { kind: 'inne', name: 'Kościół lub kaplica' },
  huta: { kind: 'inne', name: 'Huta' },
  smolarnia: { kind: 'inne', name: 'Smolarnia' },
  brod: { kind: 'brod', name: 'Bród' },
  inne: { kind: 'inne', name: 'Obiekt historyczny' },
};

const placementReason = (p: Placement) =>
  p.method === 'arkusz'
    ? 'Położenie z numeru arkusza i narożników ramki (możliwy błąd do ok. 150 m)'
    : `Położenie z nazw miejscowości na mapie (dopasowanie z błędem ok. ${p.rmsM} m)`;

/** Map reading placed on today's map → proposed context objects. */
export function objectsFromMap(reading: MapReading, placement: Placement): SourceObject[] {
  const source = [reading.series !== 'nieznana' ? reading.series : 'mapa', reading.year]
    .filter(Boolean)
    .join(' ');
  const out: SourceObject[] = [];

  const buildings = reading.objects.filter((o) => o.kind === 'budynek');
  if (buildings.length) {
    const at = buildings.map((b) => placement.toLatLng(b));
    const plane = localPlane(at[0]!);
    for (const group of clusterPoints(
      at.map((p) => plane.toXY(p)),
      SITE_LINK_M,
    )) {
      const members = group.map((i) => at[i]!);
      const centre: LatLng = {
        lat: members.reduce((s, p) => s + p.lat, 0) / members.length,
        lng: members.reduce((s, p) => s + p.lng, 0) / members.length,
      };
      const n = members.length;
      out.push({
        kind: n >= SETTLEMENT_MIN ? 'osada' : 'inne',
        label:
          n >= SETTLEMENT_MIN
            ? `Zabudowa: ${n} budynków`
            : n === 1
              ? 'Pojedynczy budynek'
              : `Zagroda: ${n} budynki`,
        ...centre,
        radiusM: placement.uncertaintyM,
        confidence: Math.min(...group.map((i) => buildings[i]!.confidence)),
        reasons: [`Budynki na mapie (${source})`, placementReason(placement)],
      });
    }
  }

  for (const o of reading.objects) {
    if (o.kind === 'budynek') continue;
    const named = NAMED[o.kind];
    out.push({
      kind: named.kind,
      label: o.label ? `${named.name}: „${o.label}”` : named.name,
      ...placement.toLatLng(o),
      radiusM: placement.uncertaintyM,
      confidence: o.confidence,
      reasons: [
        o.label ? `Na mapie (${source}) napis „${o.label}”` : `Znak na mapie (${source})`,
        placementReason(placement),
      ],
    });
  }
  return out;
}

const BEARING: Record<TextItem['direction'], number | null> = {
  N: 0,
  NE: 45,
  E: 90,
  SE: 135,
  S: 180,
  SW: 225,
  W: 270,
  NW: 315,
  brak: null,
};

const DIRECTION_PL: Record<TextItem['direction'], string> = {
  N: 'północ',
  NE: 'północny wschód',
  E: 'wschód',
  SE: 'południowy wschód',
  S: 'południe',
  SW: 'południowy zachód',
  W: 'zachód',
  NW: 'północny zachód',
  brak: '',
};

/** A place described in text, located from its anchor (village, church…) found in the gazetteer. */
export function objectFromText(item: TextItem, anchor: Place): SourceObject {
  const bearing = BEARING[item.direction];
  let at: LatLng = { lat: anchor.lat, lng: anchor.lng };
  let radiusM = 1000;
  if (bearing !== null && item.distanceM) {
    const plane = localPlane(anchor);
    const rad = (bearing * Math.PI) / 180;
    at = plane.toLatLng(Math.sin(rad) * item.distanceM, Math.cos(rad) * item.distanceM);
    // a distance in a description is rarely better than a third of itself
    radiusM = Math.max(150, item.distanceM * 0.35);
  } else if (item.distanceM) {
    radiusM = Math.max(300, item.distanceM * 1.2);
  }
  return {
    kind: item.kind,
    label: item.label,
    ...at,
    radiusM: Math.round(radiusM),
    confidence: item.confidence,
    reasons: [
      `Z opisu: „${item.label}”`,
      bearing !== null && item.distanceM
        ? `Ok. ${Math.round(item.distanceM)} m na ${DIRECTION_PL[item.direction]} od: ${anchor.name}`
        : `W okolicy: ${anchor.name}`,
    ],
  };
}
