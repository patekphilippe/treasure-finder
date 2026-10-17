import type { PointStatus, PointType } from '@/shared/types/domain';

export type Raw = Record<string, unknown>;

export const isRecord = (v: unknown): v is Raw =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v)
    ? v
    : typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))
      ? Number(v)
      : null;

export const str = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));

export const isLatLng = (lat: number | null, lng: number | null): boolean =>
  lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

export const POINT_TYPE_VALUES: readonly PointType[] = [
  'anomalia',
  'sprawdzic',
  'znalezisko',
  'niewybuch',
  'inne',
];

export const POINT_STATUS_VALUES: readonly PointStatus[] = [
  'do_sprawdzenia',
  'pusto',
  'znalezisko',
  'chroniony',
  'odrzucony',
];
