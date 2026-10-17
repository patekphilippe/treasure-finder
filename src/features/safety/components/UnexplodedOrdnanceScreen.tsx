import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Icon, useToastStore } from '@/shared/ui';
import { UXO_STEPS } from '../config/legal';

interface UnexplodedOrdnanceScreenProps {
  open: boolean;
  /** where the user is / the point lies, for the 112 call */
  coords: { lat: number; lng: number } | null;
  onClose: () => void;
}

/** Full-screen red instruction shown as soon as "Niewybuch" is chosen. */
export function UnexplodedOrdnanceScreen({ open, coords, onClose }: UnexplodedOrdnanceScreenProps) {
  const showToast = useToastStore((s) => s.show);
  const text = coords ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      slotProps={{ paper: { sx: { bgcolor: '#b91c1c', color: '#fff', backgroundImage: 'none' } } }}
    >
      <Stack
        sx={{
          flex: 1,
          px: 3,
          pt: 'calc(env(safe-area-inset-top, 0px) + 32px)',
          pb: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
          maxWidth: 520,
          mx: 'auto',
          width: '100%',
          gap: 3,
        }}
      >
        <Stack sx={{ alignItems: 'center', gap: 1, textAlign: 'center' }}>
          <Icon name="bomb" size={64} />
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
            Niewybuch! Nie dotykaj!
          </Typography>
        </Stack>
        <Stack component="ol" sx={{ m: 0, pl: 3, gap: 1.5 }}>
          {UXO_STEPS.map((step) => (
            <Typography component="li" key={step} variant="h6" sx={{ fontWeight: 600 }}>
              {step}
            </Typography>
          ))}
        </Stack>
        {text && (
          <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>
              Twoje współrzędne
            </Typography>
            <Typography variant="h6" sx={{ fontFeatureSettings: '"tnum"' }}>
              {text}
            </Typography>
          </Box>
        )}
        <Box sx={{ flex: 1 }} />
        <Stack spacing={1.5}>
          <Button
            href="tel:112"
            size="large"
            variant="contained"
            startIcon={<Icon name="phone" size={24} />}
            sx={{
              bgcolor: '#fff',
              color: '#b91c1c',
              py: 1.75,
              fontSize: 18,
              '&:hover': { bgcolor: '#fee2e2' },
            }}
          >
            Zadzwoń 112
          </Button>
          {text && (
            <Button
              size="large"
              variant="outlined"
              startIcon={<Icon name="copy" size={22} />}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(text);
                  showToast('Skopiowano współrzędne');
                } catch {
                  showToast(text);
                }
              }}
              sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.6)' }}
            >
              Kopiuj współrzędne
            </Button>
          )}
          <Button size="large" onClick={onClose} sx={{ color: '#fff' }}>
            Rozumiem
          </Button>
        </Stack>
      </Stack>
    </Dialog>
  );
}
