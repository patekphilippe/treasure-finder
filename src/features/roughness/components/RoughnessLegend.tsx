import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { glass, Icon } from '@/shared/ui';
import { PLACE_COLOR } from '../config/places';
import { useAreasStore } from '../store/useAreasStore';
import { useRoughnessStore } from '../store/useRoughnessStore';

/** Collapsible legend: heat scale of the analysis and the place categories with counts. */
export function RoughnessLegend() {
  const heatShown = useRoughnessStore((s) => s.result !== null && s.visible);
  const areas = useAreasStore((s) => s.areas);
  const placesShown = useAreasStore((s) => s.visible) && areas.length > 0;
  const [open, setOpen] = useState(false);
  if (!heatShown && !placesShown) return null;

  return (
    <Paper
      sx={(theme) => ({
        ...glass(theme),
        position: 'absolute',
        zIndex: 1000,
        left: 12,
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 92px)',
        borderRadius: '12px',
        maxWidth: 260,
        overflow: 'hidden',
      })}
    >
      <ButtonBase
        onClick={() => setOpen(!open)}
        sx={{ gap: 1, px: 1.5, py: 1, width: '100%', justifyContent: 'flex-start' }}
      >
        <Icon name="list" size={18} />
        <Typography variant="subtitle2" sx={{ flex: 1, textAlign: 'left' }}>
          Legenda
        </Typography>
        <Icon name={open ? 'angle-down' : 'angle-up'} size={16} />
      </ButtonBase>
      {open && (
        <Stack spacing={1.25} sx={{ px: 1.5, pb: 1.5 }}>
          {heatShown && (
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                Teren nierówny
              </Typography>
              <Box
                sx={{
                  height: 10,
                  borderRadius: 5,
                  background:
                    'linear-gradient(90deg, rgba(250,204,21,0.35), rgba(249,115,22,0.6), rgba(220,38,38,0.8))',
                }}
              />
              <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Typography variant="caption">trochę</Typography>
                <Typography variant="caption">bardzo</Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Zabudowa i podwórza nie są oznaczane.
              </Typography>
            </Stack>
          )}
          {placesShown && (
            <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: PLACE_COLOR,
                  flexShrink: 0,
                }}
              />
              <Typography variant="caption" sx={{ flex: 1 }}>
                Obszar do sprawdzenia (numer)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {areas.length}
              </Typography>
            </Stack>
          )}
        </Stack>
      )}
    </Paper>
  );
}
