import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { MILITARY_MAP_NOTE } from '@/features/safety';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import { BACKEND_ENABLED } from '@/shared/config/backend';
import { READ_PROFILES, type ReadProfileId } from '@/shared/lib/history';
import { useMembership } from '@/shared/store/useMembership';
import { Icon, SignInPrompt, useToastStore } from '@/shared/ui';
import { AI_MAX_SIDE, AI_MODELS, AI_READING_NOTE, type AiModelId } from '../config/aiReading';
import { useViewSource } from '../hooks/useViewSource';
import { addSightedObjects } from '../services/addSightedObjects';
import { findLostBuildings } from '../services/findLostBuildings';
import { useAiSettings } from '../store/useAiSettings';
import { useProposalsStore } from '../store/useProposalsStore';
import { addedToast } from '../utils/addedToast';
import { proposalToContext } from '../utils/proposalToContext';
import { CompareMaps } from './CompareMaps';
import { ProposalItem } from './ProposalItem';
import { WholeMapReading } from './WholeMapReading';

const UMWD_TERMS = 'https://geoportal.dolnyslask.pl/userreg/regulamin-pl.html';

/**
 * Claude reads the visible historical map with the chosen profile: on a topographic map lost
 * buildings and named places, on a military map positions, front lines and war graves.
 */
export function AiReadingSection() {
  const { model, setModel, profile, setProfile } = useAiSettings();
  const military = profile === 'wojskowa';
  // the widest view the profile still reads, in km
  const maxViewKm = Math.round((READ_PROFILES[profile].maxResM * AI_MAX_SIDE) / 1000);
  const member = useMembership((st) => st.email !== null);
  const { proposals, step, usage, read, set, drop } = useProposalsStore();
  const flyTo = useMapViewStore((s) => s.flyTo);
  const showToast = useToastStore((s) => s.show);
  const source = useViewSource();

  const run = async () => {
    const bounds = useMapViewStore.getState().bounds;
    if (!source || !bounds) return;
    set({ step: 'Start', proposals: [], usage: null, read: null });
    try {
      const r = await findLostBuildings(bounds, source, model, profile, (s) => set({ step: s }));
      set({ proposals: r.proposals, usage: r.usage, read: r.read });
      showToast(
        r.proposals.length ? `Propozycje: ${r.proposals.length}` : 'Nic nowego w tym widoku',
      );
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Odczyt mapy nie powiódł się');
    } finally {
      set({ step: null });
    }
  };

  const accept = async (ids: string[]) => {
    const chosen = proposals.filter((p) => ids.includes(p.id));
    const counts = await addSightedObjects(chosen.map(proposalToContext));
    chosen.forEach((p) => drop(p.id));
    showToast(addedToast(counts));
  };

  const isUmwd = source?.kind === 'wms' && source.layer.url.includes('dolnyslask');

  return (
    <Stack data-tour="ai-reading" spacing={1}>
      <Typography variant="overline" color="text.secondary">
        {military ? 'Pozycje z mapy wojskowej (AI)' : 'Szukaj zaginionej zabudowy (AI)'}
      </Typography>
      <ToggleButtonGroup
        data-tour="ai-profile"
        exclusive
        size="small"
        value={profile}
        onChange={(_, v: ReadProfileId | null) => v && setProfile(v)}
      >
        <ToggleButton value="topo" sx={{ flex: 1 }}>
          Topograficzna 1:25k
        </ToggleButton>
        <ToggleButton value="arkusz100" sx={{ flex: 1 }}>
          Arkusz 1:100k
        </ToggleButton>
        <ToggleButton value="wojskowa" sx={{ flex: 1 }}>
          Mapa wojskowa
        </ToggleButton>
      </ToggleButtonGroup>
      <Typography variant="body2" color="text.secondary">
        {military
          ? 'Claude czyta naniesioną sytuację bojową: linię frontu, okopy, stanowiska, punkty dowodzenia, przeprawy, pola minowe i mogiły. Kandydaci NMT przy pozycjach dostają ostrzeżenie o niewybuchach.'
          : profile === 'arkusz100'
            ? 'Arkusz 1:100 000 (KdDR, WIG): Claude czyta skróty z legendy (M. młyn, Whs. karczma, Gut folwark, Fh. leśniczówka, Zgl. cegielnia) i całe wsie. Zostają wsie, których dziś nie ma, oraz miejsca przy znaku, nie przy nazwie.'
            : 'Claude czyta widoczny fragment mapy historycznej: domy, młyny, karczmy, folwarki. Aplikacja porównuje je z dzisiejszymi budynkami (BDOT10k) i proponuje miejsca, których już nie ma.'}
      </Typography>
      {military && (
        <Typography variant="caption" color="warning.main">
          {MILITARY_MAP_NOTE}
        </Typography>
      )}

      {!BACKEND_ENABLED ? (
        <Typography variant="caption" color="warning.main">
          Odczyt map wymaga serwera analizy, a ta wersja aplikacji go nie ma.
        </Typography>
      ) : !member ? (
        <SignInPrompt what="Odczyt map przez AI" />
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
              ? `Czyta: ${source.label}. Przybliż mapę tak, by widok miał najwyżej ok. ${maxViewKm} km.`
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
                disabled={!source}
                startIcon={<Icon name="search" size={18} />}
                onClick={() => void run()}
              >
                Szukaj w widoku
              </Button>
            </Stack>
          )}
          {source && <CompareMaps source={source} model={model} topographic={!military} />}
          {source?.kind === 'own' && (
            <WholeMapReading source={source} map={source.map} model={model} profile={profile} />
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
