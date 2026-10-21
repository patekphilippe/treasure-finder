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

/** the backend's daily limit or monthly budget: the next maps would fail the same way */
const OUT_OF_READINGS = /limit|budżet/i;
class OutOfReadings extends Error {}

/** Reads a placed map whole; a reading cut short stops the folder, to go on another day. */
async function readWhole(id: string, name: string): Promise<void> {
  await autoReadMap(id).catch(() => {});
  if (!useOwnMapsStore.getState().maps.find((m) => m.id === id)?.readAt)
    throw new OutOfReadings(`mapa ${name} nie została przeczytana do końca`);
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
    } catch (e) {
      // out of readings: the map is left for the next run, not placed roughly
      if (e instanceof Error && OUT_OF_READINGS.test(e.message)) throw new OutOfReadings(e.message);
      // nothing readable on it: the sheet number still puts it close
    }
  }
  let map;
  let needsFit;
  try {
    ({ map, needsFit } = await importOwnMap(g.files, opts));
    await useOwnMapsStore.getState().add(map);
  } catch {
    return 'skipped';
  }
  // the whole scan on the sheet's corners is off by its margins: reading waits for "Gotowe"
  if (needsFit && !byAi) return 'toFit';
  await shareMap(map.id).catch(() => {});
  if (ai) await readWhole(map.id, map.name);
  return 'added';
}

const named = (names: string[]) =>
  `${names.length}${names.length <= 3 ? ` (${names.join(', ')})` : ''}`;

/**
 * Every map of a chosen folder, one after another until the files run out: each scan placed by
 * the backend (with the sheet number from its file name as the hint) and read whole by AI before
 * the next. When the daily limit or the monthly budget runs out it stops; the same folder chosen
 * again finishes the map it stopped on and goes on with the rest (maps already loaded are
 * skipped by name). Without signing in, or when placing fails, by the sheet number alone. One
 * task on the activity chip, can be stopped after the current map.
 */
export async function addOwnMapFolder(files: readonly File[]): Promise<FolderResult> {
  const showToast = useToastStore.getState().show;
  const maps = useOwnMapsStore.getState().maps;
  const known = new Set(maps.map((m) => m.name));
  const all = mapFileGroups(files);
  const names = new Set(all.map((g) => g.name));
  const ai = BACKEND_ENABLED && !!useMembership.getState().email;
  // placed and shared on an earlier run, its reading cut short: finished first
  const unread = ai ? maps.filter((m) => names.has(m.name) && m.shared?.mine && !m.readAt) : [];
  const groups = all.filter((g) => !known.has(g.name));
  const total = unread.length + groups.length;
  const result: FolderResult = {
    added: [],
    toFit: [],
    skipped: [],
    known: all.length - total,
  };
  if (!total) {
    showToast(
      all.length
        ? 'Wszystkie mapy z folderu są już wczytane'
        : 'W folderze nie ma map (JPG, PNG, WebP, GeoTIFF)',
    );
    return result;
  }
  let stop = false;
  let halted: string | null = null;
  useOwnMapsStore.setState({ importing: `${total} map z folderu` });
  try {
    await trackActivity(
      {
        id: 'own-map-folder',
        label: `Mapy z folderu: ${total}`,
        short: 'Wczytuję mapy',
        share: 0,
        cancel: () => {
          stop = true;
        },
        open: { mode: 'field', sheet: 'data' },
      },
      async (update) => {
        let i = 0;
        const next = (name: string) => {
          update({ share: i / total, step: `${i + 1} z ${total}: ${name}` });
          i++;
        };
        try {
          for (const m of unread) {
            if (stop) return;
            next(m.name);
            await readWhole(m.id, m.name);
            result.added.push(m.name);
          }
          for (const g of groups) {
            if (stop) return;
            next(g.name);
            result[await addOne(g, ai)].push(g.name);
          }
        } catch (e) {
          if (!(e instanceof OutOfReadings)) throw e;
          halted = e.message;
        }
      },
    );
  } finally {
    useOwnMapsStore.setState({ importing: null });
  }
  const parts = [
    `wczytane: ${result.added.length}`,
    result.toFit.length > 0 && `do poprawy narożników: ${named(result.toFit)}`,
    result.skipped.length > 0 && `pominięte: ${named(result.skipped)}`,
    result.known > 0 && `już były: ${result.known}`,
  ].filter(Boolean);
  const end = halted
    ? `. Zatrzymane: ${halted}. Wskaż ten sam folder później: aplikacja dokończy i weźmie następne mapy`
    : stop
      ? ' (zatrzymane)'
      : '';
  showToast(`Mapy z folderu: ${parts.join(', ')}${end}`);
  return result;
}
