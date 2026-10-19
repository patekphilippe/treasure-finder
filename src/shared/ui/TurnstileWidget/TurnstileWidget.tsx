import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useEffect, useRef, useState } from 'react';
import { TURNSTILE_SITE_KEY } from '../../config/backend';
import { loadTurnstile } from './loadTurnstile';

interface TurnstileWidgetProps {
  /** token for the next send, null when it expired or failed */
  onToken: (token: string | null) => void;
  /** change it to get a fresh token after a send (a token works once) */
  resetKey: number;
}

/** Cloudflare's check that a person, not a bot, sends the source. */
export function TurnstileWidget({ onToken, resetKey }: TurnstileWidgetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let id: string | null = null;
    let api: Awaited<ReturnType<typeof loadTurnstile>> | null = null;
    let cancelled = false;
    loadTurnstile()
      .then((t) => {
        if (cancelled || !ref.current) return;
        api = t;
        id = t.render(ref.current, {
          sitekey: TURNSTILE_SITE_KEY,
          language: 'pl',
          callback: (token) => onToken(token),
          'expired-callback': () => onToken(null),
          'error-callback': () => onToken(null),
        });
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      onToken(null);
      if (api && id) api.remove(id);
    };
  }, [onToken, resetKey]);

  if (failed)
    return (
      <Typography variant="caption" color="error">
        Nie udało się wczytać weryfikacji. Sprawdź połączenie z internetem.
      </Typography>
    );
  return <Box ref={ref} sx={{ minHeight: 65 }} />;
}
