import type { PointStatus, PointType } from '@/shared/types/domain';

export interface PointTypeMeta {
  label: string;
  /** Line Awesome icon name */
  icon: string;
  color: string;
}

export const POINT_TYPES: Record<PointType, PointTypeMeta> = {
  anomalia: { label: 'Anomalia', icon: 'wave-square', color: '#8b5cf6' },
  sprawdzic: { label: 'Do sprawdzenia', icon: 'search', color: '#06b6d4' },
  znalezisko: { label: 'Znalezisko', icon: 'gem', color: '#eab308' },
  niewybuch: { label: 'Niewybuch', icon: 'bomb', color: '#dc2626' },
  inne: { label: 'Inne', icon: 'map-pin', color: '#64748b' },
};

export const POINT_TYPE_ORDER: readonly PointType[] = [
  'anomalia',
  'sprawdzic',
  'znalezisko',
  'niewybuch',
  'inne',
];

export const POINT_STATUS_LABELS: Record<PointStatus, string> = {
  do_sprawdzenia: 'Do sprawdzenia',
  pusto: 'Pusto',
  znalezisko: 'Znalezisko',
  chroniony: 'Chroniony',
  odrzucony: 'Odrzucony',
};
