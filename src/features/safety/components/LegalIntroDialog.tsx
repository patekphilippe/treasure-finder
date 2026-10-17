import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Icon } from '@/shared/ui';
import {
  INTRO_DISCLAIMER,
  INTRO_POINTS,
  LEGAL_DETAILS_LABEL,
  LEGAL_DETAILS_URL,
} from '../config/legal';
import { useIntroSeen } from '../hooks/useIntroSeen';

/** Shown once on first launch: search legally, the app is not legal advice. */
export function LegalIntroDialog() {
  const [seen, confirm] = useIntroSeen();

  return (
    <Dialog
      open={!seen}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: '16px' } } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Icon name="balance-scale" size={24} />
        Szukaj zgodnie z prawem
      </DialogTitle>
      <DialogContent>
        <Stack component="ul" sx={{ m: 0, pl: 2.5, gap: 1 }}>
          {INTRO_POINTS.map((p) => (
            <Typography component="li" key={p} variant="body2">
              {p}
            </Typography>
          ))}
        </Stack>
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 2 }}>
          {INTRO_DISCLAIMER}{' '}
          <Link href={LEGAL_DETAILS_URL} target="_blank" rel="noreferrer">
            {LEGAL_DETAILS_LABEL}
          </Link>
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button variant="contained" fullWidth onClick={confirm}>
          Rozumiem
        </Button>
      </DialogActions>
    </Dialog>
  );
}
