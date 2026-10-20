import type { OwnMap } from '@/shared/types/domain';
import type { OwnMapEntry } from './backup';
import { isRecord, num, str } from './guards';

const METHODS: readonly OwnMap['method'][] = ['geotiff', 'worldfile', 'corners'];

/** An own map's entry from kopia.json, or null when it cannot be put on the map again. */
export function normalizeMapEntry(raw: unknown): OwnMapEntry | null {
  if (!isRecord(raw) || typeof raw.id !== 'string' || typeof raw.image !== 'string') return null;
  const width = num(raw.width);
  const height = num(raw.height);
  const epsg = num(raw.epsg);
  const h = Array.isArray(raw.pixelToSource) ? raw.pixelToSource.map(num) : [];
  if (!width || !height || !epsg || h.length !== 9 || h.some((v) => v === null)) return null;
  const method = METHODS.find((m) => m === raw.method) ?? 'corners';
  const year = num(raw.year);
  return {
    id: raw.id,
    name: str(raw.name) || 'Mapa',
    created: num(raw.created) ?? 0,
    image: raw.image,
    width,
    height,
    pixelToSource: h as number[],
    epsg,
    method,
    visible: raw.visible !== false,
    opacity: Math.min(1, Math.max(0, num(raw.opacity) ?? 0.8)),
    ...(year !== null && { year }),
  };
}
