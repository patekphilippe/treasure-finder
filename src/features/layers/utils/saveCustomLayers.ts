import type { CustomLayer } from '@/shared/types/domain';
import { CUSTOM_LAYERS_KEY } from '../config/storage';

export function saveCustomLayers(
  layers: readonly CustomLayer[],
  storage: Pick<Storage, 'setItem'> | undefined,
): void {
  try {
    storage?.setItem(CUSTOM_LAYERS_KEY, JSON.stringify(layers));
  } catch {
    // storage full or blocked (private mode) — layers stay for this session
  }
}
