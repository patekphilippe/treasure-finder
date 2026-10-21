import { useActivityStore } from '@/shared/store/useActivityStore';
import { useToastStore } from '@/shared/ui';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { autoReadMap } from './autoReadMap';
import { moveObjectsWithMap } from './moveObjectsWithMap';
import { shareMap } from './shareMap';

/**
 * "Gotowe" after dragging the corners: the placement is saved and goes to the community. A map
 * not read yet is read by AI now (unless that is already running: it adjusts what it finds at
 * the end); a map read before takes its objects along.
 */
export async function finishFitting(): Promise<void> {
  const { fitting, maps } = useOwnMapsStore.getState();
  if (!fitting) return;
  const before = fitting.before;
  const after = maps.find((m) => m.id === fitting.id);
  await useOwnMapsStore.getState().finishFit();
  if (!after) return;
  const showToast = useToastStore.getState().show;
  const reading = useActivityStore.getState().tasks.some((t) => t.id === `auto-read-${after.id}`);
  if (after.readAt || reading) {
    const n = after.readAt ? await moveObjectsWithMap(before, after) : 0;
    showToast(
      n
        ? `Zapisano dopasowanie: ${after.name}. Obiekty z tej mapy przesunięte: ${n}`
        : `Zapisano dopasowanie: ${after.name}`,
    );
    void shareMap(after.id);
    return;
  }
  showToast(`Zapisano dopasowanie: ${after.name}. AI czyta mapę`);
  void shareMap(after.id).finally(() => autoReadMap(after.id));
}
