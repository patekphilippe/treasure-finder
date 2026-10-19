import { useEffect } from 'react';
import { PENDING, POLL_MS } from '../config/sourcesApi';
import { sourcesApi } from '../services/sourcesApi';
import { useSourcesStore } from '../store/useSourcesStore';

/** While mounted, refreshes analyses that may still change: now and every POLL_MS. */
export function usePollSources(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    const refresh = () => {
      const { sent, update } = useSourcesStore.getState();
      for (const s of sent) {
        if (s.view && !PENDING.includes(s.view.status)) continue;
        sourcesApi
          .get(s.id, s.accessKey)
          .then((view) => update(s.id, { view }))
          .catch(() => undefined);
      }
    };
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [enabled]);
}
