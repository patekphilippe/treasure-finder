import { describe, expect, it } from 'vitest';
import { mergeRecords } from '@/shared/lib/io';

const newer = (a: { v: number }, b: { v: number }) => a.v > b.v;

describe('mergeRecords', () => {
  it('adds new, replaces older and keeps newer local records', () => {
    const r = mergeRecords(
      [
        { id: 'a', v: 1 },
        { id: 'b', v: 5 },
      ],
      [
        { id: 'a', v: 2 },
        { id: 'b', v: 3 },
        { id: 'c', v: 1 },
      ],
      newer,
    );
    expect(r.toWrite.map((x) => x.id)).toEqual(['a', 'c']);
    expect(r).toMatchObject({ added: 1, updated: 1, unchanged: 1 });
  });
});
