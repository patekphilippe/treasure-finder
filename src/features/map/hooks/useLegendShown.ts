import { useAreasStore, useRoughnessStore } from '@/features/roughness';

/** Whether the uneven-ground legend sits in the bottom-left corner (same rule as RoughnessLegend). */
export function useLegendShown(): boolean {
  const heat = useRoughnessStore((s) => s.result !== null && s.visible);
  const places = useAreasStore((s) => s.visible && s.areas.length > 0);
  return heat || places;
}
