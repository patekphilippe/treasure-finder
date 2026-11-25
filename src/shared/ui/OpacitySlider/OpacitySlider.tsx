import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

interface OpacitySliderProps {
  /** 0–1 */
  value: number;
  onChange: (value: number) => void;
  min?: number;
  /** what it is the opacity of, for screen readers */
  of: string;
}

/** "Krycie", a slider and the percent: the same everywhere a layer can be faded. */
export function OpacitySlider({ value, onChange, min = 0.1, of }: OpacitySliderProps) {
  return (
    <Stack direction="row" sx={{ alignItems: 'center', gap: 2 }}>
      <Typography variant="body2" sx={{ minWidth: 48 }}>
        Krycie
      </Typography>
      <Slider
        size="small"
        min={min}
        max={1}
        step={0.05}
        value={value}
        onChange={(_, v) => onChange(v as number)}
        aria-label={`Krycie: ${of}`}
      />
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ minWidth: 34, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
      >
        {Math.round(value * 100)}%
      </Typography>
    </Stack>
  );
}
