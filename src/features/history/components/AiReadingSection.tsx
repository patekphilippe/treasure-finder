import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useCallback, useState } from 'react';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import { BACKEND_ENABLED } from '@/shared/config/backend';
import { Icon, TurnstileWidget, useToastStore } from '@/shared/ui';
import { AI_MODELS, AI_READING_NOTE, type AiModelId } from '../config/aiReading';
import { useViewSource } from '../hooks/useViewSource';
import { findLostBuildings } from '../services/findLostBuildings';
import { useAiSettings } from '../store/useAiSettings';
import { useContextStore } from '../store/useContextStore';
import { useProposalsStore } from '../store/useProposalsStore';
import { createContextPoint } from '../utils/createContextPoint';
import { ProposalItem } from './ProposalItem';

const UMWD_TERMS = 'https://geoportal.dolnyslask.pl/userreg/regulamin-pl.html';

/** Claude reads the visible historical map; lost buildings and named places become proposals. */
export function AiReadingSection() {
  const { model, setModel } = useAiSettings();
  const { proposals, step, usage, read, set, drop } = useProposalsStore();
  const add = useContextStore((s) => s.add);
  const flyTo = useMapViewStore((s) => s.flyTo);
  const showToast = useToastStore((s) => s.show);
  const source = useViewSource();
  // a Turnstile token works once: a new widget after every reading
  const [token, setToken] = useState<string | null>(null);
  const [round, setRound] = useState(0);
  const onToken = useCallback((t: string | null) => setToken(t), []);

  const run = async () => {
    const bounds = useMapViewStore.getState().bounds;
    if (!source || !bounds || !token) return;
    set({ step: 'Start', proposals: [], usage: null, read: null });
    try {
      const r = await findLostBuildings(bounds, source, model, token, (s) => set({ step: s }));
      set({ proposals: r.proposals, usage: r.usage, read: r.read });
      showToast(
        r.proposals.length ? `Propozycje: ${r.proposals.length}` : 'Nic nowego w tym widoku',
      );
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Odczyt mapy nie powiódł się');
    } finally {
      set({ step: null });
      setRound((n) => n + 1);
    }
  };

  const accept = async (ids: string[]) => {
    const chosen = proposals.filter((p) => ids.includes(p.id));
    await add(chosen.map((p) => createContextPoint(p.kind, p.lat, p.lng, p.source)));
    chosen.forEach((p) => drop(p.id));
    showToast(`Dodano do kontekstu: ${chosen.length}`);
  };

  const isUmwd = source?.kind === 'wms' && source.layer.url.includes('dolnyslask');

  return (
    <Stack data-tour="ai-reading" spacing={1}>
      <Typography variant="overline" color="text.secondary">
        Szukaj zaginionej zabudowy (AI)
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Claude czyta widoczny fragment mapy historycznej: domy, młyny, karczmy, folwarki. Aplikacja
        porównuje je z dzisiejszymi budynkami (BDOT10k) i proponuje miejsca, których już nie ma.
      </Typography>

      {!BACKEND_ENABLED ? (
        <Typography variant="caption" color="warning.main">
          Odczyt map wymaga serwera analizy, a ta wersja aplikacji go nie ma.
        </Typography>
      ) : (
        <Stack spacing={1}>
          <TextField
            select
            size="small"
            label="Model"
            value={model}
            onChange={(e) => setModel(e.target.value as AiModelId)}
          >
            {AI_MODELS.map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {m.label}
              </MenuItem>
            ))}
          </TextField>
          <Typography variant="caption" color={source ? 'text.secondary' : 'warning.main'}>
            {source
              ? `Czyta: ${source.label}. Przybliż mapę tak, by widok miał najwyżej ok. 3 km.`
              : 'Włącz własną mapę albo mapę historyczną w Warstwach.'}
          </Typography>
          {isUmwd && (
            <Typography variant="caption" color="warning.main">
              Regulamin geoportalu Dolnego Śląska zabrania programów automatyzujących korzystanie z
              usług. Jedno zapytanie o widok na Twoje kliknięcie to szara strefa:{' '}
              <Link href={UMWD_TERMS} target="_blank" rel="noreferrer">
                regulamin
              </Link>
              . Bez wątpliwości działa na własnych mapach.
            </Typography>
          )}
          {source && !step && <TurnstileWidget key={round} onToken={onToken} resetKey={round} />}
          <Typography variant="caption" color="text.secondary">
            {AI_READING_NOTE}
          </Typography>
          {step ? (
            <Stack spacing={0.5}>
              <LinearProgress />
              <Typography variant="caption" color="text.secondary">
                {step}…
              </Typography>
            </Stack>
          ) : (
            <Stack direction="row" sx={{ gap: 1 }}>
              <Button
                variant="contained"
                sx={{ flex: 1 }}
                disabled={!source || !token}
                startIcon={<Icon name="search" size={18} />}
                onClick={() => void run()}
              >
                Szukaj w widoku
              </Button>
            </Stack>
          )}
          {usage && (
            <Typography variant="caption" color="text.secondary">
              Odczytano obiektów: {read}. Zużyte tokeny: {usage.inputTokens.toLocaleString('pl-PL')}{' '}
              wejścia, {usage.outputTokens.toLocaleString('pl-PL')} wyjścia.
            </Typography>
          )}
        </Stack>
      )}

      {proposals.length > 0 && (
        <Stack>
          {proposals.map((p, i) => (
            <ProposalItem
              key={p.id}
              no={i + 1}
              proposal={p}
              onShow={() => flyTo({ lat: p.lat, lng: p.lng, zoom: 16 })}
              onAccept={() => void accept([p.id])}
              onReject={() => drop(p.id)}
            />
          ))}
          {proposals.length > 1 && (
            <Button size="small" onClick={() => void accept(proposals.map((p) => p.id))}>
              Przyjmij wszystkie ({proposals.length})
            </Button>
          )}
          <Typography variant="caption" color="text.secondary">
            Położenie z odczytu AI może być przesunięte o kilkadziesiąt metrów; sprawdź na mapie
            przed przyjęciem. Przyjęte od razu podnoszą wynik pobliskich kandydatów NMT.
          </Typography>
        </Stack>
      )}
    </Stack>
  );
}
