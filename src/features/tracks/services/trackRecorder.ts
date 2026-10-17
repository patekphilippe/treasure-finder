import { acceptFix } from '@/features/gps';
import { tracksRepo } from '@/shared/db';
import { useFieldStore, type GpsFix } from '@/shared/store/useFieldStore';
import type { Track } from '@/shared/types/domain';
import { SAVE_INTERVAL_MS } from '../config/recording';
import { useTracksStore } from '../store/useTracksStore';
import { appendFix } from '../utils/appendFix';
import { createTrack } from '../utils/createTrack';
import { finishTrack } from '../utils/finishTrack';
import { resumeTrack } from '../utils/resumeTrack';

/**
 * Records the active track outside React so it survives sheet changes.
 * Saves every 8 s and whenever the page is hidden; after a reload the
 * active track is resumed in a new segment.
 */
let current: Track | null = null;
let lastFix: GpsFix | null = null;
let dirty = false;
let timer: ReturnType<typeof setInterval> | null = null;
let unsubscribe: (() => void) | null = null;

const onHidden = () => {
  if (document.visibilityState === 'hidden') void trackRecorder.flush();
};
const onPageHide = () => void trackRecorder.flush();

const publish = (track: Track | null) => {
  if (track) useTracksStore.getState().upsert(track);
  useFieldStore.getState().setRecordingTrackId(track?.id ?? null);
};

const onPosition = (fix: GpsFix | null) => {
  if (!current || !fix || !acceptFix(lastFix, fix)) return;
  lastFix = fix;
  current = appendFix(current, fix);
  dirty = true;
  useTracksStore.getState().upsert(current);
};

const attach = () => {
  unsubscribe = useFieldStore.subscribe((s, prev) => {
    if (s.position !== prev.position) onPosition(s.position);
  });
  timer = setInterval(() => void trackRecorder.flush(), SAVE_INTERVAL_MS);
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('pagehide', onPageHide);
  }
};

export const trackRecorder = {
  get current(): Track | null {
    return current;
  },

  async start(now = Date.now()): Promise<Track> {
    if (current) return current;
    current = createTrack(now);
    lastFix = null;
    await tracksRepo.put(current);
    publish(current);
    attach();
    onPosition(useFieldStore.getState().position);
    return current;
  },

  /** Continues a track left active by a previous session, if any. */
  async resume(): Promise<Track | null> {
    if (current) return current;
    const active = await tracksRepo.getActive();
    if (!active) return null;
    current = resumeTrack(active);
    lastFix = null;
    await tracksRepo.put(current);
    publish(current);
    attach();
    return current;
  },

  async flush(): Promise<void> {
    if (!current || !dirty) return;
    dirty = false;
    await tracksRepo.put(current);
  },

  async stop(now = Date.now()): Promise<Track | null> {
    if (!current) return null;
    const finished = finishTrack(current, now);
    trackRecorder.detach();
    await tracksRepo.put(finished);
    useTracksStore.getState().upsert(finished);
    return finished;
  },

  /** Drops listeners and in-memory state without finishing the track (like a page reload). */
  detach(): void {
    unsubscribe?.();
    unsubscribe = null;
    if (timer) clearInterval(timer);
    timer = null;
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('pagehide', onPageHide);
    }
    current = null;
    lastFix = null;
    dirty = false;
    publish(null);
  },
};
