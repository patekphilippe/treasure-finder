import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useCallback, useEffect, useState } from 'react';
import { SOURCES_ENABLED } from '../config/sourcesApi';
import { adminApi, adminToken, type AdminSubmission } from '../services/adminApi';
import { AdminCommunityObjects } from './AdminCommunityObjects';
import { AdminMembers } from './AdminMembers';
import { AdminSubmissionCard } from './AdminSubmissionCard';

/** Owner's panel (…/#admin): submissions, community members and the shared base. Token only for the owner. */
export function AdminPanel() {
  const [token, setToken] = useState(adminToken.get());
  const [items, setItems] = useState<AdminSubmission[] | null>(null);
  const [budget, setBudget] = useState<{
    month: string;
    spentUsd: number;
    budgetUsd: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'submissions' | 'members' | 'objects'>('submissions');

  const load = useCallback(async () => {
    try {
      const [list, b] = await Promise.all([adminApi.list(), adminApi.budget()]);
      setError(null);
      setItems(list);
      setBudget(b);
    } catch (e) {
      setItems(null);
      setError(e instanceof Error ? e.message : 'Nie udało się wczytać');
    }
  }, []);

  // first load with a saved token; state is set only from the promise, after the effect
  useEffect(() => {
    if (!SOURCES_ENABLED || !adminToken.get()) return;
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
  }, []);

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
        <Stack direction="row" sx={{ gap: 1 }}>
          <TextField
            size="small"
            type="password"
            label="Token panelu (ADMIN_TOKEN)"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            sx={{ flex: 1 }}
          />
          <Button
            variant="contained"
            disabled={!SOURCES_ENABLED}
            onClick={() => {
              adminToken.set(token.trim());
              void load();
            }}
          >
            Wczytaj
          </Button>
        </Stack>
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
