import Box from '@mui/material/Box';
import { usePointDraftStore } from '@/shared/store/usePointDraftStore';
import { Icon } from '@/shared/ui';

/** Fixed crosshair in the middle of the map while picking a location. */
export function MapCrosshair() {
  const picking = usePointDraftStore((s) => s.picking);
  if (!picking) return null;

  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        zIndex: 1000,
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        color: '#111',
        filter: 'drop-shadow(0 0 2px #fff) drop-shadow(0 0 2px #fff)',
      }}
    >
      <Icon name="crosshairs" size={44} />
    </Box>
  );
}
