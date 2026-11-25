import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import { useUiStore } from '@/shared/store/useUiStore';
import { Icon, ToggleRow } from '@/shared/ui';
import { CONTEXT_MIN_ZOOM } from '../config/contextKinds';
import { useContextStore } from '../store/useContextStore';

/**
 * Warstwy: archival objects on the map (the analysis counts them even when hidden) and the way
 * to their list. Hidden while there are none.
 */
export function ContextLayerRow() {
  const count = useContextStore((s) => s.features.length);
  const visible = useContextStore((s) => s.visible);
  const setVisible = useContextStore((s) => s.setVisible);
  const showSheet = useUiStore((s) => s.showSheet);
  const tooFar = useMapViewStore((s) => s.zoom < CONTEXT_MIN_ZOOM);
  // no objects yet: no tile
  if (count === 0) return null;

  return (
    <ToggleRow
      icon="map-marked-alt"
      title={`Obiekty ze starych map (${count})`}
      caption="Młyny, karczmy, dawne wsie i inne ślady"
      checked={visible}
      onChange={setVisible}
    >
      {tooFar && (
        <Typography variant="body2" color="text.secondary">
          Przybliż mapę, a obiekty się pokażą.
        </Typography>
      )}
      <Button
        variant="outlined"
        color="inherit"
        size="small"
        startIcon={<Icon name="list-ul" size={16} />}
        onClick={() => showSheet('history')}
        sx={{ alignSelf: 'flex-start' }}
      >
        Lista i dodawanie
      </Button>
    </ToggleRow>
  );
}
