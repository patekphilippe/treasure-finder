import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useContextStore } from '@/features/history';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import { Icon, useToastStore } from '@/shared/ui';
import { fetchSharedContext } from '../services/fetchSharedContext';

/** Approved objects from everyone's sources, for the area on screen. */
export function SharedContextSection() {
  const [busy, setBusy] = useState(false);
  const showToast = useToastStore((s) => s.show);

  const fetchForView = async () => {
    const bounds = useMapViewStore.getState().bounds;
    if (!bounds) return;
    setBusy(true);
    try {
      const found = await fetchSharedContext(bounds);
      const known = new Set(useContextStore.getState().features.map((f) => f.id));
      const fresh = found.filter((f) => !known.has(f.id));
      if (fresh.length) await useContextStore.getState().add(fresh);
      showToast(
        found.length
          ? `Wspólna baza: ${found.length} obiektów w widoku, nowych ${fresh.length}`
          : 'We wspólnej bazie nie ma jeszcze obiektów w tym widoku',
      );
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Nie udało się pobrać');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack spacing={1} data-tour="sources-shared">
      <Typography variant="overline" color="text.secondary">
        Wspólna baza
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Zatwierdzone obiekty ze źródeł przysłanych przez innych. Trafią do Twoich obiektów
        archiwalnych i podniosą wynik kandydatów w pobliżu.
      </Typography>
      <Button
        variant="outlined"
        color="inherit"
        disabled={busy}
        startIcon={<Icon name="cloud-download-alt" size={18} />}
        onClick={() => void fetchForView()}
      >
        {busy ? 'Pobieranie…' : 'Pobierz dla widoku na mapie'}
      </Button>
    </Stack>
  );
}
