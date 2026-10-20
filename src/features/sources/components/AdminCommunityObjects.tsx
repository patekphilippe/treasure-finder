import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { CONTEXT_KINDS } from '@/features/history';
import type { AdminCommunityObject } from '@/shared/types/community';
import { formatDate } from '@/shared/lib/format';
import { adminApi } from '../services/adminApi';
import { AdminMiniMap } from './AdminMiniMap';

type Filter = 'recent' | 'disputed' | 'removed';

/** Owner's moderation of the shared base: newest, disputed (with notes) and removed objects. */
export function AdminCommunityObjects() {
  const [filter, setFilter] = useState<Filter>('disputed');
  const [items, setItems] = useState<AdminCommunityObject[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    adminApi
      .objects(filter)
      .then((list) => alive && setItems(list))
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : 'Błąd'));
    return () => {
      alive = false;
    };
  }, [filter]);

  return (
    <Stack spacing={2}>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={filter}
        onChange={(_, v: Filter | null) => v && setFilter(v)}
      >
        <ToggleButton value="disputed">Zakwestionowane</ToggleButton>
        <ToggleButton value="recent">Ostatnie</ToggleButton>
        <ToggleButton value="removed">Usunięte</ToggleButton>
      </ToggleButtonGroup>
      {error && <Alert severity="error">{error}</Alert>}
      {items && items.length > 0 && (
        <AdminMiniMap
          objects={items.map((o) => ({ ...o, confidence: 1, reasons: [] }))}
          view={null}
        />
      )}
      {items?.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          Nic tu nie ma.
        </Typography>
      )}
      {items?.map((o) => (
        <Paper key={o.id} variant="outlined" sx={{ p: 1.5, borderRadius: '12px' }}>
          <Stack direction="row" sx={{ alignItems: 'flex-start', gap: 1 }}>
            <Stack sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2">
                {CONTEXT_KINDS[o.kind].label}
                {o.label && o.label !== CONTEXT_KINDS[o.kind].label ? `: ${o.label}` : ''}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {o.author ?? 'zatwierdzone źródło'} · {formatDate(o.createdAt)} · ✓ {o.up} · ✗{' '}
                {o.down} · {o.lat.toFixed(5)}, {o.lng.toFixed(5)}
              </Typography>
              {o.source && (
                <Typography variant="caption" color="text.secondary">
                  Źródło: {o.source}
                </Typography>
              )}
              {o.notes.map((n) => (
                <Typography key={n} variant="caption" color="warning.main">
                  „{n}”
                </Typography>
              ))}
            </Stack>
            <Button
              size="small"
              color={o.removedAt ? 'primary' : 'error'}
              onClick={async () => {
                await adminApi.moderate(o.id, !o.removedAt);
                setItems((list) => list?.filter((x) => x.id !== o.id) ?? null);
              }}
            >
              {o.removedAt ? 'Przywróć' : 'Usuń'}
            </Button>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
