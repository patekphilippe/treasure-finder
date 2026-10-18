import { useZonesStore } from '@/features/zones';
import { candidatesRepo, zonesRepo } from '@/shared/db';
import { INTERPRETATIONS } from '@/shared/lib/detect';
import type { Candidate, Zone } from '@/shared/types/domain';
import { useAnalysisStore } from '../store/useAnalysisStore';
import { mergeSheetCandidates } from '../utils/mergeSheetCandidates';

const exclusionPrefix = (sheetId: string) => `wyklucz-${sheetId}-`;

/**
 * Stores the candidates of an analysed sheet (re-runs keep decisions and notes) and turns the
 * exclusion zones of protected forms into forbidden zones.
 */
export async function saveSheetResults(
  sheetId: string,
  fresh: Candidate[],
): Promise<{ added: number; kept: number }> {
  const old = await candidatesRepo.getBySheet(sheetId);
  const { toWrite, toDelete } = mergeSheetCandidates(old, fresh);
  await candidatesRepo.removeMany(toDelete);
  await candidatesRepo.putMany(toWrite);

  const zones = await zonesRepo.getAll();
  for (const z of zones)
    if (z.id.startsWith(exclusionPrefix(sheetId))) await zonesRepo.remove(z.id);
  const exclusions: Zone[] = toWrite
    .filter((c) => c.priority === 'chroniony' && c.exclusionZone)
    .map((c) => ({
      id: `${exclusionPrefix(sheetId)}${c.id}`,
      name: `Prawdopodobne stanowisko: ${INTERPRETATIONS[c.interpretation].label} (${c.id})`,
      kind: 'zakaz',
      geometry: c.exclusionZone!,
    }));
  await zonesRepo.putMany(exclusions);
  await Promise.all([useAnalysisStore.getState().load(), useZonesStore.getState().load()]);
  return {
    added: toWrite.length - (old.length - toDelete.length),
    kept: old.length - toDelete.length,
  };
}
