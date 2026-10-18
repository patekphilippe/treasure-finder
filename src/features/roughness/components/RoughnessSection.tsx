import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import { useUiStore } from '@/shared/store/useUiStore';
import { Icon, useToastStore } from '@/shared/ui';
import { useAreasStore } from '../store/useAreasStore';
import { useRoughnessStore } from '../store/useRoughnessStore';
import { AreaListItem } from './AreaListItem';

const LIST_LIMIT = 30;

/** Uneven-ground analysis of the visible area and the list of marked places. */
export function RoughnessSection() {
  const { status, progress, error, result, visible, opacity, run, clear, setVisible, setOpacity } =
    useRoughnessStore();
  const areas = useAreasStore((s) => s.areas);
  const placesVisible = useAreasStore((s) => s.visible);
  const setPlacesVisible = useAreasStore((s) => s.setVisible);
  const showArea = useUiStore((s) => s.showArea);
  const showToast = useToastStore((s) => s.show);

  const analyse = async () => {
    const bounds = useMapViewStore.getState().bounds;
    if (!bounds) return;
    await run(bounds);
    const s = useRoughnessStore.getState();
    if (s.status === 'done') {
      showToast(`Oznaczono miejsc: ${s.result?.hotspots.length ?? 0} (nowych: ${s.newPlaces})`);
    }
  };

  const sorted = [...areas].sort((a, b) => b.strength - a.strength);

  return (
    <Stack data-tour="layers-roughness" spacing={1.25}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
        <Icon name="fire" size={22} />
        <Stack sx={{ flex: 1 }}>
          <Typography variant="subtitle2">Teren nierówny</Typography>
          <Typography variant="caption" color="text.secondary">
            Z cieniowania NMT: gdzie jest dużo dołków, kopców i rowów. Zabudowa i podwórza są
            pomijane.
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
            {progress < 1
              ? `Pobieram cieniowanie: ${Math.round(progress * 100)}%`
              : 'Analizuję i pomijam zabudowę…'}
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
              Ukryj mapę
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
      {areas.length > 0 && (
        <Stack>
          <Stack direction="row" sx={{ alignItems: 'center' }}>
            <Typography variant="overline" color="text.secondary" sx={{ flex: 1 }}>
              Oznaczone miejsca ({areas.length})
            </Typography>
            <Switch
              size="small"
              checked={placesVisible}
              onChange={(e) => setPlacesVisible(e.target.checked)}
            />
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
            Wskazówki, gdzie patrzeć. Rozpoznanie form wymaga wczytania arkusza NMT w trybie
            Analiza.
          </Typography>
          {sorted.slice(0, LIST_LIMIT).map((a) => (
            <AreaListItem key={a.id} area={a} onClick={() => showArea(a.id)} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
