import { DataSheet } from '@/features/data';
import { LayersSheet } from '@/features/layers';
import { AddPointSheet, PointsListSheet } from '@/features/points';
import { TracksSheet } from '@/features/tracks';
import { useUiStore } from '../store/useUiStore';

export function SheetHost() {
  const activeSheet = useUiStore((s) => s.activeSheet);
  const closeSheet = useUiStore((s) => s.closeSheet);

  switch (activeSheet) {
    case 'tracks':
      return <TracksSheet onClose={closeSheet} />;
    case 'points':
      return <PointsListSheet onClose={closeSheet} />;
    case 'addPoint':
      return <AddPointSheet onClose={closeSheet} />;
    case 'layers':
      return <LayersSheet onClose={closeSheet} />;
    case 'data':
      return <DataSheet onClose={closeSheet} />;
    default:
      return null;
  }
}
