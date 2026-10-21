import { BACKEND_ENABLED } from '@/shared/config/backend';
import { trackActivity } from '@/shared/store/trackActivity';
import { useMembership } from '@/shared/store/useMembership';
import { useToastStore } from '@/shared/ui';
import { useAiSettings } from '../store/useAiSettings';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { mapPointMover } from '../utils/mapPointMover';
import { profileForMap } from '../utils/profileForMap';
import { movedWithMap } from '../utils/movedWithMap';
import { proposalToContext } from '../utils/proposalToContext';
import { readResM } from '../utils/readResM';
import { toViewSource } from '../utils/toViewSource';
import { wholeMapChunks } from '../utils/wholeMapChunks';
import { addSightedObjects } from './addSightedObjects';
import { readWholeMap } from './readWholeMap';
import { shareMap } from './shareMap';
import { shareObjects } from './shareObjects';

/**
 * After an own map is placed: Claude reads it whole in the background (activity chip, can be
 * stopped), what it finds goes straight into the objects from maps with the map and its year,
 * and is shared with the community at once (the owner's choice for the test phase). A map is
 * read once (`readAt`); without signing in nothing is sent.
 */
export async function autoReadMap(mapId: string): Promise<void> {
  const showToast = useToastStore.getState().show;
  const map = useOwnMapsStore.getState().maps.find((m) => m.id === mapId);
  if (!map || map.readAt || !BACKEND_ENABLED) return;
  if (!useMembership.getState().email) {
    showToast('Zaloguj się, a każda dodana mapa zostanie przeczytana przez AI');
    return;
  }
  const { model } = useAiSettings.getState();
  const profile = profileForMap(map, useAiSettings.getState().profile);
  const chunks = wholeMapChunks(map, profile);
  if (!chunks?.length) return;
  const n = chunks.length;
  let stop = false;

  const r = await trackActivity(
    {
      id: `auto-read-${map.id}`,
      label: `Czytam mapę ${map.name} (AI)`,
      short: 'Czytam mapę',
      step: `fragment 1 z ${n}`,
      share: 0,
      cancel: () => {
        stop = true;
      },
      open: { mode: 'field', sheet: 'analyses', card: 'ai' },
    },
    (update) =>
      readWholeMap(
        toViewSource({ own: map }),
        chunks,
        model,
        profile,
        readResM(map, profile),
        (done) => update({ share: done / n, step: `fragment ${Math.min(done + 1, n)} z ${n}` }),
        () => stop,
      ),
  );

  // the corners were corrected while it was read: what was found follows the saved placement
  // (one still being dragged moves the objects after "Gotowe")
  const store = useOwnMapsStore.getState();
  const placed =
    store.fitting?.id === map.id ? store.fitting.before : store.maps.find((m) => m.id === map.id);
  const move =
    placed && placed.pixelToSource !== map.pixelToSource ? mapPointMover(map, placed) : null;
  const found = r.proposals
    .map(proposalToContext)
    .map((f) => (move ? (movedWithMap([f], map.id, move)[0] ?? f) : f));
  const { added, merged, changed } = await addSightedObjects(found);
  let shared = 0;
  try {
    shared = await shareObjects(changed.filter((f) => !f.community));
  } catch {
    // offline or a daily limit: they stay here and can be shared by hand
  }
  // read whole: not again; stopped or cut short: the next placing reads it again
  if (!stop && !r.stopped && !r.failed) {
    await useOwnMapsStore.getState().update(map.id, { readAt: Date.now() });
    // other devices and members then do not read it again
    await shareMap(map.id);
  }

  const parts = [
    `nowe obiekty: ${added}`,
    merged > 0 && `dopisane do znanych: ${merged}`,
    shared > 0 && `udostępnione: ${shared}`,
    r.failed > 0 && `nieudane fragmenty: ${r.failed}`,
  ].filter(Boolean);
  showToast(`${map.name}: ${parts.join(', ')}${r.stopped ? `. ${r.stopped}` : ''}`);
}
