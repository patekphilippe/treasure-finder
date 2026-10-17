import Divider from '@mui/material/Divider';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { Icon, Sheet } from '@/shared/ui';
import { BASE_LAYER_OPTIONS } from '../config/baseLayers';
import { useLayersStore } from '../store/useLayersStore';

interface LayersSheetProps {
  onClose: () => void;
}

export function LayersSheet({ onClose }: LayersSheetProps) {
  const { baseLayer, nmtOn, nmtOpacity, setBaseLayer, setNmtOn, setNmtOpacity } = useLayersStore();

  return (
    <Sheet title="Warstwy" onClose={onClose}>
      <Stack spacing={2.5}>
        <Stack spacing={1}>
          <Typography variant="overline" color="text.secondary">
            Podkład
          </Typography>
          <ToggleButtonGroup
            exclusive
            fullWidth
            value={baseLayer}
            onChange={(_, value) => value && setBaseLayer(value)}
            sx={{ bgcolor: 'action.hover', p: 0.5, borderRadius: 999 }}
          >
            {BASE_LAYER_OPTIONS.map((opt) => (
              <ToggleButton key={opt.id} value={opt.id} sx={{ gap: 1 }}>
                <Icon name={opt.icon} size={18} />
                {opt.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>

        <Divider />

        <Stack spacing={1}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Icon name="mountain" size={22} />
            <Stack sx={{ flex: 1 }}>
              <Typography variant="subtitle2">Cieniowanie NMT</Typography>
              <Typography variant="caption" color="text.secondary">
                Geoportal, siatka 1 m
              </Typography>
            </Stack>
            <Switch checked={nmtOn} onChange={(e) => setNmtOn(e.target.checked)} />
          </Stack>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', pl: 4.5, pr: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40 }}>
              Krycie
            </Typography>
            <Slider
              size="small"
              disabled={!nmtOn}
              min={0.1}
              max={1}
              step={0.05}
              value={nmtOpacity}
              onChange={(_, value) => setNmtOpacity(value as number)}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => `${Math.round(v * 100)}%`}
            />
          </Stack>
        </Stack>

        <Divider />

        <Typography variant="body2" color="text.secondary">
          Własne warstwy XYZ i WMS — do przeniesienia z wersji 1 (Etap 0, krok 3).
        </Typography>
      </Stack>
    </Sheet>
  );
}
