import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { Icon } from '@/shared/ui';

interface OldMapOptionProps {
  selected: boolean;
  title: string;
  subtitle?: string;
  onClick: () => void;
  /** more about the chosen map (its year, source), only while it is chosen */
  children?: ReactNode;
}

/** One choice in "Stara mapa": a big tile with a round mark, the chosen one filled and green. */
export function OldMapOption({ selected, title, subtitle, onClick, children }: OldMapOptionProps) {
  return (
    <Box
      sx={(theme) => ({
        border: 1.5,
        borderColor: selected ? 'primary.main' : 'divider',
        borderRadius: '12px',
        bgcolor: selected ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
        overflow: 'hidden',
      })}
    >
      <ButtonBase
        onClick={onClick}
        role="radio"
        aria-checked={selected}
        sx={{ width: '100%', textAlign: 'left', gap: 1.5, px: 1.5, py: 1.25 }}
      >
        <Box
          sx={{
            width: 24,
            height: 24,
            flexShrink: 0,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            border: 2,
            borderColor: selected ? 'primary.main' : 'text.disabled',
            bgcolor: selected ? 'primary.main' : 'transparent',
            color: 'primary.contrastText',
          }}
        >
          {selected && <Icon name="check" size={14} />}
        </Box>
        <Stack sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2">{title}</Typography>
          {subtitle && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                overflowWrap: 'anywhere',
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Stack>
      </ButtonBase>
      {selected && children && (
        <Stack spacing={0.75} sx={{ pl: 6.5, pr: 1.5, pb: 1.25 }}>
          {children}
        </Stack>
      )}
    </Box>
  );
}
