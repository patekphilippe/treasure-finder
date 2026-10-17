import { describe, expect, it } from 'vitest';
import { finishTrack } from '@/features/tracks/utils/finishTrack';
import { resumeTrack } from '@/features/tracks/utils/resumeTrack';
import { makeTrack } from '../../helpers/fixtures';

describe('resumeTrack', () => {
  it('opens a new segment after a non-empty one', () => {
    const t = resumeTrack(makeTrack({ segments: [[[52, 19, 0, 5]]] }));
    expect(t.segments).toEqual([[[52, 19, 0, 5]], []]);
  });

  it('reuses a trailing empty segment', () => {
    const track = makeTrack({ segments: [[[52, 19, 0, 5]], []] });
    expect(resumeTrack(track).segments).toHaveLength(2);
  });
});

describe('finishTrack', () => {
  it('marks the track inactive, sets end and drops empty segments', () => {
    const t = finishTrack(makeTrack({ active: true, segments: [[[52, 19, 0, 5]], []] }), 99);
    expect(t).toMatchObject({ active: false, end: 99 });
    expect(t.segments).toHaveLength(1);
  });
});
