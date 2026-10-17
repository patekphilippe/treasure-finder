import Snackbar from '@mui/material/Snackbar';
import { useToastStore } from './useToastStore';

const TOAST_MS = 2600;

export function Toast() {
  const { message, key, hide } = useToastStore();

  return (
    <Snackbar
      key={key}
      open={message !== null}
      message={message}
      autoHideDuration={TOAST_MS}
      onClose={hide}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px) !important' }}
    />
  );
}
