import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { Icon } from '@/shared/ui';
import { EXCLUSION_COLORS } from '../config/exclusionStyle';
import { useAnalysisStore } from '../store/useAnalysisStore';

/** What BDOT10k left out of the last analysed sheet, per group, with a map toggle. */
export function ExclusionSummary() {
  const exclusion = useAnalysisStore((s) => s.exclusion);
  const visible = useAnalysisStore((s) => s.exclusionVisible);
  const setVisible = useAnalysisStore((s) => s.setExclusionVisible);
  if (!exclusion) return null;
  const failed = exclusion.groups.some((g) => g.status === 'error');

  return (
    <Box sx={{ px: 2.5, pb: 1 }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2" noWrap title={exclusion.sheetId}>
          Pominięte z BDOT10k
        </Typography>
        <FormControlLabel
          sx={{ mr: 0, flexShrink: 0, whiteSpace: 'nowrap' }}
          control={
            <Switch size="small" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
          }
          label={<Typography variant="caption">Na mapie</Typography>}
        />
      </Stack>
      <Stack spacing={0.5}>
        {exclusion.groups.map((g, k) => {
          const [r, gr, b] = EXCLUSION_COLORS[k] ?? [100, 100, 100];
          return (
            <Stack key={g.label} direction="row" sx={{ alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '3px',
                  bgcolor: `rgb(${r}, ${gr}, ${b})`,
                  flexShrink: 0,
                }}
              />
              <Typography variant="caption" sx={{ flex: 1 }}>
                {g.label}
              </Typography>
              {g.status === 'ok' && (
                <Typography variant="caption" color="text.secondary">
                  {(g.share * 100).toLocaleString('pl-PL', { maximumFractionDigits: 1 })}% arkusza
                </Typography>
              )}
              {g.status === 'empty' && (
                <Typography variant="caption" color="text.secondary">
                  brak obiektów
                </Typography>
              )}
              {g.status === 'error' && (
                <Stack
                  direction="row"
                  sx={{ alignItems: 'center', gap: 0.5, color: 'warning.main' }}
                >
                  <Icon name="exclamation-triangle" size={14} />
                  <Typography variant="caption">nie pobrano</Typography>
                </Stack>
              )}
            </Stack>
          );
        })}
      </Stack>
      {failed && (
        <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.5 }}>
          Część danych BDOT10k nie dotarła, więc te obiekty mogły trafić do kandydatów. Wczytaj
          arkusz ponownie, gdy będzie internet.
        </Typography>
      )}
    </Box>
  );
}
