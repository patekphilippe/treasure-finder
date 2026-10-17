import Box from '@mui/material/Box';
import { MapView } from '@/features/map';
import { Dock } from '@/shared/ui';
import { DOCK_ITEMS } from '../config/dockItems';
import { useUiStore } from '../store/useUiStore';
import { SheetHost } from './SheetHost';

export function FieldLayout() {
  const activeSheet = useUiStore((s) => s.activeSheet);
  const openSheet = useUiStore((s) => s.openSheet);

  return (
    <Box sx={{ position: 'absolute', inset: 0 }}>
      <MapView />
      <SheetHost />
      <Dock items={DOCK_ITEMS} activeId={activeSheet} onSelect={openSheet} />
    </Box>
  );
}
