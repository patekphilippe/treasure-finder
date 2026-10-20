import { useActivityStore, type Activity, type ActivitySpec } from './useActivityStore';

/**
 * Runs `fn` as a task on the activity chip: it shows while `fn` runs and ends however `fn` ends.
 * `fn` gets an updater for progress and step.
 */
export async function trackActivity<T>(
  spec: ActivitySpec,
  fn: (update: (patch: Partial<Pick<Activity, 'share' | 'step' | 'cancel'>>) => void) => Promise<T>,
): Promise<T> {
  const store = useActivityStore.getState();
  store.upsert(spec);
  try {
    return await fn((patch) => useActivityStore.getState().update(spec.id, patch));
  } finally {
    useActivityStore.getState().end(spec.id);
  }
}
