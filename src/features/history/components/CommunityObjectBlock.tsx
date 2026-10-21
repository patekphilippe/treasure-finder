import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { isDisputed } from '@/shared/types/community';
import type { ContextFeature } from '@/shared/types/domain';
import { useMembership } from '@/shared/store/useMembership';
import { Icon, useToastStore } from '@/shared/ui';
import { communityApi } from '../services/communityApi';
import { shareObjects } from '../services/shareObjects';
import { useContextStore } from '../store/useContextStore';

interface CommunityObjectBlockProps {
  feature: ContextFeature;
}

/** One object and the community: share it, or see who added it and confirm or dispute it. */
export function CommunityObjectBlock({ feature }: CommunityObjectBlockProps) {
  const email = useMembership((s) => s.email);
  const add = useContextStore((s) => s.add);
  const showToast = useToastStore((s) => s.show);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [disputing, setDisputing] = useState(false);
  const c = feature.community;
  if (!email) return null;

  const run = async (job: () => Promise<void>) => {
    setBusy(true);
    try {
      await job();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Nie udało się');
    } finally {
      setBusy(false);
    }
  };

  if (!c)
    return (
      <Button
        variant="outlined"
        disabled={busy}
        startIcon={<Icon name="users" size={18} />}
        onClick={() =>
          void run(async () => {
            await shareObjects([feature]);
            showToast('Udostępniono społeczności');
          })
        }
      >
        Udostępnij społeczności
      </Button>
    );

  const vote = (v: -1 | 0 | 1, text = '') =>
    run(async () => {
      await communityApi.vote(c.id, v, text);
      const up = c.up - (c.mine === 1 ? 1 : 0) + (v === 1 ? 1 : 0);
      const down = c.down - (c.mine === -1 ? 1 : 0) + (v === -1 ? 1 : 0);
      await add([{ ...feature, community: { ...c, up, down, mine: v } }]);
      setDisputing(false);
      setNote('');
    });

  return (
    <Stack spacing={1.25} sx={{ bgcolor: 'action.hover', borderRadius: '12px', p: 1.5 }}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1.25 }}>
        <Icon name="users" size={20} />
        <Stack sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2">Wspólna baza</Typography>
          <Typography variant="caption" color="text.secondary">
            {c.mineAuthor ? 'Twój punkt' : `Od: ${c.author ?? 'zatwierdzone źródło'}`}
          </Typography>
        </Stack>
        <Stack
          direction="row"
          aria-label={`Potwierdzenia: ${c.up}, sprzeciwy: ${c.down}`}
          sx={{ alignItems: 'center', gap: 0.5, color: 'text.secondary' }}
        >
          <Icon name="check" size={16} />
          <Typography variant="body2" sx={{ mr: 1 }}>
            {c.up}
          </Typography>
          <Icon name="times" size={16} />
          <Typography variant="body2">{c.down}</Typography>
        </Stack>
      </Stack>
      {isDisputed(c) && (
        <Alert severity="warning">
          Społeczność to kwestionuje: nie liczy się do oceny kandydatów.
        </Alert>
      )}
      {c.mineAuthor ? (
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          disabled={busy}
          sx={{ alignSelf: 'flex-start' }}
          onClick={() =>
            void run(async () => {
              await communityApi.remove(c.id);
              await add([{ ...feature, community: undefined }]);
              showToast('Usunięto ze wspólnej bazy; zostaje u Ciebie');
            })
          }
        >
          Usuń ze wspólnej bazy
        </Button>
      ) : disputing ? (
        <Stack spacing={1}>
          <TextField
            size="small"
            label="Dlaczego się nie zgadza? (opcjonalnie)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            slotProps={{ htmlInput: { maxLength: 300 } }}
          />
          <Stack direction="row" sx={{ gap: 1, justifyContent: 'flex-end' }}>
            <Button color="inherit" onClick={() => setDisputing(false)}>
              Anuluj
            </Button>
            <Button
              variant="contained"
              color="warning"
              disabled={busy}
              onClick={() => void vote(-1, note)}
            >
              Wyślij
            </Button>
          </Stack>
        </Stack>
      ) : (
        <Stack direction="row" sx={{ gap: 1 }}>
          <Button
            sx={{ flex: 1 }}
            variant={c.mine === 1 ? 'contained' : 'outlined'}
            disabled={busy}
            startIcon={<Icon name="check" size={18} />}
            onClick={() => void vote(c.mine === 1 ? 0 : 1)}
          >
            Potwierdzam
          </Button>
          <Button
            sx={{ flex: 1 }}
            color="warning"
            variant={c.mine === -1 ? 'contained' : 'outlined'}
            disabled={busy}
            startIcon={<Icon name="times" size={18} />}
            onClick={() => (c.mine === -1 ? void vote(0) : setDisputing(true))}
          >
            Nie zgadza się
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
