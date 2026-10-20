import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { signIn } from '@/shared/auth/signIn';
import { signOut } from '@/shared/auth/signOut';
import { AUTH_ENABLED } from '@/shared/config/auth';
import { useMembership } from '@/shared/store/useMembership';
import { SOURCES_ENABLED } from '../config/sourcesApi';
import { adminApi, type AdminSubmission } from '../services/adminApi';
import { AdminCommunityObjects } from './AdminCommunityObjects';
import { AdminMembers } from './AdminMembers';
import { AdminSubmissionCard } from './AdminSubmissionCard';

/** Owner's panel (…/#admin): submissions, community members and the shared base. Only for the owner's account. */
export function AdminPanel() {
  const email = useMembership((s) => s.email);
  const [items, setItems] = useState<AdminSubmission[] | null>(null);
  const [budget, setBudget] = useState<{
    month: string;
    spentUsd: number;
    budgetUsd: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'submissions' | 'members' | 'objects'>('submissions');

  // load once signed in; state is set only from the promise, after the effect
  useEffect(() => {
    if (!SOURCES_ENABLED || !email) return;
    let alive = true;
    Promise.all([adminApi.list(), adminApi.budget()])
      .then(([list, b]) => {
        if (!alive) return;
        setItems(list);
        setBudget(b);
      })
      .catch(
        (e: unknown) => alive && setError(e instanceof Error ? e.message : 'Nie udało się wczytać'),
      );
    return () => {
      alive = false;
    };
  }, [email]);

  return (
    <Box sx={{ position: 'absolute', inset: 0, overflowY: 'auto', bgcolor: 'background.default' }}>
      <Stack spacing={2} sx={{ maxWidth: 960, mx: 'auto', p: 2, pt: 3 }}>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ flex: 1 }}>
            Panel właściciela
          </Typography>
          <Button onClick={() => (window.location.hash = '')}>Wróć do mapy</Button>
        </Stack>
        {!SOURCES_ENABLED && (
          <Alert severity="info">Backend analizy nie jest skonfigurowany w tej wersji.</Alert>
        )}
        {SOURCES_ENABLED && !AUTH_ENABLED && (
          <Alert severity="info">
            Logowanie nie jest skonfigurowane w tej wersji (docs/BACKEND.md, „Logowanie”).
          </Alert>
        )}
        {AUTH_ENABLED && !email && (
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ flex: 1 }}>
              Zaloguj się kontem właściciela.
            </Typography>
            <Button
              variant="contained"
              onClick={() =>
                signIn('#admin').catch((e: unknown) =>
                  setError(e instanceof Error ? e.message : 'Nie udało się zalogować'),
                )
              }
            >
              Zaloguj się
            </Button>
          </Stack>
        )}
        {email && (
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              Zalogowano: {email}
            </Typography>
            <Button
              color="inherit"
              onClick={() => {
                setItems(null);
                setBudget(null);
                setError(null);
                void signOut();
              }}
            >
              Wyloguj
            </Button>
          </Stack>
        )}
        {budget && (
          <Typography variant="body2" color="text.secondary">
            Wydatki na AI w {budget.month}: {budget.spentUsd.toFixed(3)} $ z {budget.budgetUsd} $
          </Typography>
        )}
        {error && <Alert severity="error">{error}</Alert>}
        {budget && (
          <Tabs value={tab} onChange={(_, v: typeof tab) => setTab(v)} variant="fullWidth">
            <Tab value="submissions" label="Zgłoszenia" />
            <Tab value="members" label="Członkowie" />
            <Tab value="objects" label="Wspólna baza" />
          </Tabs>
        )}
        {budget && tab === 'members' && <AdminMembers />}
        {budget && tab === 'objects' && <AdminCommunityObjects />}
        {tab === 'submissions' && items && !items.length && (
          <Typography variant="body2" color="text.secondary">
            Nic nie czeka na zatwierdzenie.
          </Typography>
        )}
        {tab === 'submissions' &&
          items?.map((it) => (
            <AdminSubmissionCard
              key={it.id}
              item={it}
              onDone={() => setItems((list) => list?.filter((x) => x.id !== it.id) ?? null)}
            />
          ))}
      </Stack>
    </Box>
  );
}
