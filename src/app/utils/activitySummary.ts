import type { Activity } from '@/shared/store/useActivityStore';

export interface ActivitySummary {
  label: string;
  /** busy: something runs here; waiting: only the server works; ready: a result came */
  tone: 'busy' | 'waiting' | 'ready';
  /** share of the only running task, for a determinate ring */
  share: number | null;
}

const percent = (share: number) => `${Math.round(share * 100)}%`;

/**
 * What the activity chip says: the only running task with its percent ("Arkusz NMT 45%", on
 * a phone just "45%"), else how many run ("W toku: 2"), else results ready, else submissions
 * waiting on the server. Null when there is nothing to show.
 */
export function activitySummary(
  tasks: readonly Activity[],
  remote: { waiting: number; ready: number },
  compact: boolean,
): ActivitySummary | null {
  if (tasks.length === 1) {
    const t = tasks[0]!;
    const label =
      t.share === null ? t.short : compact ? percent(t.share) : `${t.short} ${percent(t.share)}`;
    return { label, tone: 'busy', share: t.share };
  }
  if (tasks.length > 1) return { label: `W toku: ${tasks.length}`, tone: 'busy', share: null };
  if (remote.ready > 0) return { label: `Gotowe: ${remote.ready}`, tone: 'ready', share: null };
  if (remote.waiting > 0)
    return {
      label: compact ? `Serwer: ${remote.waiting}` : `Na serwerze: ${remote.waiting}`,
      tone: 'waiting',
      share: null,
    };
  return null;
}
