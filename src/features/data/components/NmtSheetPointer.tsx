import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useUiStore } from '@/shared/store/useUiStore';
import { Icon } from '@/shared/ui';

/** Dane: an NMT sheet is loaded where it is analysed, in Analizy. */
export function NmtSheetPointer() {
  const showAnalyses = useUiStore((s) => s.showAnalyses);
  return (
    <Stack data-tour="data-nmt" spacing={1}>
      <Typography variant="overline" color="text.secondary">
        Arkusz NMT
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Arkusz NMT (.asc, GeoTIFF) wczytujesz w Analizach: wczytanie od razu rozpoznaje w nim formy
        terenu.
      </Typography>
      <Button
        variant="outlined"
        color="inherit"
        startIcon={<Icon name="microscope" size={18} />}
        onClick={() => showAnalyses('nmt')}
        sx={{ alignSelf: 'flex-start' }}
      >
        Otwórz Analizy
      </Button>
    </Stack>
  );
}
