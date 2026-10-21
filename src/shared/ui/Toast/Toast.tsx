import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import { useToastStore } from './useToastStore';

const TOAST_MS = 2600;
/** a toast with a button stays long enough to reach it */
const ACTION_TOAST_MS = 8000;

export function Toast() {
  const { message, action, key, hide } = useToastStore();

  return (
    <Snackbar
      key={key}
      open={message !== null}
      message={message}
      autoHideDuration={action ? ACTION_TOAST_MS : TOAST_MS}
      // a tap on the map does not take the button away
      onClose={(_, reason) => !(action && reason === 'clickaway') && hide()}
      action={
        action && (
          <Button
            size="small"
            color="primary"
            onClick={() => {
              hide();
              action.onClick();
            }}
          >
            {action.label}
          </Button>
        )
      }
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px) !important' }}
    />
  );
}
