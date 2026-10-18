import Box from '@mui/material/Box';
import { AcceptedZonesLayer, SheetReliefLayer } from '@/features/analysis/field';
import {
  ContextLayer,
  FitCornersBar,
  FitCornersLayer,
  OwnMapsLayer,
  useOwnMapsStore,
} from '@/features/history';
import { FollowButton, MapCrosshair, MapView } from '@/features/map';
import { GuidancePanel } from '@/features/navigation';
import { AreaDownloadBar, AreaSelectFrame, useOfflineStore } from '@/features/offline';
import { RoughnessLegend } from '@/features/roughness';
import { Dock } from '@/shared/ui';
import { DOCK_ITEMS } from '../config/dockItems';
import { useUiStore } from '@/shared/store/useUiStore';
import { SheetHost } from './SheetHost';

export function FieldLayout() {
  const activeSheet = useUiStore((s) => s.activeSheet);
  const toggleSheet = useUiStore((s) => s.toggleSheet);
  const selectingArea = useOfflineStore((s) => s.selecting);

  return (
    <Box sx={{ position: 'absolute', inset: 0 }}>
      <MapView>
        <OwnMapsLayer />
        <SheetReliefLayer />
        <AcceptedZonesLayer />
        <ContextLayer />
        <FitCornersLayer />
        {selectingArea && <AreaSelectFrame />}
      </MapView>
      <MapCrosshair />
      <FollowButton />
      <GuidancePanel />
      <RoughnessLegend />
      <SheetHost />
      {selectingArea && <AreaDownloadBar />}
      <FitCornersBar />
      <Dock
        items={DOCK_ITEMS}
        activeId={activeSheet}
        onSelect={(id) => {
          // a sheet and the area bar share the bottom: leave framing unless a download runs
          const offline = useOfflineStore.getState();
          if (offline.selecting && offline.progress) return;
          offline.stopSelecting();
          // the same for fitting a scan: opening a sheet cancels it
          useOwnMapsStore.getState().cancelFit();
          toggleSheet(id);
        }}
      />
    </Box>
  );
}
