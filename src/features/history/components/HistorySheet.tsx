import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { findHistoricalLayer, useLayersStore } from '@/features/layers';
import { PickLocationBar } from '@/features/points';
import { bottomSheetOffset } from '@/shared/lib/bottomSheetOffset';
import { useMapViewStore } from '@/shared/store/useMapViewStore';
import { usePointDraftStore } from '@/shared/store/usePointDraftStore';
import { useUiStore } from '@/shared/store/useUiStore';
import { Icon, Sheet, useToastStore } from '@/shared/ui';
import {
  CONTEXT_KIND_ORDER,
  CONTEXT_KINDS,
  MANUAL_SOURCE,
  type ContextKind,
} from '../config/contextKinds';
import { useContextStore } from '../store/useContextStore';
import { createContextPoint } from '../utils/createContextPoint';
import { representativePoint } from '../utils/representativePoint';

interface HistorySheetProps {
  onClose: () => void;
}

/** Objects from archival maps: show them, add one at the crosshair, open the list. */
export function HistorySheet({ onClose }: HistorySheetProps) {
  const { features, visible, setVisible, add } = useContextStore();
  const historical = findHistoricalLayer(useLayersStore((s) => s.historicalId));
  const picking = usePointDraftStore((s) => s.picking);
  const startPicking = usePointDraftStore((s) => s.startPicking);
  const showContext = useUiStore((s) => s.showContext);
  const flyTo = useMapViewStore((s) => s.flyTo);
  const showToast = useToastStore((s) => s.show);
  const [kind, setKind] = useState<ContextKind | null>(null);
  const source = historical ? `${historical.label} (${historical.years})` : MANUAL_SOURCE;

  // "Gotowe" on the crosshair bar sets a location: save it with the chosen kind
  useEffect(
    () =>
      usePointDraftStore.subscribe((s, prev) => {
        if (!kind || !prev.picking || s.picking || s.source !== 'crosshair' || !s.location) return;
        const { lat, lng } = s.location;
        void add([createContextPoint(kind, lat, lng, source)]).then(() => {
          showToast(`Dodano: ${CONTEXT_KINDS[kind].label.toLowerCase()}`);
          setVisible(true);
        });
        setKind(null);
        usePointDraftStore.getState().reset();
      }),
    [kind, source, add, setVisible, showToast],
  );

  // closing the sheet mid-way must not leave the crosshair on the map
  useEffect(() => () => usePointDraftStore.getState().reset(), []);

  const sorted = [...features].sort(
    (a, b) => CONTEXT_KIND_ORDER.indexOf(a.kind) - CONTEXT_KIND_ORDER.indexOf(b.kind),
  );

  return (
    <>
      {picking && <PickLocationBar />}
      <Sheet title="Obiekty z map archiwalnych" onClose={onClose} hidden={picking}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Dawne osady, młyny, karczmy, brody i drogi. Kandydaci z analizy NMT blisko nich dostają
            wyższy wynik. Zaznacz je, patrząc na mapę historyczną.
          </Typography>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
            <Icon name="map-marked-alt" size={22} />
            <Typography variant="subtitle2" sx={{ flex: 1 }}>
              Pokaż na mapie ({features.length})
            </Typography>
            <Switch checked={visible} onChange={(e) => setVisible(e.target.checked)} />
          </Stack>

          <Divider />

          <Stack data-tour="history-add" spacing={1}>
            <Typography variant="overline" color="text.secondary">
              Dodaj obiekt
            </Typography>
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
              {CONTEXT_KIND_ORDER.map((k) => (
                <Chip
                  key={k}
                  icon={<Icon name={CONTEXT_KINDS[k].icon} size={16} />}
                  label={CONTEXT_KINDS[k].label}
                  color={kind === k ? 'primary' : 'default'}
                  variant={kind === k ? 'filled' : 'outlined'}
                  onClick={() => setKind(kind === k ? null : k)}
                />
              ))}
            </Stack>
            <Button
              variant="contained"
              disabled={!kind}
              startIcon={<Icon name="crosshairs" size={18} />}
              onClick={startPicking}
            >
              Wskaż miejsce celownikiem
            </Button>
            <Typography variant="caption" color="text.secondary">
              Źródło: {source}
            </Typography>
          </Stack>

          {sorted.length > 0 && (
            <>
              <Divider />
              <List dense disablePadding>
                {sorted.map((f) => {
                  const k = CONTEXT_KINDS[f.kind];
                  const at = representativePoint(f.geometry);
                  return (
                    <ListItemButton
                      key={f.id}
                      sx={{ borderRadius: '10px' }}
                      onClick={() => {
                        showContext(f.id);
                        if (at) flyTo({ ...at, zoom: 16, offsetY: bottomSheetOffset() });
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36, color: k.color }}>
                        <Icon name={k.icon} size={20} />
                      </ListItemIcon>
                      <ListItemText primary={k.label} secondary={f.source} />
                    </ListItemButton>
                  );
                })}
              </List>
            </>
          )}
        </Stack>
      </Sheet>
    </>
  );
}
