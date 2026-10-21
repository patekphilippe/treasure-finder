import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useMemo, useState } from 'react';
import type { ReadProfileId } from '@/shared/lib/history';
import type { OwnMap } from '@/shared/types/domain';
import { Icon, useToastStore } from '@/shared/ui';
import { VIEW_COST_USD, VIEW_SECONDS, type AiModelId } from '../config/aiReading';
import type { ViewSource } from '../services/captureView';
import { readMapLegend } from '../services/readMapLegend';
import { readWholeMap } from '../services/readWholeMap';
import { useProposalsStore } from '../store/useProposalsStore';
import { readResM } from '../utils/readResM';
import { wholeMapChunks } from '../utils/wholeMapChunks';

interface WholeMapReadingProps {
  source: ViewSource;
  map: OwnMap;
  model: AiModelId;
  profile: ReadProfileId;
}

/**
 * "Przeczytaj całą mapę": an own map read window by window instead of view by view, with the
 * number of windows, cost and time shown first. Every window is one reading of the day.
 */
export function WholeMapReading({ source, map, model, profile }: WholeMapReadingProps) {
  const { step, set, wholeRunning, stopRequested, requestStop } = useProposalsStore();
  const showToast = useToastStore((s) => s.show);
  const [asking, setAsking] = useState(false);
  const chunks = useMemo(() => wholeMapChunks(map, profile), [map, profile]);

  if (!chunks?.length) return null;

  const n = chunks.length;
  const cost = (n * VIEW_COST_USD[model]).toFixed(2).replace('.', ',');
  const minutes = Math.max(1, Math.round((n * VIEW_SECONDS) / 2 / 60));

  // the run lives in the store: closing the sheet keeps it going, and "Przerwij" stays on the chip
  const start = async () => {
    setAsking(false);
    set({
      wholeRunning: true,
      step: `Cała mapa: fragment 1 z ${n}`,
      share: 0,
      proposals: [],
      usage: null,
      read: null,
    });
    try {
      // the sheet's own legend first: the map is then read by its signs and abbreviations
      const legend =
        profile === 'wojskowa' ? null : await readMapLegend(map, model).catch(() => null);
      const r = await readWholeMap(
        source,
        chunks,
        model,
        profile,
        readResM(map, profile),
        (done) => {
          if (useProposalsStore.getState().stopRequested) return;
          set({ step: `Cała mapa: fragment ${Math.min(done + 1, n)} z ${n}`, share: done / n });
        },
        () => useProposalsStore.getState().stopRequested,
        legend,
      );
      set({ proposals: r.proposals, usage: r.usage, read: r.read });
      showToast(
        r.stopped
          ? `${r.stopped}. Propozycje z przeczytanej części: ${r.proposals.length}`
          : `Propozycje: ${r.proposals.length}` +
              (r.failed ? `, nieudanych fragmentów: ${r.failed}` : ''),
      );
    } finally {
      set({ step: null, share: null, wholeRunning: false });
    }
  };

  if (wholeRunning)
    return (
      <Button
        size="small"
        color="inherit"
        disabled={stopRequested}
        onClick={requestStop}
        startIcon={<Icon name="stop" size={16} />}
      >
        {stopRequested ? 'Kończę bieżące fragmenty' : 'Przerwij czytanie całej mapy'}
      </Button>
    );
  if (asking)
    return (
      <Stack spacing={1}>
        <Typography variant="body2">
          {n} fragmentów, do ok. {cost} $ ze wspólnego budżetu, ok. {minutes} min. Każdy fragment to
          jeden odczyt z dziennego limitu.
        </Typography>
        <Stack direction="row" sx={{ gap: 1 }}>
          <Button variant="contained" sx={{ flex: 1 }} onClick={() => void start()}>
            Czytaj
          </Button>
          <Button color="inherit" onClick={() => setAsking(false)}>
            Anuluj
          </Button>
        </Stack>
      </Stack>
    );
  return (
    <Button
      data-tour="ai-whole-map"
      variant="outlined"
      disabled={Boolean(step)}
      startIcon={<Icon name="th" size={18} />}
      onClick={() => setAsking(true)}
    >
      Przeczytaj całą mapę ({n})
    </Button>
  );
}
