import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Slide from '@mui/material/Slide';
import Typography from '@mui/material/Typography';
import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { glass, Icon, useToastStore } from '@/shared/ui';
import { UPDATE_CHECK_MS } from '../config/updates';

/** Registers the service worker; offers a reload when a new version is ready. */
export function UpdatePrompt() {
  const showToast = useToastStore((s) => s.show);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW: (_url, registration) => {
      if (registration) setInterval(() => void registration.update(), UPDATE_CHECK_MS);
    },
  });

  useEffect(() => {
    if (!offlineReady) return;
    showToast('Aplikacja jest zapisana i otworzy się bez internetu');
    setOfflineReady(false);
  }, [offlineReady, setOfflineReady, showToast]);

  return (
    <Slide direction="down" in={needRefresh} mountOnEnter unmountOnExit>
      <Paper
        role="status"
        sx={(theme) => ({
          ...glass(theme),
          position: 'absolute',
          zIndex: 1400,
          left: '50%',
          transform: 'translateX(-50%) !important',
          top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
          width: 'min(calc(100% - 24px), 440px)',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          pl: 2,
          pr: 1,
          py: 1,
          borderRadius: '16px',
        })}
      >
        <Icon name="sync" size={20} />
        <Typography variant="body2" sx={{ flex: 1 }}>
          Jest nowa wersja aplikacji
        </Typography>
        <Button size="small" variant="contained" onClick={() => void updateServiceWorker(true)}>
          Odśwież
        </Button>
        <IconButton size="small" aria-label="Później" onClick={() => setNeedRefresh(false)}>
          <Icon name="times" size={18} />
        </IconButton>
      </Paper>
    </Slide>
  );
}
