import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import type { AdminMember } from '@/shared/types/community';
import { formatDate } from '@/shared/lib/format';
import { useToastStore } from '@/shared/ui';
import { adminApi } from '../services/adminApi';
import { inviteLink } from '../utils/inviteLink';

/** Owner's list of community members: invite by link, block and unblock. */
export function AdminMembers() {
  const [members, setMembers] = useState<AdminMember[] | null>(null);
  const [name, setName] = useState('');
  const [fresh, setFresh] = useState<{ name: string; link: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const showToast = useToastStore((s) => s.show);

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

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Zaproś zaufaną osobę: dostanie link, który otwiera aplikację i od razu dołącza ją do
        społeczności. Link pokazuje się tylko raz; zgubiony zablokuj i wygeneruj nowy.
      </Typography>
      <Stack direction="row" sx={{ gap: 1 }}>
        <TextField
          size="small"
          label="Imię albo pseudonim"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ flex: 1 }}
        />
        <Button
          variant="contained"
          disabled={!name.trim()}
          onClick={async () => {
            try {
              const m = await adminApi.invite(name.trim());
              setFresh({ name: m.name, link: inviteLink(m.code) });
              setName('');
              await reload();
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Błąd');
            }
          }}
        >
          Zaproś
        </Button>
      </Stack>
      {fresh && (
        <Alert severity="success" onClose={() => setFresh(null)}>
          <Stack spacing={1}>
            <Typography variant="body2">
              Link dla: <b>{fresh.name}</b>. Wyślij go tej osobie, np. komunikatorem.
            </Typography>
            <Typography variant="caption" sx={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
              {fresh.link}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              sx={{ alignSelf: 'flex-start' }}
              onClick={() =>
                void navigator.clipboard
                  .writeText(fresh.link)
                  .then(() => showToast('Skopiowano link'))
              }
            >
              Kopiuj link
            </Button>
          </Stack>
        </Alert>
      )}
      {error && <Alert severity="error">{error}</Alert>}
      {members?.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          Nikogo jeszcze nie zaprosiłeś.
        </Typography>
      )}
      {members?.map((m) => (
        <Paper key={m.id} variant="outlined" sx={{ p: 1.5, borderRadius: '12px' }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            <Stack sx={{ flex: 1 }}>
              <Typography variant="subtitle2">
                {m.name}
                {m.blocked && ' (zablokowany)'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                od {formatDate(m.createdAt)} · ostatnio {m.lastSeenDay ?? 'jeszcze nie był'} ·
                punkty: {m.objects} · głosy: {m.votes}
              </Typography>
            </Stack>
            <Button
              size="small"
              color={m.blocked ? 'primary' : 'error'}
              onClick={async () => {
                await adminApi.block(m.id, !m.blocked);
                await reload();
              }}
            >
              {m.blocked ? 'Odblokuj' : 'Zablokuj'}
            </Button>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
