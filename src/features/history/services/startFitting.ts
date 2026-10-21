import { useLayersStore } from '@/features/layers';
import { useUiStore } from '@/shared/store/useUiStore';
import { useOwnMapsStore } from '../store/useOwnMapsStore';
import { finishFitting } from './finishFitting';
import { showOwnMap } from './showOwnMap';

/**
 * Corner dragging for an own map, alone among the old maps: the online map goes off and the year
 * slider too (your other maps are not drawn while fitting). Another map being fitted is saved
 * first. Opening a sheet meanwhile does not end it; only "Gotowe" or "Anuluj" do. `isNew`: a map
 * just added that nothing placed, removed again on "Anuluj".
 */
export async function startFitting(id: string, isNew = false): Promise<void> {
  const store = useOwnMapsStore.getState();
  if (store.fitting && store.fitting.id !== id) await finishFitting();
  store.setTimeYear(null);
  store.setYears(null);
  useLayersStore.getState().setHistoricalId(null);
  useOwnMapsStore.getState().startFit(id, isNew);
  const map = useOwnMapsStore.getState().maps.find((m) => m.id === id);
  // the whole map in view above the fitting bar, so all four corners can be reached
  if (map) showOwnMap(map, 130);
  else useUiStore.getState().closeSheet();
}
