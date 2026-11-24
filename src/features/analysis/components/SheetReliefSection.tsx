import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import type { ReliefKind } from '@/shared/types/domain';
import { Icon } from '@/shared/ui';
import { RELIEF_OPTIONS } from '../config/reliefKinds';
import { useReliefStore } from '../store/useReliefStore';

/** Choice of the analysed sheets' relief layer with its opacity; hidden until a sheet is analysed. */
export function SheetReliefSection() {
  const { kind, opacity, records, setKind, setOpacity } = useReliefStore();
  if (records.length === 0) return null;
  const sheets = new Set(records.map((r) => r.sheetId)).size;
  const hint = RELIEF_OPTIONS.find((o) => o.id === kind)?.hint;

  return (
    <Stack data-tour="sheet-relief" spacing={0.75} sx={{ py: 0.75 }}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ color: kind ? 'primary.main' : 'text.secondary', display: 'flex' }}>
          <Icon name="layer-group" size={22} />
        </Box>
        <Stack sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2">Teren z Twojego arkusza NMT</Typography>
          <Typography variant="caption" color="text.secondary">
            Wczytane arkusze: {sheets}. Działa bez internetu.
          </Typography>
        </Stack>
      </Stack>
      <ToggleButtonGroup
        exclusive
        fullWidth
        size="small"
        value={kind ?? 'none'}
        onChange={(_, v: ReliefKind | 'none' | null) => v && setKind(v === 'none' ? null : v)}
        sx={{ bgcolor: 'action.hover', p: 0.5, borderRadius: 999 }}
      >
        <ToggleButton value="none">Brak</ToggleButton>
        {RELIEF_OPTIONS.map((o) => (
          <ToggleButton key={o.id} value={o.id}>
            {o.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      {kind && (
        <>
          <Typography variant="caption" color="text.secondary">
            {hint}
          </Typography>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 2, px: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40 }}>
              Krycie
            </Typography>
            <Slider
              size="small"
              min={0.2}
              max={1}
              step={0.05}
              value={opacity}
              onChange={(_, v) => setOpacity(v as number)}
              aria-label="Krycie reliefu z arkusza"
            />
          </Stack>
        </>
      )}
    </Stack>
  );
}
