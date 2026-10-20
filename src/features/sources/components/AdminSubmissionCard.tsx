import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { PUBLISH_MIN_CONFIDENCE, type SourceObject } from '@/shared/types/sources';
import { useAdminImages } from '../hooks/useAdminImages';
import { adminApi, type AdminSubmission } from '../services/adminApi';
import { AdminMiniMap } from './AdminMiniMap';

const KIND_LABELS: Record<SourceObject['kind'], string> = {
  osada: 'Osada',
  droga: 'Droga',
  mlyn: 'Młyn',
  karczma: 'Karczma',
  brod: 'Bród',
  inne: 'Inne',
};

interface AdminSubmissionCardProps {
  item: AdminSubmission;
  onDone: () => void;
}

/** One public submission: the photos, what the AI read, editable objects, approve or reject. */
export function AdminSubmissionCard({ item, onDone }: AdminSubmissionCardProps) {
  const images = useAdminImages(
    item.files.filter((f) => f.mime.startsWith('image/')).map((f) => f.id),
  );
  const [objects, setObjects] = useState<SourceObject[]>(item.result?.objects ?? []);
  const [keep, setKeep] = useState<boolean[]>(() =>
    (item.result?.objects ?? []).map((o) => o.confidence >= PUBLISH_MIN_CONFIDENCE),
  );
  const [source, setSource] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const edit = (i: number, patch: Partial<SourceObject>) =>
    setObjects((list) => list.map((o, j) => (j === i ? { ...o, ...patch } : o)));

  const act = async (approve: boolean) => {
    setBusy(true);
    setError(null);
    try {
      if (approve)
        await adminApi.approve(
          item.id,
          objects.filter((_, i) => keep[i]),
          source.trim() || 'Wspólna baza źródeł',
        );
      else await adminApi.reject(item.id);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nie udało się');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: '16px' }}>
      <Stack spacing={1.5}>
        <Typography variant="caption" color="text.secondary">
          {new Date(item.created_at).toLocaleString('pl-PL')} · koszt analizy{' '}
          {(item.cost_usd ?? 0).toFixed(4)} $ ·{' '}
          {item.result?.georef ? `położenie: ${item.result.georef.method}` : 'bez położenia mapy'}
        </Typography>
        {item.result?.summary && <Typography variant="subtitle2">{item.result.summary}</Typography>}
        {images.length > 0 && (
          <Stack direction="row" sx={{ gap: 1, overflowX: 'auto' }}>
            {images.map((u) => (
              <Box key={u} component="a" href={u} target="_blank" rel="noreferrer">
                <Box component="img" src={u} alt="" sx={{ height: 180, borderRadius: '10px' }} />
              </Box>
            ))}
          </Stack>
        )}
        {item.text && (
          <Typography
            variant="body2"
            sx={{ whiteSpace: 'pre-wrap', bgcolor: 'action.hover', p: 1, borderRadius: '10px' }}
          >
            {item.text}
          </Typography>
        )}
        {item.link && (
          <Typography variant="body2">
            Link:{' '}
            <a href={item.link} target="_blank" rel="noreferrer noopener">
              {item.link}
            </a>
          </Typography>
        )}
        <AdminMiniMap objects={objects.filter((_, i) => keep[i])} view={item.view_bbox} />
        {objects.map((o, i) => (
          <Stack key={i} direction="row" sx={{ gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Checkbox
              checked={keep[i] ?? false}
              onChange={(e) => setKeep((k) => k.map((v, j) => (j === i ? e.target.checked : v)))}
            />
            <TextField
              select
              size="small"
              value={o.kind}
              onChange={(e) => edit(i, { kind: e.target.value as SourceObject['kind'] })}
              sx={{ width: 120 }}
            >
              {Object.entries(KIND_LABELS).map(([k, label]) => (
                <MenuItem key={k} value={k}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              value={o.label}
              onChange={(e) => edit(i, { label: e.target.value })}
              sx={{ flex: 1, minWidth: 180 }}
            />
            <TextField
              size="small"
              label="szer."
              value={o.lat}
              onChange={(e) => edit(i, { lat: Number(e.target.value) })}
              sx={{ width: 110 }}
            />
            <TextField
              size="small"
              label="dł."
              value={o.lng}
              onChange={(e) => edit(i, { lng: Number(e.target.value) })}
              sx={{ width: 110 }}
            />
            <TextField
              size="small"
              label="±m"
              value={o.radiusM}
              onChange={(e) => edit(i, { radiusM: Number(e.target.value) })}
              sx={{ width: 80 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ width: '100%', pl: 6 }}>
              {o.reasons.join('. ')} · pewność {Math.round(o.confidence * 100)}%
            </Typography>
          </Stack>
        ))}
        <TextField
          size="small"
          label="Opis źródła w bazie"
          placeholder="np. Messtischblatt 5161 (1936), zgłoszenie użytkownika"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />
        {error && <Alert severity="error">{error}</Alert>}
        <Stack direction="row" sx={{ gap: 1, justifyContent: 'flex-end' }}>
          <Button color="error" disabled={busy} onClick={() => void act(false)}>
            Odrzuć
          </Button>
          <Button
            variant="contained"
            disabled={busy || !keep.some(Boolean)}
            onClick={() => void act(true)}
          >
            Zatwierdź ({keep.filter(Boolean).length})
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
