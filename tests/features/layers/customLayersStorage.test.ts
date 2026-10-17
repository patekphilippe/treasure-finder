import { describe, expect, it } from 'vitest';
import { CUSTOM_LAYERS_KEY } from '@/features/layers/config/storage';
import { loadCustomLayers } from '@/features/layers/utils/loadCustomLayers';
import { saveCustomLayers } from '@/features/layers/utils/saveCustomLayers';
import type { CustomLayer } from '@/shared/types/domain';

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  };
}

const layer: CustomLayer = {
  id: 'l1',
  name: 'Mapa WIG',
  kind: 'xyz',
  url: 'https://tiles.example.pl/{z}/{x}/{y}.png',
  maxNativeZoom: 16,
  opacity: 0.7,
  on: false,
};

describe('custom layers storage', () => {
  it('round-trips layers', () => {
    const storage = memoryStorage();
    saveCustomLayers([layer], storage);
    expect(loadCustomLayers(storage)).toEqual([layer]);
  });

  it('returns an empty list for corrupted JSON', () => {
    const storage = memoryStorage();
    storage.setItem(CUSTOM_LAYERS_KEY, '{not json');
    expect(loadCustomLayers(storage)).toEqual([]);
  });

  it('skips invalid entries', () => {
    const storage = memoryStorage();
    storage.setItem(CUSTOM_LAYERS_KEY, JSON.stringify([layer, { name: 'x' }]));
    expect(loadCustomLayers(storage)).toEqual([layer]);
  });

  it('works without storage', () => {
    expect(loadCustomLayers(undefined)).toEqual([]);
  });
});
