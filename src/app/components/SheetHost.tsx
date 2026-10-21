import { AccountSheet } from '@/features/account';
import { DataSheet } from '@/features/data';
import {
  ContextDetailsSheet,
  ContextLayerRow,
  HistorySheet,
  MapTimeSlider,
  OwnMapsVisibility,
} from '@/features/history';
import { LayersSheet } from '@/features/layers';
import { AddPointSheet, PointDetailsSheet, PointsListSheet } from '@/features/points';
import { AreaSheet } from '@/features/roughness';
import { TracksSheet, useTracksStore } from '@/features/tracks';
import { ZoneDetailsSheet, ZonesSheet } from '@/features/zones';
import { useUiStore } from '@/shared/store/useUiStore';
import { AnalysesSheet } from './AnalysesSheet';

export function SheetHost() {
  const activeSheet = useUiStore((s) => s.activeSheet);
  const closeSheet = useUiStore((s) => s.closeSheet);
  const selectedPointId = useUiStore((s) => s.selectedPointId);
  const selectedZoneId = useUiStore((s) => s.selectedZoneId);
  const tracks = useTracksStore((s) => s.tracks);
  const selectedAreaId = useUiStore((s) => s.selectedAreaId);
  const selectedContextId = useUiStore((s) => s.selectedContextId);

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
    case 'area':
      return <AreaSheet key={selectedAreaId} onClose={closeSheet} />;
    case 'history':
      return <HistorySheet onClose={closeSheet} />;
    case 'contextDetails':
      return <ContextDetailsSheet key={selectedContextId} onClose={closeSheet} />;
    case 'layers':
      return (
        <LayersSheet
          onClose={closeSheet}
          ownMaps={<OwnMapsVisibility />}
          timeline={<MapTimeSlider />}
          contextObjects={<ContextLayerRow />}
        />
      );
    case 'analyses':
      return <AnalysesSheet onClose={closeSheet} />;
    case 'data':
      return <DataSheet onClose={closeSheet} />;
    case 'account':
      return <AccountSheet onClose={closeSheet} />;
    default:
      return null;
  }
}
