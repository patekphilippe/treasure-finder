import { describe, expect, it } from 'vitest';
import { validateCustomLayer } from '@/features/layers/utils/validateCustomLayer';

const xyz = { name: 'Mapa 1965', kind: 'xyz', url: 'https://tiles.example.pl/{z}/{x}/{y}.png' };
const wms = { name: 'BDOT', kind: 'wms', url: 'https://wms.example.pl/service', layers: 'bdot' };

describe('validateCustomLayer', () => {
  it('accepts an XYZ layer and fills defaults', () => {
    const r = validateCustomLayer(xyz);
    expect(r.ok && r.layer).toMatchObject({ ...xyz, maxNativeZoom: 19, opacity: 1, on: true });
    expect(r.ok && r.layer.id).toBeTruthy();
  });

  it('accepts a WMS layer with LAYERS', () => {
    expect(validateCustomLayer(wms).ok).toBe(true);
  });

  it.each([
    [{ ...xyz, name: ' ' }, 'nazwę'],
    [{ ...xyz, kind: 'tms' }, 'rodzaj'],
    [{ ...xyz, url: 'ftp://x/{z}/{x}/{y}' }, 'https'],
    [{ ...xyz, url: 'https://tiles.example.pl/tile.png' }, '{z}'],
    [{ ...wms, layers: '' }, 'LAYERS'],
  ])('rejects invalid input %#', (input, fragment) => {
    const r = validateCustomLayer(input);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toContain(fragment);
  });

  it('clamps out-of-range zoom and opacity to defaults', () => {
    const r = validateCustomLayer({ ...xyz, maxNativeZoom: 40, opacity: 3 });
    expect(r.ok && r.layer).toMatchObject({ maxNativeZoom: 19, opacity: 1 });
  });

  it('keeps an existing id', () => {
    const r = validateCustomLayer({ ...xyz, id: 'abc' });
    expect(r.ok && r.layer.id).toBe('abc');
  });
});
