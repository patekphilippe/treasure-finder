import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { signIn } from '@/shared/auth/signIn';
import { AUTH_ENABLED } from '@/shared/config/auth';
import { Icon } from '../Icon/Icon';
import { useToastStore } from '../Toast/useToastStore';

interface SignInPromptProps {
  /** the closed feature, e.g. "Odczyt map przez AI" */
  what: string;
}

/** In place of an analysis on the server: it is for signed-in people with an invitation. */
export function SignInPrompt({ what }: SignInPromptProps) {
  const showToast = useToastStore((s) => s.show);
  const [busy, setBusy] = useState(false);
  return (
    <Stack spacing={1} sx={{ alignItems: 'flex-start' }}>
      <Typography variant="body2" color="text.secondary">
        {what} jest dla zalogowanych osób z zaproszeniem
        {AUTH_ENABLED
          ? '. Zaloguj się kontem Google, na którego adres przyszło zaproszenie.'
          : '. Logowanie nie jest jeszcze włączone.'}
      </Typography>
      {AUTH_ENABLED && (
        <Button
          variant="contained"
          size="small"
          disabled={busy}
          startIcon={<Icon name="sign-in-alt" size={16} />}
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
      )}
    </Stack>
  );
}
