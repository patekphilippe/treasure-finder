import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { Icon } from '../Icon/Icon';

interface ToggleRowProps {
  icon: string;
  title: ReactNode;
  /** one short line under the title */
  caption?: ReactNode;
  checked?: boolean;
  onChange?: (on: boolean) => void;
  /** a tile that opens something instead of switching: an arrow in place of the switch */
  onOpen?: () => void;
  /** settings of what is switched on, inside the tile only while it is on */
  children?: ReactNode;
  /** anchor for the guided tour */
  'data-tour'?: string;
}

/**
 * One thing that can be on the map, as a big tile: a tap anywhere switches it, and a switched-on
 * tile is green, like the chosen old map. Its settings (opacity, width…) show inside it only
 * while it is on. With `onOpen` the tile opens a sheet instead and ends in an arrow.
 */
export function ToggleRow({
  icon,
  title,
  caption,
  checked = false,
  onChange,
  onOpen,
  children,
  'data-tour': tourId,
}: ToggleRowProps) {
  const lit = checked && !onOpen;
  return (
    <Box
      data-tour={tourId}
      sx={(theme) => ({
        border: 1.5,
        borderColor: lit ? 'primary.main' : 'divider',
        borderRadius: '12px',
        bgcolor: lit ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
        overflow: 'hidden',
      })}
    >
      <ButtonBase
        onClick={() => (onOpen ? onOpen() : onChange?.(!checked))}
        {...(!onOpen && { role: 'switch', 'aria-checked': checked })}
        sx={{ width: '100%', textAlign: 'left', gap: 1.5, px: 1.5, py: 1.25 }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            flexShrink: 0,
            borderRadius: '10px',
            display: 'grid',
            placeItems: 'center',
            bgcolor: lit ? 'primary.main' : 'action.hover',
            color: lit ? 'primary.contrastText' : 'text.secondary',
          }}
        >
          <Icon name={icon} size={20} />
        </Box>
        <Stack sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2">{title}</Typography>
          {caption && (
            <Typography variant="caption" color="text.secondary">
              {caption}
            </Typography>
          )}
        </Stack>
        {onOpen ? (
          <Icon name="angle-right" size={20} />
        ) : (
          // the look of a switch; the whole tile is the button
          <Box
            aria-hidden
            sx={{
              width: 42,
              height: 24,
              flexShrink: 0,
              borderRadius: 999,
              position: 'relative',
              bgcolor: checked ? 'primary.main' : 'text.disabled',
              transition: 'background-color 150ms',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 3,
                left: checked ? 21 : 3,
                width: 18,
                height: 18,
                borderRadius: '50%',
                bgcolor: '#fff',
                transition: 'left 150ms',
              },
            }}
          />
        )}
      </ButtonBase>
      {lit && children && (
        <Stack spacing={0.75} sx={{ pl: 8, pr: 1.5, pb: 1.25 }}>
          {children}
        </Stack>
      )}
    </Box>
  );
}
