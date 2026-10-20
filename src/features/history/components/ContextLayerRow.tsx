import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { useUiStore } from '@/shared/store/useUiStore';
import { Icon } from '@/shared/ui';
import { useSeenOnView } from '../hooks/useSeenOnView';
import { useContextStore } from '../store/useContextStore';

/**
 * Warstwy: archival objects on the map, optionally only those seen on the visible map (the
 * rest dimmed; the analysis still counts them all), and the way to their list.
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

  return (
    <Stack spacing={0.75} sx={{ pl: 4.5 }}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
        <Typography variant="overline" color="text.secondary" sx={{ flex: 1 }}>
          Obiekty z map ({count})
        </Typography>
        <Switch
          size="small"
          checked={visible}
          onChange={(e) => setVisible(e.target.checked)}
          slotProps={{ input: { 'aria-label': 'Pokaż obiekty z map' } }}
        />
      </Stack>
      <Stack
        data-tour="history-filter"
        direction="row"
        sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}
      >
        <Chip
          size="small"
          icon={<Icon name="filter" size={14} />}
          label={`Tylko z widocznej mapy (${seenOnView?.size ?? 0})`}
          color={filter ? 'primary' : 'default'}
          variant={filter ? 'filled' : 'outlined'}
          disabled={!seenOnView}
          onClick={() => setOnlyViewMap(!onlyViewMap)}
        />
        <Button
          size="small"
          color="inherit"
          startIcon={<Icon name="list-ul" size={16} />}
          onClick={() => showSheet('history')}
        >
          Lista i dodawanie
        </Button>
      </Stack>
    </Stack>
  );
}
