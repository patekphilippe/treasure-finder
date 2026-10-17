import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useZonesStore } from '@/features/zones';
import { useUiStore } from '@/shared/store/useUiStore';
import { Icon, Sheet } from '@/shared/ui';
import { BASE_LAYER_OPTIONS } from '../config/baseLayers';
import { useLayersStore } from '../store/useLayersStore';
import { CustomLayerForm } from './CustomLayerForm';
import { CustomLayerItem } from './CustomLayerItem';

interface LayersSheetProps {
  onClose: () => void;
}

export function LayersSheet({ onClose }: LayersSheetProps) {
  const {
    baseLayer,
    nmtOn,
    nmtOpacity,
    customLayers,
    setBaseLayer,
    setNmtOn,
    setNmtOpacity,
    addCustomLayer,
    updateCustomLayer,
    removeCustomLayer,
  } = useLayersStore();
  const [adding, setAdding] = useState(false);
  const zoneCount = useZonesStore((s) => s.zones.length);
  const showSheet = useUiStore((s) => s.showSheet);

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

        <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
          <Icon name="draw-polygon" size={22} />
          <Stack sx={{ flex: 1 }}>
            <Typography variant="subtitle2">Strefy</Typography>
            <Typography variant="caption" color="text.secondary">
              {zoneCount
                ? `${zoneCount} — zgody właścicieli i zakazy`
                : 'Zgody właścicieli i miejsca zakazane'}
            </Typography>
          </Stack>
          <Button size="small" onClick={() => showSheet('zones')}>
            Zarządzaj
          </Button>
        </Stack>

        <Divider />

        <Stack>
          <Stack direction="row" sx={{ alignItems: 'center' }}>
            <Typography variant="overline" color="text.secondary" sx={{ flex: 1 }}>
              Własne warstwy
            </Typography>
            {!adding && (
              <Button
                size="small"
                startIcon={<Icon name="plus" size={16} />}
                onClick={() => setAdding(true)}
              >
                Dodaj
              </Button>
            )}
          </Stack>
          {customLayers.length === 0 && !adding && (
            <Typography variant="body2" color="text.secondary">
              Dodaj podkład XYZ lub usługę WMS, np. mapę archiwalną z własnego serwera kafelków.
            </Typography>
          )}
          {customLayers.map((layer) => (
            <CustomLayerItem
              key={layer.id}
              layer={layer}
              onChange={(patch) => updateCustomLayer(layer.id, patch)}
              onDelete={() => removeCustomLayer(layer.id)}
            />
          ))}
          {adding && (
            <CustomLayerForm
              onAdd={(layer) => {
                addCustomLayer(layer);
                setAdding(false);
              }}
              onCancel={() => setAdding(false)}
            />
          )}
        </Stack>
      </Stack>
    </Sheet>
  );
}
