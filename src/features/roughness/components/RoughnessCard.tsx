import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import { useUiStore } from '@/shared/store/useUiStore';
import { AnalysisCard, Icon } from '@/shared/ui';
import { useAreasStore } from '../store/useAreasStore';
import { useRoughnessStore } from '../store/useRoughnessStore';

/** Analizy: uneven ground in the visible part of the map; the result is shown in Warstwy. */
export function RoughnessCard() {
  const { status, progress, error, result, run, cancel } = useRoughnessStore();
  const places = useAreasStore((s) => s.areas.length);
  const showSheet = useUiStore((s) => s.showSheet);
  const loading = status === 'loading';
  const state = loading
    ? progress < 1
      ? `W toku: cieniowanie ${Math.round(progress * 100)}%`
      : 'W toku: analiza widoku'
    : status === 'error'
      ? 'Ostatnia analiza się nie udała'
      : result
        ? `Ostatni widok: ${result.hotspots.length} oznaczonych miejsc`
        : places
          ? `Oznaczonych miejsc: ${places}`
          : 'Jeszcze nie analizowano';

  return (
    <AnalysisCard
      data-tour="analyses-roughness"
      card="roughness"
      icon="fire"
      title="Teren nierówny w widoku"
      needs="widok mapy do ok. 8 × 8 km, internet"
      status={state}
    >
      <Typography variant="body2" color="text.secondary">
        Z cieniowania NMT zaznacza, gdzie jest dużo dołków, kopców i rowów. Zabudowa, drogi i woda
        są pomijane. Szybka wskazówka w terenie, bez wczytywania arkusza.
      </Typography>
      {loading ? (
        <Stack spacing={0.5}>
          <LinearProgress
            variant={progress < 1 ? 'determinate' : 'indeterminate'}
            value={progress * 100}
          />
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
              {progress < 1
                ? `Pobieram cieniowanie: ${Math.round(progress * 100)}%`
                : 'Analizuję i pomijam zabudowę…'}
            </Typography>
            <Button size="small" color="inherit" onClick={cancel}>
              Przerwij
            </Button>
          </Stack>
        </Stack>
      ) : (
        <Button
          variant="contained"
          startIcon={<Icon name="search" size={18} />}
          onClick={() => {
            const bounds = useMapViewStore.getState().bounds;
            if (bounds) void run(bounds);
          }}
        >
          Analizuj ten widok
        </Button>
      )}
      {status === 'error' && error && <Alert severity="warning">{error}</Alert>}
      {(result || places > 0) && (
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<Icon name="layer-group" size={18} />}
          onClick={() => showSheet('layers')}
        >
          Mapa i lista miejsc w Warstwach
        </Button>
      )}
    </AnalysisCard>
  );
}
