import { trackActivity } from '@/shared/store/trackActivity';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import { useToastStore } from '@/shared/ui';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { importOwnMap, NeedCrsError, type ImportOptions } from './importOwnMap';
import { placeScanWithAi } from './placeScanWithAi';
import { autoReadMap } from './autoReadMap';
import { focusOwnMap } from './focusOwnMap';
import { shareMap } from './shareMap';
import { startFitting } from './startFitting';

export interface AddOwnMapOptions extends Partial<Omit<ImportOptions, 'view'>> {
  /** place the scan by the names on it (backend AI, signed-in members) before reading it */
  auto?: boolean;
}

/**
 * Reads the chosen files as an own map and puts it on the map. A scan is placed by the backend
 * (AI) when asked: then it is shown alone, shared and read by AI at once, and the corners are
 * only an option ("Popraw narożniki" on the toast, or in Dane). A map with a georeference goes
 * the same way. Only a scan the AI could not place (or placed by hand) opens corner dragging,
 * and is read after "Gotowe". A task on the activity chip from start to end: closing the sheet
 * or changing layers meanwhile loses nothing. 'needCrs': the file's system has to be told.
 */
export async function addOwnMapFiles(
  files: readonly File[],
  { auto, ...opts }: AddOwnMapOptions = {},
): Promise<'done' | 'needCrs' | 'failed'> {
  const showToast = useToastStore.getState().show;
  const image = files.find((f) => /\.(jpe?g|png|webp|tiff?)$/i.test(f.name)) ?? files[0];
  const name = image?.name ?? 'mapa';
  useOwnMapsStore.setState({ importing: name });
  try {
    return await trackActivity(
      {
        id: 'own-map',
        label: `Mapa ${name}`,
        short: 'Wczytuję mapę',
        open: { mode: 'field', sheet: 'data' },
      },
      async (update) => {
        let placed: Partial<ImportOptions> = {};
        let placedNote: string | null = null;
        const scan = files.find((f) => /\.(jpe?g|png|webp)$/i.test(f.name));
        if (auto && scan) {
          update({ step: 'Umieszczam mapę po nazwach (AI)' });
          try {
            const r = await placeScanWithAi(scan, useMapViewStore.getState().bounds, () =>
              update({ step: 'Dopasowuję ramkę do skanu' }),
            );
            placed = r.placed;
            placedNote = r.note;
          } catch (e) {
            showToast(
              `${e instanceof Error ? e.message : 'Nie udało się umieścić mapy'}. Przeciągnij narożniki.`,
            );
          }
        }
        update({ step: 'Wczytuję obraz' });
        try {
          const { map, needsFit } = await importOwnMap(files, {
            ...opts,
            ...placed,
            view: useMapViewStore.getState().bounds,
          });
          await useOwnMapsStore.getState().add(map);
          if (needsFit && !placedNote) {
            // nowhere to start from but the view: the corners are needed, read after "Gotowe"
            showToast('Przeciągnij narożniki, aby dopasować mapę');
            await startFitting(map.id);
            return 'done';
          }
          await focusOwnMap(map);
          showToast(placedNote ? `${placedNote}. AI czyta mapę` : `Wczytano: ${map.name}`, {
            label: 'Popraw narożniki',
            onClick: () => void startFitting(map.id),
          });
          // placed: shared and read at once, whatever the user does meanwhile
          void shareMap(map.id).finally(() => autoReadMap(map.id));
          return 'done';
        } catch (e) {
          if (e instanceof NeedCrsError) return 'needCrs';
          showToast(e instanceof Error ? e.message : 'Nie udało się wczytać mapy');
          return 'failed';
        }
      },
    );
  } finally {
    useOwnMapsStore.setState({ importing: null });
  }
}
