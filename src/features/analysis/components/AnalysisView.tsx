import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { MapView } from '@/features/map';
import { EmptyState, glass, Icon, useToastStore } from '@/shared/ui';
import { useAnalysisStore } from '../store/useAnalysisStore';

export function AnalysisView() {
  const candidates = useAnalysisStore((s) => s.candidates);
  const showToast = useToastStore((s) => s.show);

  return (
    <Box sx={{ position: 'absolute', inset: 0 }}>
      <MapView />
      <Paper
        component="aside"
        sx={(theme) => ({
          ...glass(theme),
          position: 'absolute',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          overflow: 'hidden',
          top: { xs: 'auto', md: 12 },
          right: 12,
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
          left: { xs: 12, md: 'auto' },
          width: { md: 384 },
          height: { xs: '45%', md: 'auto' },
        })}
      >
        <Stack spacing={0.5} sx={{ px: 2.5, pt: 2.5, pb: 1.5 }}>
          <Typography variant="h5">Kandydaci</Typography>
          <Typography variant="body2" color="text.secondary">
            {candidates.length} wyników
          </Typography>
        </Stack>
        <Box sx={{ px: 2.5 }}>
          <Alert
            severity="info"
            icon={<Icon name="info-circle" size={20} />}
            sx={{ '& .MuiAlert-message': { fontSize: 13 } }}
          >
            Ocena pokazuje potencjał miejsca — ślad dawnej działalności człowieka, a nie
            przewidywanie znaleziska.
          </Alert>
        </Box>
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {candidates.length === 0 && (
            <EmptyState
              icon="file-upload"
              title="Wczytaj arkusz NMT"
              description="ESRI ASCII Grid (.asc) lub GeoTIFF w układzie EPSG:2180, siatka 1 m lub 0,5 m."
              action={
                <Button
                  variant="contained"
                  startIcon={<Icon name="file-upload" size={18} />}
                  onClick={() => showToast('Analiza NMT pojawi się w Etapie 1')}
                >
                  Wybierz plik
                </Button>
              }
            />
          )}
        </Box>
      </Paper>
    </Box>
  );
}
