import { describe, expect, it } from 'vitest';
import { cornersFromFrame } from '@/features/history/utils/cornersFromFrame';

describe('image corners from the snapped frame', () => {
  it('extends the frame fitted in degrees to the whole image', () => {
    const frame = [
      { x: 100, y: 100 },
      { x: 900, y: 100 },
      { x: 900, y: 700 },
      { x: 100, y: 700 },
    ];
    const at = [
      { lat: 52.5, lng: 16.5 },
      { lat: 52.5, lng: 17 },
      { lat: 52.25, lng: 17 },
      { lat: 52.25, lng: 16.5 },
    ];
    const [nw, , se] = cornersFromFrame(frame, at, 1000, 800);
    // 800 px for 0.5° of longitude, 600 px for 0.25° of latitude
    expect(nw!.lng).toBeCloseTo(16.5 - 0.0625, 9);
    expect(nw!.lat).toBeCloseTo(52.5 + 0.25 / 6, 9);
    expect(se!.lng).toBeCloseTo(17 + 0.0625, 9);
    expect(se!.lat).toBeCloseTo(52.25 - 0.25 / 6, 9);
  });
});
