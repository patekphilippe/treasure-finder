import { createId } from '@/shared/lib/createId';
import type { CustomLayer } from '@/shared/types/domain';

export type ValidationResult = { ok: true; layer: CustomLayer } | { ok: false; error: string };

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** Checks user input / stored JSON and fills defaults. */
export function validateCustomLayer(input: unknown): ValidationResult {
  if (!isObject(input)) return { ok: false, error: 'Nieprawidłowe dane warstwy' };
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const url = typeof input.url === 'string' ? input.url.trim() : '';
  const kind = input.kind;

  if (!name) return { ok: false, error: 'Podaj nazwę warstwy' };
  if (kind !== 'xyz' && kind !== 'wms') return { ok: false, error: 'Wybierz rodzaj: XYZ lub WMS' };
  if (!/^https?:\/\/\S+$/i.test(url))
    return { ok: false, error: 'Adres musi zaczynać się od https://' };
  if (kind === 'xyz' && !(url.includes('{z}') && url.includes('{x}') && url.includes('{y}'))) {
    return { ok: false, error: 'Adres XYZ musi zawierać {z}, {x} i {y}' };
  }
  const layers = typeof input.layers === 'string' ? input.layers.trim() : '';
  if (kind === 'wms' && !layers)
    return { ok: false, error: 'Podaj nazwę warstwy WMS (parametr LAYERS)' };

  const zoom = Number(input.maxNativeZoom);
  const opacity = Number(input.opacity);
  return {
    ok: true,
    layer: {
      id: typeof input.id === 'string' && input.id ? input.id : createId(),
      name,
      kind,
      url,
      ...(kind === 'wms' && { layers }),
      maxNativeZoom: Number.isInteger(zoom) && zoom >= 0 && zoom <= 22 ? zoom : 19,
      opacity: Number.isFinite(opacity) && opacity > 0 && opacity <= 1 ? opacity : 1,
      on: typeof input.on === 'boolean' ? input.on : true,
    },
  };
}
