import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { cleanEmail } from '@/shared/lib/cleanEmail';
import type { AdminMember } from '@/shared/types/community';
import { formatDate } from '@/shared/lib/format';
import { adminApi } from '../services/adminApi';
import { InviteAlert } from './InviteAlert';

/** Owner's list of community members: invite by e-mail address, change the address, block. */
export function AdminMembers() {
  const [members, setMembers] = useState<AdminMember[] | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [fresh, setFresh] = useState<{ name: string; email: string } | null>(null);
  const [editing, setEditing] = useState<{ id: string; email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    adminApi
      .members()
      .then((m) => alive && setMembers(m))
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : 'Błąd'));
    return () => {
      alive = false;
    };
  }, []);

  const reload = async () => setMembers(await adminApi.members());
  const attempt = async (job: () => Promise<void>) => {
    try {
      setError(null);
      await job();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Błąd');
    }
  };

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Zaproś zaufaną osobę: wpisz adres konta Google, którym będzie się logować, i wyślij jej
        zaproszenie ze swojej poczty. Zarejestrować się mogą tylko zaproszone adresy.
      </Typography>
      <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          label="Imię albo pseudonim"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ flex: '1 1 160px' }}
        />
        <TextField
          size="small"
          type="email"
          label="Adres e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ flex: '2 1 220px' }}
        />
        <Button
          variant="contained"
          disabled={!name.trim() || !cleanEmail(email)}
          onClick={() =>
            void attempt(async () => {
              const m = await adminApi.invite(name.trim(), email);
              setFresh({ name: m.name, email: m.email });
              setName('');
              setEmail('');
              await reload();
            })
          }
        >
          Zaproś
        </Button>
      </Stack>
      {fresh && <InviteAlert {...fresh} onClose={() => setFresh(null)} />}
      {error && <Alert severity="error">{error}</Alert>}
      {members?.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          Nikogo jeszcze nie zaprosiłeś.
        </Typography>
      )}
      {members?.map((m) => (
        <Paper key={m.id} variant="outlined" sx={{ p: 1.5, borderRadius: '12px' }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Stack sx={{ flex: '1 1 220px' }}>
              <Typography variant="subtitle2">
                {m.name}
                {m.blocked && ' (zablokowany)'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {m.email ?? 'bez adresu e-mail: dopisz go, żeby ta osoba mogła się zalogować'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                od {formatDate(m.createdAt)} ·{' '}
                {m.linked ? `ostatnio ${m.lastSeenDay ?? 'dziś'}` : 'czeka na pierwsze logowanie'} ·
                punkty: {m.objects} · głosy: {m.votes}
              </Typography>
            </Stack>
            {m.email && !m.linked && !m.blocked && (
              <Button size="small" onClick={() => setFresh({ name: m.name, email: m.email! })}>
                Zaproszenie
              </Button>
            )}
            <Button
              size="small"
              color="inherit"
              onClick={() => setEditing({ id: m.id, email: m.email ?? '' })}
            >
              {m.email ? 'Zmień adres' : 'Dopisz adres'}
            </Button>
            <Button
              size="small"
              color={m.blocked ? 'primary' : 'error'}
              onClick={() =>
                void attempt(async () => {
                  await adminApi.block(m.id, !m.blocked);
                  await reload();
                })
              }
            >
              {m.blocked ? 'Odblokuj' : 'Zablokuj'}
            </Button>
          </Stack>
          {editing?.id === m.id && (
            <Stack direction="row" sx={{ gap: 1, mt: 1.5 }}>
              <TextField
                size="small"
                type="email"
                label="Adres e-mail konta Google"
                value={editing.email}
                onChange={(e) => setEditing({ id: m.id, email: e.target.value })}
                sx={{ flex: 1 }}
                autoFocus
              />
              <Button
                variant="contained"
                disabled={!cleanEmail(editing.email)}
                onClick={() =>
                  void attempt(async () => {
                    await adminApi.setEmail(m.id, editing.email);
                    setEditing(null);
                    setFresh({ name: m.name, email: cleanEmail(editing.email)! });
                    await reload();
                  })
                }
              >
                Zapisz
              </Button>
              <Button color="inherit" onClick={() => setEditing(null)}>
                Anuluj
              </Button>
            </Stack>
          )}
        </Paper>
      ))}
    </Stack>
  );
}
