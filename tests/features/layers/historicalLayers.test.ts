import { describe, expect, it } from 'vitest';
import { HISTORICAL_LAYERS, ORTHO_ARCHIVE_ID } from '@/features/layers/config/historicalLayers';
import { findHistoricalLayer } from '@/features/layers/utils/findHistoricalLayer';
import { historicalWmsParams } from '@/features/layers/utils/historicalWmsParams';

describe('historical layers', () => {
  it('has unique ids and proper Lower Silesia services', () => {
    const ids = HISTORICAL_LAYERS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const l of HISTORICAL_LAYERS.filter((x) => x.url.includes('dolnyslask'))) {
      expect(l.url).toContain(`/${l.id}/MapServer/WMSServer`);
      expect(l.attribution).toMatch(/^Źródło danych: /);
    }
  });

  it('finds a layer by id and ignores unknown or null ids', () => {
    expect(findHistoricalLayer('UMWD_Messtischblat_starsze')?.label).toContain('Messtischblatt');
    expect(findHistoricalLayer('nie-ma')).toBeUndefined();
    expect(findHistoricalLayer(null)).toBeUndefined();
  });

  it('adds a whole-year TIME range only for time-enabled layers', () => {
    const ortho = findHistoricalLayer(ORTHO_ARCHIVE_ID)!;
    expect(historicalWmsParams(ortho, 2004)).toEqual({ TIME: '2004-01-01/2004-12-31' });
    expect(historicalWmsParams(ortho, 1900)).toEqual({ TIME: '1995-01-01/1995-12-31' });
    expect(historicalWmsParams(findHistoricalLayer('UMWD_Messtischblat_nowsze')!, 2004)).toEqual({});
  });
});
