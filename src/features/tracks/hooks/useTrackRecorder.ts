import { useEffect } from 'react';
import { useFieldStore } from '@/shared/store/useFieldStore';
import { trackRecorder } from '../services/trackRecorder';
import { useTracksStore } from '../store/useTracksStore';
import { useWakeLock } from './useWakeLock';

/** App-level: loads tracks, resumes an interrupted recording and holds the wake lock. */
export function useTrackRecorder(): void {
  const recording = useFieldStore((s) => s.recordingTrackId !== null);

  useEffect(() => {
    void useTracksStore
      .getState()
      .load()
      .then(() => trackRecorder.resume());
  }, []);

  useWakeLock(recording);
}
