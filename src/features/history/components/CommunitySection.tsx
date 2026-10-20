import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { COMMUNITY_NOTE } from '@/features/safety';
import { signIn } from '@/shared/auth/signIn';
import { signOut } from '@/shared/auth/signOut';
import { AUTH_ENABLED } from '@/shared/config/auth';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import { useMembership } from '@/shared/store/useMembership';
import { Icon, useToastStore } from '@/shared/ui';
import { useCommunityInView } from '../hooks/useCommunityInView';
import { shareObjects } from '../services/shareObjects';
import { syncCommunity } from '../services/syncCommunity';
import { useContextStore } from '../store/useContextStore';

/** The trusted community: sign in (invited only), bring in the shared base of the view, share own objects. */
export function CommunitySection() {
  const { email, name } = useMembership();
  const features = useContextStore((s) => s.features);
  const showToast = useToastStore((s) => s.show);
  const [busy, setBusy] = useState(false);
  const [inView, setInView] = useCommunityInView(email);
  const unshared = features.filter((f) => !f.community);

  const sync = async () => {
    const bounds = useMapViewStore.getState().bounds;
    if (!bounds) return;
    setBusy(true);
    try {
      setInView(await syncCommunity(bounds));
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Nie udało się pobrać wspólnej bazy');
    } finally {
      setBusy(false);
    }
  };

  if (!AUTH_ENABLED) return null;

  if (!email)
    return (
      <Stack data-tour="community" spacing={1}>
        <Typography variant="overline" color="text.secondary">
          Społeczność
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Wspólna baza dawnych wsi, młynów, karczm i brodów dla zaproszonych osób. Zaloguj się
          kontem Google, na którego adres przyszło zaproszenie.
        </Typography>
        <Button
          variant="contained"
          disabled={busy}
          startIcon={<Icon name="sign-in-alt" size={18} />}
          sx={{ alignSelf: 'flex-start' }}
          onClick={() => {
            setBusy(true);
            signIn()
              .catch((e: unknown) =>
                showToast(e instanceof Error ? e.message : 'Nie udało się zalogować'),
              )
              .finally(() => setBusy(false));
          }}
        >
          Zaloguj się
        </Button>
      </Stack>
    );

  return (
    <Stack data-tour="community" spacing={1}>
      <Typography variant="overline" color="text.secondary">
        Społeczność
      </Typography>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
        <Icon name="users" size={20} />
        <Typography variant="body2" sx={{ flex: 1 }}>
          Jesteś w społeczności jako <b>{name}</b>
          {inView !== null && `. Wspólnych punktów w widoku: ${inView}`}
        </Typography>
      </Stack>
      <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
        <Button
          size="small"
          variant="outlined"
          disabled={busy}
          startIcon={<Icon name="sync" size={16} />}
          onClick={() => void sync()}
        >
          Odśwież widok
        </Button>
        {unshared.length > 0 && (
          <Button
            size="small"
            variant="outlined"
            disabled={busy}
            startIcon={<Icon name="share" size={16} />}
            onClick={() => {
              setBusy(true);
              shareObjects(unshared)
                .then((n) => showToast(`Udostępniono: ${n}`))
                .catch((e: unknown) => showToast(e instanceof Error ? e.message : 'Nie udało się'))
                .finally(() => setBusy(false));
            }}
          >
            Udostępnij moje ({unshared.length})
          </Button>
        )}
        <Button size="small" color="inherit" onClick={() => void signOut()}>
          Wyloguj
        </Button>
      </Stack>
      <Typography variant="caption" color="text.secondary">
        {COMMUNITY_NOTE} Na mapie fioletowa ramka to punkt wspólny, szary: zakwestionowany.
      </Typography>
    </Stack>
  );
}
