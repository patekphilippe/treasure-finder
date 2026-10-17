import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import LinearProgress from '@mui/material/LinearProgress';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { formatHectares } from '@/shared/lib/format';
import { bottomSheetOffset } from '@/shared/lib/bottomSheetOffset';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import { useUiStore } from '@/shared/store/useUiStore';
import { Icon, useToastStore } from '@/shared/ui';
import { useRoughnessStore } from '../store/useRoughnessStore';

/** "Uneven ground" analysis of the visible area, from the Geoportal hillshade. */
export function RoughnessSection() {
  const { status, progress, error, result, visible, opacity, run, clear, setVisible, setOpacity } =
    useRoughnessStore();
  const flyTo = useMapViewStore((s) => s.flyTo);
  const closeSheet = useUiStore((s) => s.closeSheet);
  const showToast = useToastStore((s) => s.show);

  const analyse = async () => {
    const bounds = useMapViewStore.getState().bounds;
    if (!bounds) return;
    await run(bounds);
    const s = useRoughnessStore.getState();
    if (s.status === 'done') showToast(`Znaleziono obszarów: ${s.result?.hotspots.length ?? 0}`);
  };

  return (
    <Stack spacing={1.25}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
        <Icon name="fire" size={22} />
        <Stack sx={{ flex: 1 }}>
          <Typography variant="subtitle2">Teren nierówny</Typography>
          <Typography variant="caption" color="text.secondary">
            Z cieniowania NMT: gdzie jest dużo dołków, kopców i rowów. To wskazówka, gdzie patrzeć —
            nie rozpoznawanie form.
          </Typography>
        </Stack>
        {result && <Switch checked={visible} onChange={(e) => setVisible(e.target.checked)} />}
      </Stack>
      {status === 'loading' ? (
        <Stack spacing={0.5}>
          <LinearProgress
            variant={progress < 1 ? 'determinate' : 'indeterminate'}
            value={progress * 100}
          />
          <Typography variant="caption" color="text.secondary">
            {progress < 1 ? `Pobieram cieniowanie… ${Math.round(progress * 100)}%` : 'Analizuję…'}
          </Typography>
        </Stack>
      ) : (
        <Stack direction="row" sx={{ gap: 1 }}>
          <Button
            variant="outlined"
            color="inherit"
            sx={{ flex: 1 }}
            startIcon={<Icon name="search" size={18} />}
            onClick={analyse}
          >
            Analizuj ten widok
          </Button>
          {result && (
            <Button color="inherit" onClick={clear}>
              Wyczyść
            </Button>
          )}
        </Stack>
      )}
      {status === 'error' && error && (
        <Typography variant="caption" color="error.main">
          {error}
        </Typography>
      )}
      {result && visible && (
        <Stack direction="row" sx={{ alignItems: 'center', gap: 2, pl: 4.5, pr: 1 }}>
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
          />
        </Stack>
      )}
      {result && result.hotspots.length > 0 && (
        <Stack>
          <Typography variant="caption" color="text.secondary">
            Najmocniejsze obszary (nasilenie × wielkość). Zabudowa też świeci — to ślady usuniętych
            budynków.
          </Typography>
          {result.hotspots.map((h, i) => (
            <ButtonBase
              key={`${h.lat}-${h.lng}`}
              onClick={() => {
                flyTo({ lat: h.lat, lng: h.lng, zoom: 17, offsetY: bottomSheetOffset() });
                closeSheet();
              }}
              sx={{
                justifyContent: 'flex-start',
                gap: 1.5,
                py: 0.75,
                px: 1,
                mx: -1,
                borderRadius: '8px',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Typography variant="subtitle2" sx={{ width: 20, color: 'text.secondary' }}>
                {i + 1}
              </Typography>
              <Typography variant="body2" sx={{ flex: 1, textAlign: 'left' }}>
                Obszar {formatHectares(h.areaM2)} ha
              </Typography>
              <Typography variant="caption" color="text.secondary">
                nasilenie {h.strength}%
              </Typography>
            </ButtonBase>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
