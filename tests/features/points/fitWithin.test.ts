import { describe, expect, it } from 'vitest';
import { fitWithin } from '@/features/points/utils/fitWithin';

describe('fitWithin', () => {
  it('scales landscape photos by the width', () => {
    expect(fitWithin(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 });
  });

  it('scales portrait photos by the height', () => {
    expect(fitWithin(3000, 4000, 1600)).toEqual({ width: 1200, height: 1600 });
  });

  it('never enlarges small photos', () => {
    expect(fitWithin(800, 600, 1600)).toEqual({ width: 800, height: 600 });
  });
});
