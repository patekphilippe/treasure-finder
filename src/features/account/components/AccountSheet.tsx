import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { signIn } from '@/shared/auth/signIn';
import { signOut } from '@/shared/auth/signOut';
import { AUTH_ENABLED } from '@/shared/config/auth';
import { useMembership } from '@/shared/store/useMembership';
import { Icon, Sheet, useToastStore } from '@/shared/ui';
import { refreshAccount } from '../services/refreshAccount';

interface AccountSheetProps {
  onClose: () => void;
}

/** My account: who is signed in, the owner's panel for admins, signing in and out. */
export function AccountSheet({ onClose }: AccountSheetProps) {
  const { email, name, owner } = useMembership();
  const showToast = useToastStore((s) => s.show);
  const [busy, setBusy] = useState(false);

  // the name and the admin flag as the backend knows them now
  useEffect(() => {
    if (email) refreshAccount().catch(() => undefined);
  }, [email]);

  return (
    <Sheet title="Moje konto" onClose={onClose}>
      {email ? (
        <Stack spacing={2}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
            <Icon name="user-circle" size={44} sx={{ color: 'primary.main' }} />
            <Stack sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {name}
                </Typography>
                <Chip
                  size="small"
                  label={owner ? 'Administrator' : 'Członek'}
                  color={owner ? 'primary' : 'default'}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                {email}
              </Typography>
            </Stack>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Masz dostęp do społeczności i analiz na serwerze: odczytu map przez AI i wysyłania
            źródeł.
          </Typography>
          {owner && (
            <Button
              variant="contained"
              startIcon={<Icon name="user-shield" size={18} />}
              onClick={() => {
                onClose();
                window.location.hash = '#admin';
              }}
            >
              Panel właściciela
            </Button>
          )}
          <Button
            color="inherit"
            startIcon={<Icon name="sign-out-alt" size={18} />}
            onClick={() => void signOut().then(() => showToast('Wylogowano'))}
          >
            Wyloguj
          </Button>
        </Stack>
      ) : (
        <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
          <Typography variant="body2" color="text.secondary">
            Nie jesteś zalogowany. Konto mają osoby zaproszone przez właściciela: daje dostęp do
            społeczności i analiz na serwerze (odczyt map przez AI, wysyłanie źródeł). Mapa, analiza
            NMT i praca w terenie działają bez konta.
          </Typography>
          {AUTH_ENABLED ? (
            <Button
              variant="contained"
              disabled={busy}
              startIcon={<Icon name="sign-in-alt" size={18} />}
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
          ) : (
            <Typography variant="caption" color="text.secondary">
              Logowanie nie jest jeszcze włączone.
            </Typography>
          )}
        </Stack>
      )}
    </Sheet>
  );
}
