// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PoliteWmsLayer } from '@/features/map/layers/PoliteWmsLayer';

/** jsdom loads no images: each src assignment fails or succeeds per the script. */
function scriptImages(outcomes: Record<string, boolean[]>) {
  const stats = { requested: [] as string[], inFlight: 0, peak: 0 };
  Object.defineProperty(HTMLImageElement.prototype, 'src', {
    configurable: true,
    set(this: HTMLImageElement, value: string) {
      stats.requested.push(value);
      stats.peak = Math.max(stats.peak, ++stats.inFlight);
      const base = value.replace(/&_retry=\d+$/, '');
      const ok = outcomes[base]?.shift() ?? true;
      setTimeout(() => {
        stats.inFlight--;
        this.dispatchEvent(new Event(ok ? 'load' : 'error'));
      }, 10);
    },
  });
  return stats;
}

function makeTile(layer: PoliteWmsLayer, url: string) {
  vi.spyOn(layer, 'getTileUrl').mockReturnValue(url);
  const done = vi.fn();
  const img = layer.createTile({ x: 0, y: 0, z: 0 } as never, done);
  document.body.append(img);
  return done;
}

describe('PoliteWmsLayer', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('retries a tile the server refused and reports success', async () => {
    const { requested } = scriptImages({ 'https://a.example/wms?t=1': [false, false, true] });
    const layer = new PoliteWmsLayer('https://a.example/wms', { layers: '1', maxParallel: 3 });
    const done = makeTile(layer, 'https://a.example/wms?t=1');
    await vi.runAllTimersAsync();
    expect(requested).toEqual([
      'https://a.example/wms?t=1',
      'https://a.example/wms?t=1&_retry=1',
      'https://a.example/wms?t=1&_retry=2',
    ]);
    expect(done).toHaveBeenCalledWith(undefined, expect.any(HTMLImageElement));
  });

  it('gives up after the last retry with an error', async () => {
    scriptImages({ 'https://b.example/wms?t=1': [false, false, false, false] });
    const layer = new PoliteWmsLayer('https://b.example/wms', { layers: '1' });
    const done = makeTile(layer, 'https://b.example/wms?t=1');
    await vi.runAllTimersAsync();
    expect(done).toHaveBeenCalledWith(expect.any(Error), expect.any(HTMLImageElement));
  });

  it('frees the queue slot when Leaflet aborts a tile by replacing its handlers', async () => {
    const stats = { sets: 0 };
    Object.defineProperty(HTMLImageElement.prototype, 'src', {
      configurable: true,
      set(this: HTMLImageElement) {
        stats.sets++;
        // what L.TileLayer._abortLoading does on zoom: handlers replaced, no load ever arrives
        this.onload = () => {};
        this.onerror = () => {};
      },
    });
    const layer = new PoliteWmsLayer('https://d.example/wms', { layers: '1', maxParallel: 1 });
    for (let i = 0; i < 2; i++) {
      vi.spyOn(layer, 'getTileUrl').mockReturnValue(`https://d.example/wms?t=${i}`);
      document.body.append(layer.createTile({ x: i, y: 0, z: 0 } as never, () => {}));
    }
    await vi.advanceTimersByTimeAsync(31_000);
    // the second tile got its turn after the first one timed out
    expect(stats.sets).toBeGreaterThanOrEqual(2);
  });

  it('keeps at most maxParallel requests to one host in flight', async () => {
    const stats = scriptImages({});
    const layer = new PoliteWmsLayer('https://c.example/wms', { layers: '1', maxParallel: 3 });
    for (let i = 0; i < 10; i++) {
      vi.spyOn(layer, 'getTileUrl').mockReturnValue(`https://c.example/wms?t=${i}`);
      document.body.append(layer.createTile({ x: i, y: 0, z: 0 } as never, () => {}));
    }
    await vi.runAllTimersAsync();
    expect(stats.peak).toBe(3);
    expect(stats.requested).toHaveLength(10);
  });
});
