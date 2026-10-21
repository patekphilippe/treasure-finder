import { BACKEND_ENABLED } from '@/shared/config/backend';
import { trackActivity } from '@/shared/store/trackActivity';
import { useMembership } from '@/shared/store/useMembership';
import { useToastStore } from '@/shared/ui';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { planMapSync } from '../utils/planMapSync';
import { sharedToOwnMap } from '../utils/sharedToOwnMap';
import { shareMap } from './shareMap';
import { sharedMapsApi } from './sharedMapsApi';

let running: Promise<void> | null = null;

/**
 * Brings the community's maps here and this device's maps there: new ones downloaded (yours from
 * another device shown at once), changed ones updated, removed ones dropped, maps only here sent.
 * One run at a time.
 */
export function syncSharedMaps(): Promise<void> {
  running ??= run().finally(() => {
    running = null;
  });
  return running;
}

async function run(): Promise<void> {
  if (!BACKEND_ENABLED || !useMembership.getState().email) return;
  const store = useOwnMapsStore.getState();
  const plan = planMapSync(store.maps, await sharedMapsApi.list());
  for (const { id, patch } of plan.update) await store.update(id, patch);
  for (const id of plan.remove) await store.remove(id);
  // maps here only: to the community too (not the one being fitted right now)
  for (const id of plan.upload) if (store.fitting?.id !== id) await shareMap(id);
  if (!plan.download.length) return;
  const n = plan.download.length;
  let fromOthers = 0;
  await trackActivity(
    { id: 'shared-maps', label: 'Pobieram wspólne mapy', short: 'Wspólne mapy', share: 0 },
    async (update) => {
      for (const [i, r] of plan.download.entries()) {
        update({ step: `${r.name} (${i + 1} z ${n})`, share: i / n });
        await useOwnMapsStore
          .getState()
          .add(sharedToOwnMap(r, await sharedMapsApi.image(r.id), Date.now()));
        if (!r.mine) fromOthers++;
      }
    },
  );
  if (fromOthers)
    useToastStore
      .getState()
      .show(`Nowe wspólne mapy: ${fromOthers}. Włączysz je w Warstwach albo suwakiem lat`);
}
