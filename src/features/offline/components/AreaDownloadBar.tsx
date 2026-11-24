import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useLayersStore } from '@/features/layers';
import { countTiles, formatMegabytes } from '@/shared/lib/format';
import { glass, Icon, useToastStore } from '@/shared/ui';
import { MAX_AREA_TILES } from '../config/offlineAreas';
import { useAreaPlan } from '../hooks/useAreaPlan';
import { useOfflineStore } from '../store/useOfflineStore';

/** Bottom bar while framing an area: layers, tile count and size, download with progress. */
export function AreaDownloadBar() {
  const { layers, progress, setLayers, stopSelecting, download, cancelDownload } =
    useOfflineStore();
  const baseLayer = useLayersStore((s) => s.baseLayer);
  const showToast = useToastStore((s) => s.show);
  const { plan, layerNames } = useAreaPlan();

  const start = async () => {
    if (!plan) return;
    try {
      const { bytes, failed } = await download(plan.urls, layerNames);
      showToast(
        failed
          ? `Zapisano ${formatMegabytes(bytes)}, nie udało się pobrać: ${countTiles(failed)}`
          : `Zapisano obszar: ${formatMegabytes(bytes)}`,
      );
    } catch (e) {
      showToast(
        (e as Error).name === 'AbortError'
          ? 'Pobieranie przerwane'
          : 'Nie udało się pobrać obszaru',
      );
    }
  };

  let info: string;
  if (!plan) info = 'Wybierz co najmniej jedną warstwę';
  else if (plan.tooLarge)
    info = `Za duży obszar: ponad ${MAX_AREA_TILES.toLocaleString('pl-PL')} kafelków. Przybliż mapę.`;
  else info = `${countTiles(plan.total)}, ok. ${formatMegabytes(plan.bytes)}`;

  const toggle = (on: boolean, label: string, onClick: () => void) => (
    <Chip
      key={label}
      size="small"
      label={label}
      onClick={onClick}
      color={on ? 'primary' : 'default'}
      variant={on ? 'filled' : 'outlined'}
      icon={on ? <Icon name="check" size={14} /> : undefined}
      disabled={progress !== null}
    />
  );

  return (
    <Paper
      data-tour="area-download"
      sx={(theme) => ({
        ...glass(theme),
        position: 'absolute',
        zIndex: 1050,
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 92px)',
        width: 'min(calc(100% - 24px), 440px)',
        borderRadius: '16px',
        p: 1.5,
      })}
    >
      <Stack spacing={1}>
        <Typography variant="subtitle2">Mapa bez internetu: ustaw obszar w ramce</Typography>
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75 }}>
          {toggle(layers.ortho, 'Zdjęcia', () => setLayers({ ortho: !layers.ortho }))}
          {toggle(layers.nmt, 'Rzeźba terenu', () => setLayers({ nmt: !layers.nmt }))}
        </Stack>
        {progress ? (
          <Stack spacing={0.5}>
            <LinearProgress variant="determinate" value={(progress.done / progress.total) * 100} />
            <Typography variant="caption" color="text.secondary">
              Pobieram {progress.done} z {progress.total}
            </Typography>
          </Stack>
        ) : (
          <Typography variant="caption" color={plan?.tooLarge ? 'warning.main' : 'text.secondary'}>
            {info}
          </Typography>
        )}
        {(baseLayer === 'osm' || baseLayer === 'topo') && !progress && (
          <Typography variant="caption" color="text.secondary">
            {baseLayer === 'osm'
              ? 'Podkład OpenStreetMap nie jest pobierany: jego serwery zabraniają masowego pobierania.'
              : 'Mapa topograficzna działa tylko z internetem: warunki usługi Geoportalu zabraniają jej pobierania. Bez zasięgu przełącz tło mapy na Zdjęcia.'}
          </Typography>
        )}
        <Stack direction="row" sx={{ justifyContent: 'flex-end', gap: 1 }}>
          {progress ? (
            <Button color="inherit" onClick={cancelDownload}>
              Przerwij
            </Button>
          ) : (
            <>
              <Button color="inherit" onClick={stopSelecting}>
                Anuluj
              </Button>
              <Button
                variant="contained"
                startIcon={<Icon name="download" size={18} />}
                disabled={!plan || plan.tooLarge || plan.total === 0}
                onClick={start}
              >
                Pobierz
              </Button>
            </>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}
