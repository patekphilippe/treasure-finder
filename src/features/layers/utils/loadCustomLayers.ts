import type { CustomLayer } from '@/shared/types/domain';
import { CUSTOM_LAYERS_KEY } from '../config/storage';
import { validateCustomLayer } from './validateCustomLayer';

/** Reads custom layers from storage, skipping anything invalid. Never throws. */
export function loadCustomLayers(storage: Pick<Storage, 'getItem'> | undefined): CustomLayer[] {
  try {
    const raw = storage?.getItem(CUSTOM_LAYERS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      const result = validateCustomLayer(item);
      return result.ok ? [result.layer] : [];
    });
  } catch {
    return [];
  }
}
