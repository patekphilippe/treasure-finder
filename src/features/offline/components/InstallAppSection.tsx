import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { detectPlatform } from '@/shared/lib/pwa/detectPlatform';
import { isInstalled } from '@/shared/lib/pwa/isInstalled';
import { Icon } from '@/shared/ui';
import { INSTALL_STEPS } from '../config/install';
import { useInstallStore } from '../store/useInstallStore';

/** Adds the app to the home screen: the browser's dialog where it exists, otherwise the steps. */
export function InstallAppSection() {
  const deferred = useInstallStore((s) => s.deferred);
  const installed = useInstallStore((s) => s.installed);
  const setDeferred = useInstallStore((s) => s.setDeferred);
  const [showSteps, setShowSteps] = useState(false);

  if (installed || isInstalled()) return null;

  const install = async () => {
    if (!deferred) {
      setShowSteps((v) => !v);
      return;
    }
    await deferred.prompt();
    await deferred.userChoice;
    // the event can be used only once; Chrome sends a new one if the user dismissed it
    setDeferred(null);
  };

  return (
    <Stack data-tour="data-install" spacing={1}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Icon name="mobile-alt" size={22} />
        <Stack sx={{ flex: 1 }}>
          <Typography variant="subtitle2">Aplikacja na ekranie głównym</Typography>
          <Typography variant="caption" color="text.secondary">
            Otwiera się z ikony na pełnym ekranie i działa bez internetu
          </Typography>
        </Stack>
        <Button size="small" variant="contained" onClick={() => void install()}>
          Zainstaluj
        </Button>
      </Stack>
      <Collapse in={showSteps && !deferred}>
        <Typography variant="body2" color="text.secondary" sx={{ pl: 4.5 }}>
          {INSTALL_STEPS[detectPlatform()]}
        </Typography>
      </Collapse>
    </Stack>
  );
}
