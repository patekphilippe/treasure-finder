import { rastersRepo } from '@/shared/db';
import type { RasterRecord } from '@/shared/types/domain';
import { useReliefStore } from '../store/useReliefStore';
import type { ReliefImage, SheetInfo } from '../workers/messages';

/** Keeps the sheet's relief images in the `rasters` store, so they show again offline. */
export async function saveSheetReliefs(sheet: SheetInfo, reliefs: ReliefImage[]): Promise<void> {
  const created = Date.now();
  const records: RasterRecord[] = reliefs.map((r) => ({
    id: `${sheet.sheetId}-${r.kind}`,
    sheetId: sheet.sheetId,
    kind: r.kind,
    data: r.blob,
    originE: sheet.originE,
    originN: sheet.originN,
    res: r.res,
    created,
  }));
  await rastersRepo.replaceSheet(sheet.sheetId, records);
  await useReliefStore.getState().load();
}
