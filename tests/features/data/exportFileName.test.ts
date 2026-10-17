import { describe, expect, it } from 'vitest';
import { exportFileName } from '@/features/data/utils/exportFileName';

describe('exportFileName', () => {
  it('uses the local date', () => {
    expect(exportFileName(new Date(2026, 0, 5, 23, 59).getTime())).toBe(
      'poszukiwania-2026-01-05.zip',
    );
  });
});
