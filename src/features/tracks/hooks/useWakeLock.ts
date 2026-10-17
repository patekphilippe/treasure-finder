import { useEffect } from 'react';

/** Keeps the screen on while `enabled`; re-acquired when the page becomes visible again. */
export function useWakeLock(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const acquire = async () => {
      if (document.visibilityState !== 'visible' || sentinel) return;
      try {
        sentinel = await navigator.wakeLock.request('screen');
        if (cancelled) await sentinel.release();
        sentinel?.addEventListener('release', () => {
          sentinel = null;
        });
      } catch {
        // denied (e.g. battery saver) — recording works without it
      }
    };

    void acquire();
    document.addEventListener('visibilitychange', acquire);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', acquire);
      void sentinel?.release();
    };
  }, [enabled]);
}
