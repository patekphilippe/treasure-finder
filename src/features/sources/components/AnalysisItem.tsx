import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { addedToast, addSightedObjects } from '@/features/history';
import { bottomSheetOffset } from '@/shared/lib/bottomSheetOffset';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import { Icon, useToastStore } from '@/shared/ui';
import { STATUS_LABELS } from '../config/sourcesApi';
import { sourcesApi } from '../services/sourcesApi';
import { useSourcesStore, type SentSource } from '../store/useSourcesStore';
import { toContextFeature } from '../utils/toContextFeature';

interface AnalysisItemProps {
  item: SentSource;
}

/** One sent source: status, what was read, objects to accept into the archival context. */
export function AnalysisItem({ item }: AnalysisItemProps) {
  const { update, remove, show, shownId } = useSourcesStore();
  const flyTo = useMapViewStore((s) => s.flyTo);
  const showToast = useToastStore((s) => s.show);
  const status = item.view?.status ?? 'nowe';
  const result = item.view?.result;
  const objects = result?.objects ?? [];
  const open = objects.map((_, i) => i).filter((i) => !item.accepted.includes(i));

  const accept = async (indices: number[]) => {
    const counts = await addSightedObjects(
      indices.map((i) => toContextFeature(objects[i]!, item.label)),
    );
    update(item.id, { accepted: [...item.accepted, ...indices] });
    showToast(addedToast(counts));
  };

  const showOnMap = () => {
    show(item.id);
    const first = objects[0];
    if (first) flyTo({ lat: first.lat, lng: first.lng, zoom: 15, offsetY: bottomSheetOffset() });
  };

  const del = async () => {
    await sourcesApi.remove(item.id, item.accessKey).catch(() => undefined);
    remove(item.id);
  };

  return (
    <Stack spacing={1} sx={{ py: 1.25, borderTop: 1, borderColor: 'divider' }}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
        <Typography variant="subtitle2" noWrap sx={{ flex: 1, minWidth: 0 }}>
          {item.label}
        </Typography>
        <Chip size="small" label={STATUS_LABELS[status]} sx={{ height: 22, fontSize: 11 }} />
        <IconButton size="small" aria-label="Usuń analizę" onClick={() => void del()}>
          <Icon name="trash-alt" size={18} />
        </IconButton>
      </Stack>
      <Typography variant="caption" color="text.secondary">
        {new Date(item.sentAt).toLocaleString('pl-PL')} ·{' '}
        {item.mode === 'public' ? 'udostępnione innym po sprawdzeniu' : 'tylko dla mnie'}
      </Typography>
      {item.view?.error && (
        <Typography variant="body2" color="error">
          {item.view.error}
        </Typography>
      )}
      {result && (
        <>
          <Typography variant="body2">{result.summary || 'Brak opisu'}</Typography>
          {!objects.length && (
            <Typography variant="body2" color="text.secondary">
              Nie znaleziono obiektów z położeniem.
            </Typography>
          )}
          {objects.map((o, i) => (
            <Stack key={i} direction="row" sx={{ alignItems: 'center', gap: 1, pl: 1 }}>
              <Stack sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2">{o.label}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {o.reasons.join('. ')} · pewność {Math.round(o.confidence * 100)}%
                </Typography>
              </Stack>
              {item.accepted.includes(i) ? (
                <Icon name="check" size={18} />
              ) : (
                <Button size="small" onClick={() => void accept([i])}>
                  Przyjmij
                </Button>
              )}
            </Stack>
          ))}
          {objects.length > 0 && (
            <Stack direction="row" sx={{ gap: 1 }}>
              <Button
                size="small"
                variant={shownId === item.id ? 'contained' : 'outlined'}
                startIcon={<Icon name="map-marked-alt" size={16} />}
                onClick={shownId === item.id ? () => show(null) : showOnMap}
              >
                {shownId === item.id ? 'Ukryj na mapie' : 'Pokaż na mapie'}
              </Button>
              {open.length > 1 && (
                <Button size="small" onClick={() => void accept(open)}>
                  Przyjmij wszystkie ({open.length})
                </Button>
              )}
            </Stack>
          )}
        </>
      )}
    </Stack>
  );
}
