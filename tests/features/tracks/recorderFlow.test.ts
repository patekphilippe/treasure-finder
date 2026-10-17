import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { trackRecorder } from '@/features/tracks';
import { tracksRepo } from '@/shared/db';
import { useFieldStore } from '@/shared/store/useFieldStore';
import { clearDb } from '../../helpers/clearDb';

const M = 1 / 111_195; // ~1 m of latitude
const move = (metres: number, accM = 5) =>
  useFieldStore.getState().setPosition({ lat: 52 + metres * M, lng: 19, accM, t: Date.now() });

describe('track recording flow', () => {
  beforeEach(async () => {
    await clearDb();
    useFieldStore.getState().setPosition(null);
  });
  afterEach(() => trackRecorder.detach());

  it('records fixes, filters bad ones and saves on flush', async () => {
    const track = await trackRecorder.start();
    move(0);
    move(1); // < 2 m → skipped
    move(10);
    move(20, 50); // > 30 m accuracy → skipped
    move(25);
    await trackRecorder.flush();

    const saved = await tracksRepo.get(track.id);
    expect(saved?.active).toBe(true);
    expect(saved?.segments[0]).toHaveLength(3);
    expect(saved?.distM).toBeCloseTo(25, 0);
    expect(useFieldStore.getState().recordingTrackId).toBe(track.id);
  });

  it('resumes after a reload as a new segment', async () => {
    const track = await trackRecorder.start();
    move(0);
    move(10);
    await trackRecorder.flush();

    trackRecorder.detach(); // simulates closing the page
    expect(useFieldStore.getState().recordingTrackId).toBeNull();

    const resumed = await trackRecorder.resume();
    expect(resumed?.id).toBe(track.id);
    move(200);
    move(210);
    await trackRecorder.flush();

    const saved = await tracksRepo.get(track.id);
    expect(saved?.segments).toHaveLength(2);
    expect(saved?.segments[1]).toHaveLength(2);
    // gap between segments is not counted
    expect(saved?.distM).toBeCloseTo(20, 0);
  });

  it('stop finishes the track and resume finds nothing', async () => {
    const track = await trackRecorder.start();
    move(0);
    await trackRecorder.stop();

    const saved = await tracksRepo.get(track.id);
    expect(saved).toMatchObject({ active: false });
    expect(saved?.end).not.toBeNull();
    expect(await trackRecorder.resume()).toBeNull();
  });
});
