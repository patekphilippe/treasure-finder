import Box from '@mui/material/Box';
import { FollowButton, MapCrosshair, MapView } from '@/features/map';
import { GuidancePanel } from '@/features/navigation';
import { Dock } from '@/shared/ui';
import { DOCK_ITEMS } from '../config/dockItems';
import { useUiStore } from '@/shared/store/useUiStore';
import { SheetHost } from './SheetHost';

export function FieldLayout() {
  const activeSheet = useUiStore((s) => s.activeSheet);
  const toggleSheet = useUiStore((s) => s.toggleSheet);

  return (
    <Box sx={{ position: 'absolute', inset: 0 }}>
      <MapView />
      <MapCrosshair />
      <FollowButton />
      <GuidancePanel />
      <SheetHost />
      <Dock items={DOCK_ITEMS} activeId={activeSheet} onSelect={toggleSheet} />
    </Box>
  );
}
