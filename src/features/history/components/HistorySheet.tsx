import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
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
import { useSeenOnView } from '../hooks/useSeenOnView';
import { useViewSource } from '../hooks/useViewSource';
import { addSightedObjects } from '../services/addSightedObjects';
import { useContextStore } from '../store/useContextStore';
import { addedToast } from '../utils/addedToast';
import { contextLine } from '../utils/contextLine';
import { createContextPoint } from '../utils/createContextPoint';
import { representativePoint } from '../utils/representativePoint';
import { viewSighting } from '../utils/viewSighting';
import { CommunitySection } from './CommunitySection';
import { OwnMapsSection } from './OwnMapsSection';

interface HistorySheetProps {
  onClose: () => void;
}

/** Own historical maps and objects from archival maps: add, show, mark at the crosshair. */
export function HistorySheet({ onClose }: HistorySheetProps) {
  const { features, setVisible, onlyViewMap } = useContextStore();
  const seenOnView = useSeenOnView();
  const picking = usePointDraftStore((s) => s.picking);
  const startPicking = usePointDraftStore((s) => s.startPicking);
  const showContext = useUiStore((s) => s.showContext);
  const flyTo = useMapViewStore((s) => s.flyTo);
  const showToast = useToastStore((s) => s.show);
  const [kind, setKind] = useState<ContextKind | null>(null);
  const view = useViewSource();

  // "Gotowe" on the crosshair bar sets a location: save it with the chosen kind
  useEffect(
    () =>
      usePointDraftStore.subscribe((s, prev) => {
        if (!kind || !prev.picking || s.picking || s.source !== 'crosshair' || !s.location) return;
        const { lat, lng } = s.location;
        const seen = viewSighting(
          view ?? { ref: { kind: 'none', label: MANUAL_SOURCE } },
          'reczne',
        );
        const point = createContextPoint(kind, lat, lng, view?.label ?? MANUAL_SOURCE, [seen]);
        void addSightedObjects([point]).then((counts) => {
          showToast(addedToast(counts, CONTEXT_KINDS[kind].label.toLowerCase()));
          setVisible(true);
        });
        setKind(null);
        usePointDraftStore.getState().reset();
      }),
    [kind, view, setVisible, showToast],
  );

  // closing the sheet mid-way must not leave the crosshair on the map
  useEffect(() => () => usePointDraftStore.getState().reset(), []);

  const filter = onlyViewMap && seenOnView;
  const sorted = features
    .filter((f) => !filter || filter.has(f.id))
    .sort((a, b) => CONTEXT_KIND_ORDER.indexOf(a.kind) - CONTEXT_KIND_ORDER.indexOf(b.kind));

  return (
    <>
      {picking && <PickLocationBar />}
      <Sheet title="Mapy i obiekty historyczne" onClose={onClose} hidden={picking}>
        <Stack spacing={2}>
          <CommunitySection />

          <Divider />

          <OwnMapsSection />

          <Divider />

          <Typography variant="body2" color="text.secondary">
            Dawne osady, młyny, karczmy, brody i drogi. Kandydaci z analizy NMT blisko nich dostają
            wyższy wynik, bez względu na to, którą mapę oglądasz. Zaznacz je, patrząc na mapę
            historyczną; obiekt pamięta, na których mapach go widziano.
          </Typography>
          {filter && (
            <Typography variant="caption" color="text.secondary">
              Lista pokazuje tylko obiekty z widocznej mapy (filtr w Warstwach).
            </Typography>
          )}

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
              Źródło: {view?.label ?? MANUAL_SOURCE}
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
                      <ListItemText primary={k.label} secondary={contextLine(f)} />
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
