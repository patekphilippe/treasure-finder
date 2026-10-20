import { WAITING } from '../config/sourcesApi';
import { useSourcesStore } from '../store/useSourcesStore';

/** Sent sources for the activity chip: still on the server, and results not looked at yet. */
export function useSourcesActivity(): { waiting: number; ready: number } {
  const waiting = useSourcesStore(
    (st) => st.sent.filter((s) => !s.view || WAITING.includes(s.view.status)).length,
  );
  const ready = useSourcesStore((st) => st.sent.filter((s) => s.fresh).length);
  return { waiting, ready };
}
