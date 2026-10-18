import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { TooltipRenderProps } from 'react-joyride';
import { Icon } from '@/shared/ui';

/** Tour card in the app's own style, with Polish buttons. */
export function TutorialTooltip({
  index,
  size,
  isLastStep,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
}: TooltipRenderProps) {
  return (
    <Paper
      {...tooltipProps}
      elevation={8}
      sx={{
        width: 'min(calc(100vw - 32px), 360px)',
        borderRadius: '16px',
        overflow: 'hidden',
      }}
    >
      <Stack spacing={1} sx={{ p: 2, pb: 1.5 }}>
        <Stack direction="row" sx={{ alignItems: 'flex-start', gap: 1 }}>
          <Stack sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Krok {index + 1} z {size}
            </Typography>
            {step.title && <Typography variant="subtitle1">{step.title}</Typography>}
          </Stack>
          <IconButton size="small" {...closeProps} aria-label="Zamknij przewodnik" title="Zamknij">
            <Icon name="times" size={18} />
          </IconButton>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {step.content}
        </Typography>
      </Stack>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, px: 2, pb: 2 }}>
        {!isLastStep && (
          <Button size="small" color="inherit" {...skipProps} aria-label="Pomiń" title="Pomiń">
            Pomiń
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        {index > 0 && (
          <Button size="small" color="inherit" {...backProps} aria-label="Wstecz" title="Wstecz">
            Wstecz
          </Button>
        )}
        <Button
          size="small"
          variant="contained"
          {...primaryProps}
          aria-label={isLastStep ? 'Zakończ' : 'Dalej'}
          title={isLastStep ? 'Zakończ' : 'Dalej'}
        >
          {isLastStep ? 'Zakończ' : 'Dalej'}
        </Button>
      </Stack>
    </Paper>
  );
}
