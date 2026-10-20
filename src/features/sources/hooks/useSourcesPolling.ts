import { useEffect } from 'react';
import { useToastStore } from '@/shared/ui';
import { PENDING, POLL_MS } from '../config/sourcesApi';
import { sourcesApi } from '../services/sourcesApi';
import { useSourcesStore } from '../store/useSourcesStore';
import { becameReady } from '../utils/becameReady';

/**
 * App-wide: while any sent source may still change, checks it now, every POLL_MS and when the
 * app comes back to the screen. A new result is marked fresh and announced once.
 */
export function useSourcesPolling(): void {
  const pending = useSourcesStore((st) =>
    st.sent.some((s) => !s.view || PENDING.includes(s.view.status)),
  );
  useEffect(() => {
    if (!pending) return;
    const refresh = () => {
      for (const s of useSourcesStore.getState().sent) {
        if (s.view && !PENDING.includes(s.view.status)) continue;
        sourcesApi
          .get(s.id, s.accessKey)
          .then((view) => {
            const ready = becameReady(s.view?.status, view.status);
            useSourcesStore.getState().update(s.id, { view, ...(ready && { fresh: true }) });
            if (ready) useToastStore.getState().show(`Gotowy wynik: ${s.label}`);
          })
          .catch(() => undefined);
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [pending]);
}
