import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import type { ReliefKind } from '@/shared/types/domain';
import { OpacitySlider, ToggleRow } from '@/shared/ui';
import { RELIEF_OPTIONS } from '../config/reliefKinds';
import { useReliefStore } from '../store/useReliefStore';

/**
 * The analysed sheets' relief as one tile: on shows the first kind (LRM), and inside it the
 * kind to see and its opacity; hidden until a sheet is analysed.
 */
export function SheetReliefSection() {
  const { kind, opacity, records, setKind, setOpacity } = useReliefStore();
  if (records.length === 0) return null;
  const sheets = new Set(records.map((r) => r.sheetId)).size;
  const hint = RELIEF_OPTIONS.find((o) => o.id === kind)?.hint;

  return (
    <Box data-tour="sheet-relief">
      <ToggleRow
        icon="layer-group"
        title="Teren z Twojego arkusza NMT"
        caption={`Wczytane arkusze: ${sheets}. Działa bez internetu.`}
        checked={kind !== null}
        onChange={(on) => setKind(on ? RELIEF_OPTIONS[0]!.id : null)}
      >
        <ToggleButtonGroup
          exclusive
          fullWidth
          size="small"
          value={kind}
          onChange={(_, v: ReliefKind | null) => v && setKind(v)}
          sx={{ bgcolor: 'action.hover', p: 0.5, borderRadius: 999 }}
        >
          {RELIEF_OPTIONS.map((o) => (
            <ToggleButton key={o.id} value={o.id}>
              {o.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
        <OpacitySlider value={opacity} onChange={setOpacity} min={0.2} of="teren z arkusza" />
      </ToggleRow>
    </Box>
  );
}
