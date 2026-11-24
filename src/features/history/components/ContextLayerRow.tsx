import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import { useUiStore } from '@/shared/store/useUiStore';
import { Icon, ToggleRow } from '@/shared/ui';
import { CONTEXT_MIN_ZOOM } from '../config/contextKinds';
import { useSeenOnView } from '../hooks/useSeenOnView';
import { useContextStore } from '../store/useContextStore';

/**
 * Warstwy: archival objects on the map, optionally only those seen on the visible map (the
 * rest dimmed; the analysis still counts them all), and the way to their list. Hidden while
 * there are none.
 */
export function ContextLayerRow() {
  const count = useContextStore((s) => s.features.length);
  const visible = useContextStore((s) => s.visible);
  const setVisible = useContextStore((s) => s.setVisible);
  const onlyViewMap = useContextStore((s) => s.onlyViewMap);
  const setOnlyViewMap = useContextStore((s) => s.setOnlyViewMap);
  const seenOnView = useSeenOnView();
  const showSheet = useUiStore((s) => s.showSheet);
  const filter = onlyViewMap && seenOnView;
  const tooFar = useMapViewStore((s) => s.zoom < CONTEXT_MIN_ZOOM);
  // no objects yet: no row
  if (count === 0) return null;

  return (
    <ToggleRow
      icon="map-marked-alt"
      title={`Obiekty ze starych map (${count})`}
      caption="Młyny, karczmy, dawne wsie i inne ślady"
      checked={visible}
      onChange={setVisible}
    >
      {tooFar && count > 0 && (
        <Typography variant="caption" color="text.secondary">
          Przybliż mapę do obszaru wielkości miasta, a obiekty się pokażą.
        </Typography>
      )}
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        {seenOnView && (
          <Chip
            size="small"
            icon={<Icon name="filter" size={14} />}
            label={`Tylko z widocznej mapy (${seenOnView.size})`}
            color={filter ? 'primary' : 'default'}
            variant={filter ? 'filled' : 'outlined'}
            onClick={() => setOnlyViewMap(!onlyViewMap)}
          />
        )}
        <Button
          size="small"
          color="inherit"
          startIcon={<Icon name="list-ul" size={16} />}
          onClick={() => showSheet('history')}
        >
          Lista i dodawanie
        </Button>
      </Stack>
    </ToggleRow>
  );
}
