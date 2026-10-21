import Stack from '@mui/material/Stack';
import type { Theme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { AccountButton } from '@/features/account';
import { MapCredits } from '@/features/map';
import { TutorialButton } from '@/features/tutorial';
import { ZoneAlertBar } from '@/features/zones';
import { StatusChips } from '@/shared/ui';
import { useUiStore } from '@/shared/store/useUiStore';
import { ActivityChip } from './ActivityChip';
import { ModeSwitch } from './ModeSwitch';

/** Floating controls in the top-left corner, above the map. */
export function TopBar() {
  const mode = useUiStore((s) => s.mode);
  // on a phone the first row is full (mode switch, help, account): the task chip goes below
  const compact = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

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
      {mode === 'field' && <ZoneAlertBar />}
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
        <ModeSwitch />
        <TutorialButton />
        <AccountButton />
        {!compact && <ActivityChip />}
      </Stack>
      <Stack
        direction="row"
        sx={{ alignItems: 'center', gap: 0.75, ml: '8px', maxWidth: '100%', flexWrap: 'wrap' }}
      >
        {mode === 'field' && <StatusChips />}
        {compact && <ActivityChip />}
        <MapCredits />
      </Stack>
    </Stack>
  );
}
