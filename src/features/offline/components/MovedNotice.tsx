import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Slide from '@mui/material/Slide';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { APP_HOST, APP_URL, isOldAddress } from '@/shared/config/appAddress';
import { useUiStore } from '@/shared/store/useUiStore';
import { glass, Icon } from '@/shared/ui';

/**
 * On the old GitHub Pages address: the app has moved to trefinder.pl. The data stays with this
 * address in the browser, so it moves by a ZIP backup (own maps included).
 */
export function MovedNotice() {
  const [open, setOpen] = useState(() => isOldAddress(window.location.hostname));
  const setMode = useUiStore((s) => s.setMode);
  const showSheet = useUiStore((s) => s.showSheet);

  return (
    <Slide direction="down" in={open} mountOnEnter unmountOnExit>
      <Paper
        role="status"
        sx={(theme) => ({
          ...glass(theme),
          position: 'absolute',
          zIndex: 1390,
          left: '50%',
          transform: 'translateX(-50%) !important',
          top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
          width: 'min(calc(100% - 24px), 480px)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1,
          pl: 2,
          pr: 1,
          py: 1.25,
          borderRadius: '16px',
        })}
      >
        <Icon name="globe" size={20} sx={{ mt: 0.25 }} />
        <Stack spacing={1} sx={{ flex: 1 }}>
          <Typography variant="body2">
            Aplikacja ma nowy adres: <b>{APP_HOST}</b>. Twoje dane zostały pod tym adresem: pobierz
            kopię ZIP i wczytaj ją tam w Dane → Import. Aplikację zainstaluj na nowo.
          </Typography>
          <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="contained"
              onClick={() => {
                setMode('field');
                showSheet('data');
              }}
            >
              Zrób kopię
            </Button>
            <Button size="small" variant="outlined" href={APP_URL}>
              Otwórz {APP_HOST}
            </Button>
          </Stack>
        </Stack>
        <IconButton size="small" aria-label="Później" onClick={() => setOpen(false)}>
          <Icon name="times" size={18} />
        </IconButton>
      </Paper>
    </Slide>
  );
}
