import { trackActivity } from '@/shared/store/trackActivity';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import { useUiStore } from '@/shared/store/useUiStore';
import { useToastStore } from '@/shared/ui';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { importOwnMap, NeedCrsError, type ImportOptions } from './importOwnMap';
import { placeOwnMap } from './placeOwnMap';
import { autoReadMap } from './autoReadMap';
import { shareMap } from './shareMap';
import { showOwnMap } from './showOwnMap';

export interface AddOwnMapOptions extends Partial<Omit<ImportOptions, 'view'>> {
  /** place the scan by the names on it (backend AI, signed-in members) before reading it */
  auto?: boolean;
}

/**
 * Reads the chosen files as an own map and puts it on the map: a scan placed by the backend
 * first when asked (if that fails it goes into the view), then fitted by its corners or shown.
 * A task on the activity chip from start to end, so closing the sheet loses nothing.
 * 'needCrs': the file has a georeference in a system the app has to be told.
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
        const scan = files.find((f) => /\.(jpe?g|png|webp)$/i.test(f.name));
        if (auto && scan) {
          update({ step: 'Umieszczam mapę po nazwach (AI)' });
          try {
            const p = await placeOwnMap(scan, useMapViewStore.getState().bounds);
            placed = { corners: p.corners, ...(p.year && { year: p.year }) };
            showToast(
              p.method === 'arkusz'
                ? `Umieszczono po numerze arkusza ${p.sheetNumber ?? ''}. Sprawdź narożniki.`
                : `Umieszczono po nazwach: ${p.anchors.slice(0, 4).join(', ')} (błąd ok. ${p.uncertaintyM} m). Sprawdź narożniki.`,
            );
          } catch (e) {
            showToast(
              `${e instanceof Error ? e.message : 'Nie udało się umieścić mapy'}. Umieść ją ręcznie.`,
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
          if (needsFit) {
            showToast('Przeciągnij narożniki, aby dopasować mapę');
            useUiStore.getState().closeSheet();
            useOwnMapsStore.getState().startFit(map.id);
          } else {
            showToast(`Wczytano: ${map.name}`);
            showOwnMap(map);
            // georeferenced already: shared and read at once (a fitted scan after "Gotowe")
            void shareMap(map.id).finally(() => autoReadMap(map.id));
          }
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
