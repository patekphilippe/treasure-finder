import type { FieldPoint, PointStatus, PointType } from '@/shared/types/domain';
import { isLatLng, isRecord, num, POINT_STATUS_VALUES, POINT_TYPE_VALUES, str } from './guards';

const SOURCES = ['gps', 'mapa', 'import', 'analiza'] as const;

/**
 * Accepts a point from kopia.json of version 1 (depth, acc, photo) or 2
 * (depthCm, accM, photoId). Missing status → do_sprawdzenia. Null if unusable.
 */
export function normalizePoint(raw: unknown): FieldPoint | null {
  if (!isRecord(raw)) return null;
  const id = str(raw.id);
  const lat = num(raw.lat);
  const lng = num(raw.lng);
  if (!id || !isLatLng(lat, lng)) return null;

  const type = POINT_TYPE_VALUES.includes(raw.type as PointType) ? (raw.type as PointType) : 'inne';
  const status = POINT_STATUS_VALUES.includes(raw.status as PointStatus)
    ? (raw.status as PointStatus)
    : 'do_sprawdzenia';
  const src = SOURCES.find((s) => s === raw.src) ?? 'import';
  const created = num(raw.created) ?? num(raw.updated) ?? 0;
  const photoId = str(raw.photoId ?? raw.photo) || null;
  const candidateId = str(raw.candidateId);

  return {
    id,
    type,
    status,
    name: str(raw.name),
    desc: str(raw.desc),
    depthCm: num(raw.depthCm ?? raw.depth),
    lat: lat as number,
    lng: lng as number,
    accM: num(raw.accM ?? raw.acc),
    src,
    ...(candidateId && { candidateId }),
    photoId,
    created,
    updated: num(raw.updated) ?? created,
  };
}
