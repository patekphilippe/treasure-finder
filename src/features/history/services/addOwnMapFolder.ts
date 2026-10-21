import { BACKEND_ENABLED } from '@/shared/config/backend';
import { sheetCorners, sheetFromName } from '@/shared/lib/georef';
import { trackActivity } from '@/shared/store/trackActivity';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import { useMembership } from '@/shared/store/useMembership';
import { useToastStore } from '@/shared/ui';
import { IMAGE_EXT, WORLD_EXT } from '../config/ownMaps';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { mapFileGroups } from '../utils/mapFileGroups';
import { autoReadMap } from './autoReadMap';
import { importOwnMap, type ImportOptions } from './importOwnMap';
import { placeScanWithAi } from './placeScanWithAi';
import { shareMap } from './shareMap';

const SCAN = /\.(jpe?g|png|webp)$/i;

/** how each map of the folder ended */
export interface FolderResult {
  /** placed and read by AI (or a GeoTIFF on its place) */
  added: string[];
  /** placed by the sheet number in the file name only: the corners need a look before reading */
  toFit: string[];
  /** not loaded: no place to put it, an image with a world file (its system is asked one by one) */
  skipped: string[];
  /** already among the maps (by name): a folder can be loaded again after adding files */
  known: number;
}

async function addOne(
  g: { name: string; files: File[] },
  ai: boolean,
): Promise<'added' | 'toFit' | 'skipped'> {
  if (g.files.some((f) => WORLD_EXT.test(f.name))) return 'skipped';
  const image = g.files.find((f) => IMAGE_EXT.test(f.name))!;
  const sheet = sheetFromName(g.name);
  let opts: ImportOptions = sheet ? { sheet } : {};
  let byAi = false;
  if (ai && SCAN.test(image.name)) {
    try {
      // the sheet in the file name tells the backend where to look
      const hint =
        (sheet && sheetCorners(sheet.series, sheet.number)) ?? useMapViewStore.getState().bounds;
      opts = (await placeScanWithAi(image, hint)).placed;
      byAi = true;
    } catch {
      // a daily limit or nothing readable: the sheet number still puts it close
    }
  }
  try {
    const { map, needsFit } = await importOwnMap(g.files, opts);
    await useOwnMapsStore.getState().add(map);
    // the whole scan on the sheet's corners is off by its margins: reading waits for "Gotowe"
    if (needsFit && !byAi) return 'toFit';
    await shareMap(map.id).catch(() => {});
    if (ai) await autoReadMap(map.id).catch(() => {});
    return 'added';
  } catch {
    return 'skipped';
  }
}

/**
 * Every map of a chosen folder, one after another until the files run out: each scan placed by
 * the backend (with the sheet number from its file name as the hint) and read whole by AI before
 * the next, so the daily limit is spent in order; without signing in, or when placing fails, by
 * the sheet number alone. Maps already loaded are skipped. One task on the activity chip, can be
 * stopped after the current map.
 */
export async function addOwnMapFolder(files: readonly File[]): Promise<FolderResult> {
  const showToast = useToastStore.getState().show;
  const known = new Set(useOwnMapsStore.getState().maps.map((m) => m.name));
  const all = mapFileGroups(files);
  const groups = all.filter((g) => !known.has(g.name));
  const result: FolderResult = {
    added: [],
    toFit: [],
    skipped: [],
    known: all.length - groups.length,
  };
  if (!groups.length) {
    showToast(
      all.length
        ? 'Wszystkie mapy z folderu są już wczytane'
        : 'W folderze nie ma map (JPG, PNG, WebP, GeoTIFF)',
    );
    return result;
  }
  const ai = BACKEND_ENABLED && !!useMembership.getState().email;
  let stop = false;
  useOwnMapsStore.setState({ importing: `${groups.length} map z folderu` });
  try {
    await trackActivity(
      {
        id: 'own-map-folder',
        label: `Mapy z folderu: ${groups.length}`,
        short: 'Wczytuję mapy',
        share: 0,
        cancel: () => {
          stop = true;
        },
        open: { mode: 'field', sheet: 'data' },
      },
      async (update) => {
        for (const [i, g] of groups.entries()) {
          if (stop) break;
          update({ share: i / groups.length, step: `${i + 1} z ${groups.length}: ${g.name}` });
          result[await addOne(g, ai)].push(g.name);
        }
      },
    );
  } finally {
    useOwnMapsStore.setState({ importing: null });
  }
  const parts = [
    `wczytane: ${result.added.length}`,
    result.toFit.length > 0 && `do poprawy narożników: ${result.toFit.length}`,
    result.skipped.length > 0 && `pominięte: ${result.skipped.join(', ')}`,
    result.known > 0 && `już były: ${result.known}`,
  ].filter(Boolean);
  showToast(`Mapy z folderu: ${parts.join(', ')}${stop ? ' (zatrzymane)' : ''}`);
  return result;
}
