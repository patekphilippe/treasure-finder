import { describe, expect, it } from 'vitest';
import { wms2180GridSource } from '@/features/map/utils/wms2180GridSource';
import { NMT_WMTS_2180 } from '@/shared/config/geoportalWmts2180';
import { pickSourceTiles } from '@/shared/lib/tiles';

const umwd = wms2180GridSource({
  url: 'https://geoportal.dolnyslask.pl/gpservices/UMWD_Messtischblat_starsze/MapServer/WMSServer',
  layers: '1',
  format: 'image/png8',
});
const param = (url: string, name: string) => new URL(url).searchParams.get(name);

describe('wms2180GridSource', () => {
  it('asks one fixed 512 px cell of the Geoportal grid, northing first (WMS 1.3.0)', () => {
    const url = umwd.tileUrl(10, 1000, 300);
    const span = 512 * NMT_WMTS_2180.resolutions[10]!;
    const e0 = 100_000 + 300 * span;
    const n1 = 850_000 - 1000 * span;
    expect(param(url, 'BBOX')).toBe(
      [n1 - span, e0, n1, e0 + span].map((v) => v.toFixed(2)).join(','),
    );
    expect(param(url, 'CRS')).toBe('EPSG:2180');
    expect(param(url, 'WIDTH')).toBe('512');
    expect(param(url, 'FORMAT')).toBe('image/png8');
    // the same cell is always the same address, so a seen tile is found again
    expect(umwd.tileUrl(10, 1000, 300)).toBe(url);
  });

  it('stops at ~1.3 m pixels: scans hold nothing finer', () => {
    expect(umwd.resolutions).toHaveLength(11);
    // a street-level map tile near Jelenia Góra still picks level 10
    const corners = [
      { x: 270_000, y: 330_000 },
      { x: 270_150, y: 330_000 },
      { x: 270_000, y: 329_850 },
      { x: 270_150, y: 329_850 },
    ] as const;
    expect(pickSourceTiles(corners, 256, 1.5, umwd)?.level).toBe(10);
  });
});
