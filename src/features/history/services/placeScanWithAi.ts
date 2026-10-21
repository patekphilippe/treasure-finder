import type { Bounds } from '@/shared/store/useMapViewStore';
import type { ImportOptions } from './importOwnMap';
import { placeOwnMap } from './placeOwnMap';
import { refinePlacement } from './refinePlacement';

/**
 * A scan placed by the backend (AI reads the sheet frame or the names; `view` is the hint where
 * to look), its frame then snapped on the full scan. Returns the import options and a note for
 * the user; throws when the backend cannot place it.
 */
export async function placeScanWithAi(
  scan: File,
  view: Bounds | null,
  onFrame?: () => void,
): Promise<{ placed: Partial<ImportOptions>; note: string }> {
  const p = await placeOwnMap(scan, view);
  if (p.frame) onFrame?.();
  const corners = await refinePlacement(scan, p);
  return {
    placed: { corners, ...(p.year && { year: p.year }) },
    note:
      p.method === 'arkusz'
        ? `Umieszczono po ramce arkusza ${p.sheetNumber ?? p.series}`
        : `Umieszczono po nazwach: ${p.anchors.slice(0, 3).join(', ')} (ok. ${p.uncertaintyM} m)`,
  };
}
