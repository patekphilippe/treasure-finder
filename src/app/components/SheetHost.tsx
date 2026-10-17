import { DataSheet } from '@/features/data';
import { LayersSheet } from '@/features/layers';
import { AddPointSheet, PointDetailsSheet, PointsListSheet } from '@/features/points';
import { TracksSheet, useTracksStore } from '@/features/tracks';
import { ZoneDetailsSheet, ZonesSheet } from '@/features/zones';
import { useUiStore } from '@/shared/store/useUiStore';

export function SheetHost() {
  const activeSheet = useUiStore((s) => s.activeSheet);
  const closeSheet = useUiStore((s) => s.closeSheet);
  const selectedPointId = useUiStore((s) => s.selectedPointId);
  const selectedZoneId = useUiStore((s) => s.selectedZoneId);
  const tracks = useTracksStore((s) => s.tracks);

  switch (activeSheet) {
    case 'tracks':
      return <TracksSheet onClose={closeSheet} />;
    case 'points':
      return <PointsListSheet onClose={closeSheet} />;
    case 'addPoint':
      return <AddPointSheet onClose={closeSheet} />;
    case 'pointDetails':
      return <PointDetailsSheet key={selectedPointId} onClose={closeSheet} />;
    case 'zones':
      return <ZonesSheet onClose={closeSheet} />;
    case 'zoneDetails':
      return <ZoneDetailsSheet key={selectedZoneId} onClose={closeSheet} tracks={tracks} />;
    case 'layers':
      return <LayersSheet onClose={closeSheet} />;
    case 'data':
      return <DataSheet onClose={closeSheet} />;
    default:
      return null;
  }
}
