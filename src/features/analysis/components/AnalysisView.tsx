import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { MapView } from '@/features/map';
import { EmptyState, glass, Icon, useToastStore } from '@/shared/ui';
import { useAnalysisStore } from '../store/useAnalysisStore';

export function AnalysisView() {
  const candidates = useAnalysisStore((s) => s.candidates);
  const showToast = useToastStore((s) => s.show);
  const isPhone = useMediaQuery((theme) => theme.breakpoints.down('md'));

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
          right: 12,
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
          // phone: bottom sheet sized to its content; laptop: full-height side panel
          left: { xs: 12, md: 'auto' },
          top: { xs: 'auto', md: 12 },
          width: { md: 384 },
          maxHeight: { xs: '60vh', md: 'none' },
        })}
      >
        <Stack spacing={1.5} sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ flex: 1 }}>
              Kandydaci
            </Typography>
            <Chip
              size="small"
              label={candidates.length}
              sx={{ borderRadius: '8px', minWidth: 32 }}
            />
          </Stack>
          <Stack
            direction="row"
            sx={{
              gap: 1,
              alignItems: 'flex-start',
              color: 'text.secondary',
              bgcolor: 'action.hover',
              borderRadius: '10px',
              px: 1.5,
              py: 1,
            }}
          >
            <Icon name="info-circle" size={18} sx={{ mt: '1px' }} />
            <Typography variant="caption" sx={{ lineHeight: 1.5 }}>
              Ocena pokazuje potencjał miejsca — ślad dawnej działalności człowieka, a nie
              przewidywanie znaleziska.
            </Typography>
          </Stack>
        </Stack>
        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {candidates.length === 0 && (
            <EmptyState
              icon="file-upload"
              title="Wczytaj arkusz NMT"
              description={`ESRI ASCII Grid (.asc) lub GeoTIFF, EPSG:2180, siatka 1 m lub 0,5 m.${isPhone ? ' Analiza działa najlepiej na laptopie.' : ''}`}
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
