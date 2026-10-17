import Stack from '@mui/material/Stack';
import { StatusChips } from '@/shared/ui';
import { useUiStore } from '../store/useUiStore';
import { ModeSwitch } from './ModeSwitch';

/** Floating controls in the top-left corner, above the map. */
export function TopBar() {
  const mode = useUiStore((s) => s.mode);

  return (
    <Stack
      direction="column"
      sx={{
        alignItems: 'flex-start',
        gap: 1,
        position: 'absolute',
        zIndex: 1100,
        top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        left: 'calc(env(safe-area-inset-left, 0px) + 12px)',
        right: { xs: 12, md: mode === 'analysis' ? 420 : 12 },
        pointerEvents: 'none',
        '& > *': { pointerEvents: 'auto' },
      }}
    >
      <ModeSwitch />
      {mode === 'field' && <StatusChips />}
    </Stack>
  );
}
